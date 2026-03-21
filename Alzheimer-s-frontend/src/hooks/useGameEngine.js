import { useState, useRef, useCallback } from 'react'

const LEVEL_CONFIG = {
  1: { grid: 3, litDuration: 700,  seqLen: 4,  interval: 1000, label: 'Novice',   recallTime: 20 },
  2: { grid: 4, litDuration: 600,  seqLen: 6,  interval: 900,  label: 'Standard', recallTime: 25 },
  3: { grid: 4, litDuration: 550,  seqLen: 8,  interval: 800,  label: 'Advanced', recallTime: 30 },
  4: { grid: 5, litDuration: 450,  seqLen: 10, interval: 700,  label: 'Expert',   recallTime: 35 },
  5: { grid: 5, litDuration: 380,  seqLen: 12, interval: 600,  label: 'Elite',    recallTime: 40 },
}

const PHASE = {
  IDLE:      'idle',
  COUNTDOWN: 'countdown',
  WATCHING:  'watching',
  RECALLING: 'recalling',
  RESULT:    'result',
  COMPLETE:  'complete',
}

export function useGameEngine(totalLevels = 3) {
  const [phase,       setPhase]       = useState(PHASE.IDLE)
  const [currentLvl,  setCurrentLvl]  = useState(1)
  const [litCell,     setLitCell]     = useState(null)
  const [cellState,   setCellState]   = useState({})
  const [countdown,   setCountdown]   = useState(3)
  const [recallLeft,  setRecallLeft]  = useState(0)
  const [recallIdx,   setRecallIdx]   = useState(0)
  const [lvlStats,    setLvlStats]    = useState([])
  const [totalStats,  setTotalStats]  = useState(null)
  const [apiResult,   setApiResult]   = useState(null)
  const [apiLoading,  setApiLoading]  = useState(false)
  const [apiError,    setApiError]    = useState(null)
  const [userProfile, setUserProfile] = useState({ age: 65, apoe4: 0, pteducat: 12 })

  const seqRef        = useRef([])
  // correctRef = number of sequence positions answered correctly (max = seqLen, never more)
  const correctRef    = useRef(0)
  const mistakesRef   = useRef(0)
  const recallIdxRef  = useRef(0)       // sync mirror of recallIdx state — safe to read in callbacks
  const startTimeRef  = useRef(0)
  const watchTimerRef = useRef(null)
  const recallTickRef = useRef(null)
  const cdTimerRef    = useRef(null)
  const currentLvlRef = useRef(1)       // always-current mirror of currentLvl state
  const finishedRef   = useRef(false)   // guard: prevents finishLevel from running twice

  const cfg = LEVEL_CONFIG[Math.min(currentLvl, 5)]
  currentLvlRef.current = currentLvl

  // ── helpers ──────────────────────────────────────────────
  const clearTimers = useCallback(() => {
    clearTimeout(watchTimerRef.current)
    clearInterval(recallTickRef.current)
    clearInterval(cdTimerRef.current)
  }, [])

  const buildSequence = useCallback((c) => {
    const seq = []
    let last = -1
    for (let i = 0; i < c.seqLen; i++) {
      let cell
      do { cell = Math.floor(Math.random() * c.grid * c.grid) } while (cell === last)
      seq.push(cell)
      last = cell
    }
    return seq
  }, [])

  // ── PHASE 1: WATCHING ────────────────────────────────────
  const playWatchSequence = useCallback((c, seq) => {
    setPhase(PHASE.WATCHING)
    setLitCell(null)
    setCellState({})
    let step = 0
    const showNext = () => {
      if (step >= seq.length) {
        setLitCell(null)
        watchTimerRef.current = setTimeout(() => beginRecall(c), 600)
        return
      }
      const cell = seq[step]
      setLitCell(cell)
      watchTimerRef.current = setTimeout(() => {
        setLitCell(null)
        watchTimerRef.current = setTimeout(() => { step++; showNext() }, c.interval - c.litDuration)
      }, c.litDuration)
    }
    showNext()
  }, []) // eslint-disable-line

  // ── PHASE 2: RECALLING ───────────────────────────────────
  const beginRecall = useCallback((c) => {
    correctRef.current   = 0
    mistakesRef.current  = 0
    recallIdxRef.current = 0             // reset sync index
    finishedRef.current  = false         // reset guard for this level
    startTimeRef.current = Date.now()
    setRecallIdx(0)
    setCellState({})
    setRecallLeft(c.recallTime)
    setPhase(PHASE.RECALLING)

    // Tick every 200ms using wall-clock time — never call side effects inside a state updater
    const recallEndTime = Date.now() + c.recallTime * 1000
    recallTickRef.current = setInterval(() => {
      const remaining = Math.ceil((recallEndTime - Date.now()) / 1000)
      if (remaining <= 0) {
        clearInterval(recallTickRef.current)
        setRecallLeft(0)
        finishLevelRef.current()
      } else {
        setRecallLeft(remaining)
      }
    }, 200)
  }, []) // eslint-disable-line

  const finishLevelRef = useRef(null)

  const finishLevel = useCallback(() => {
    // Guard: if already called for this level, do nothing
    if (finishedRef.current) return
    finishedRef.current = true

    clearTimers()
    const elapsed = (Date.now() - startTimeRef.current) / 1000
    const lvl     = currentLvlRef.current
    const c       = LEVEL_CONFIG[Math.min(lvl, 5)]

    // correct = how many sequence positions the player hit correctly
    // This is already tracked as "advance recallIdx on hit" so correctRef
    // equals the number of positions answered, never exceeding seqLen
    const correct   = Math.min(correctRef.current, c.seqLen)
    const mistakes  = mistakesRef.current
    const accuracy  = Math.round((correct / c.seqLen) * 100)  // 0–100, always

    const stat = {
      level:         lvl,
      correct,
      mistakes,
      maxMistakes:   c.seqLen,
      timeTaken:     Math.round(elapsed),
      maxTime:       c.recallTime,
      accuracy,
      learningScore: Math.max(0, correct - mistakes),
      maxLearning:   c.seqLen,
    }
    setLitCell(null)
    setCellState({})
    setLvlStats(prev => [...prev, stat])
    setPhase(PHASE.RESULT)
  }, [clearTimers])

  finishLevelRef.current = finishLevel

  // ── Player taps a cell ───────────────────────────────────
  const handleCellClick = useCallback((cellIdx) => {
    if (phase !== PHASE.RECALLING) return
    if (finishedRef.current) return          // level already finished — ignore stray taps

    const currentIdx = recallIdxRef.current  // read from ref, not state
    const expected   = seqRef.current[currentIdx]

    if (cellIdx === expected) {
      // Correct tap — advance position
      const next = currentIdx + 1
      correctRef.current  += 1
      recallIdxRef.current = next
      setRecallIdx(next)
      setCellState(s => ({ ...s, [cellIdx]: 'hit' }))
      setTimeout(() => setCellState(s => ({ ...s, [cellIdx]: 'idle' })), 350)

      if (next >= seqRef.current.length) {
        // All recalled — cancel timer and finish (outside any updater)
        clearInterval(recallTickRef.current)
        setTimeout(() => finishLevelRef.current(), 400)
      }
    } else {
      // Wrong tap — mistake, don't advance
      mistakesRef.current += 1
      setCellState(s => ({ ...s, [cellIdx]: 'miss' }))
      setTimeout(() => setCellState(s => ({ ...s, [cellIdx]: 'idle' })), 350)
    }
  }, [phase])

  // ── Countdown ────────────────────────────────────────────
  const runCountdown = useCallback((lvl) => {
    setCountdown(3)
    setPhase(PHASE.COUNTDOWN)
    let cd = 3
    cdTimerRef.current = setInterval(() => {
      cd--
      setCountdown(cd)
      if (cd <= 0) {
        clearInterval(cdTimerRef.current)
        const c   = LEVEL_CONFIG[Math.min(lvl, 5)]
        const seq = buildSequence(c)
        seqRef.current = seq
        playWatchSequence(c, seq)
      }
    }, 900)
  }, [buildSequence, playWatchSequence])

  // ── Start game ───────────────────────────────────────────
  const startGame = useCallback(() => {
    clearTimers()
    setPhase(PHASE.IDLE)
    setCurrentLvl(1)
    currentLvlRef.current = 1
    finishedRef.current   = false
    setLitCell(null)
    setCellState({})
    setRecallIdx(0)
    setLvlStats([])
    setTotalStats(null)
    setApiResult(null)
    setApiError(null)
    seqRef.current       = []
    correctRef.current   = 0
    mistakesRef.current  = 0
    recallIdxRef.current = 0
    setTimeout(() => runCountdown(1), 50)
  }, [clearTimers, runCountdown])

  // ── Next level or complete ───────────────────────────────
  const nextLevel = useCallback(() => {
    if (currentLvl >= totalLevels) {
      setLvlStats(prev => {
        const all = [...prev]
        // Use each level's already-capped `correct` and `maxMistakes`
        const totCorrect  = all.reduce((s, l) => s + l.correct,       0)
        const totMistakes = all.reduce((s, l) => s + l.mistakes,      0)
        const totMaxMis   = all.reduce((s, l) => s + l.maxMistakes,   0)
        const totTime     = all.reduce((s, l) => s + l.timeTaken,     0)
        const totMaxTime  = all.reduce((s, l) => s + l.maxTime,       0)
        const totLearn    = all.reduce((s, l) => s + l.learningScore, 0)
        const totMaxLearn = all.reduce((s, l) => s + l.maxLearning,   0)
        const totals = {
          accuracy:       Math.round((totCorrect / Math.max(totMaxMis, 1)) * 100),
          mistakes:       totMistakes,
          max_mistakes:   totMaxMis,
          time_taken:     totTime,
          max_time:       totMaxTime,
          learning_score: totLearn,
          max_learning:   totMaxLearn,
        }
        setTotalStats(totals)
        return all
      })
      setPhase(PHASE.COMPLETE)
    } else {
      const next = currentLvl + 1
      currentLvlRef.current = next   // sync update before async state
      setCurrentLvl(next)
      runCountdown(next)
    }
  }, [currentLvl, totalLevels, runCountdown])

  // ── Submit to backend ────────────────────────────────────
  // Inside your useGameEngine.js hook
  const submitToBackend = useCallback(async () => {
    if (!totalStats) return;
    
    setApiLoading(true);
    setApiError(null);

    // This payload must match your Spring Boot "GameInput" class fields
    const payload = {
      AGE:            userProfile.age,
      APOE4:          userProfile.apoe4,
      PTEDUCAT:       userProfile.pteducat,
      accuracy:       totalStats.accuracy,
      mistakes:       totalStats.mistakes,
      max_mistakes:   totalStats.max_mistakes,
      time_taken:     totalStats.time_taken,
      max_time:       totalStats.max_time,
      learning_score: totalStats.learning_score,
      max_learning:   totalStats.max_learning,
      levels_played:  totalLevels,
    };

    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      
      const data = await res.json();
      
      // Spring Boot returns { "zone": "Normal", "mmse": 29.0 }
      setApiResult(data); 
    } catch (e) {
      console.error("Connection failed:", e);
      setApiError("Could not connect to Spring Boot server.");
    } finally {
      setApiLoading(false);
    }
  }, [totalStats, userProfile, totalLevels]);
  // ── Reset ────────────────────────────────────────────────
  const reset = useCallback(() => {
    clearTimers()
    setPhase(PHASE.IDLE)
    setCurrentLvl(1)
    currentLvlRef.current = 1
    finishedRef.current   = false
    setLitCell(null)
    setCellState({})
    setCountdown(3)
    setRecallIdx(0)
    setLvlStats([])
    setTotalStats(null)
    setApiResult(null)
    setApiError(null)
    seqRef.current       = []
    correctRef.current   = 0
    mistakesRef.current  = 0
    recallIdxRef.current = 0
  }, [clearTimers])

  return {
    phase, PHASE,
    currentLvl, totalLevels,
    litCell, cellState,
    countdown,
    recallLeft, recallIdx,
    seqLen: cfg.seqLen,
    lvlStats, totalStats,
    apiResult, apiLoading, apiError,
    userProfile, setUserProfile,
    cfg, LEVEL_CONFIG,
    handleCellClick,
    startGame, nextLevel,
    submitToBackend, reset,
  }
}