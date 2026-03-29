import React, { useState, useEffect, useRef, useCallback } from 'react'
import MemoryDisplay from './MemoryDisplay'
import MemoryInput   from './MemoryInput'
import MemoryResult  from './MemoryResult'
import styles        from './MemoryGame.module.css'

/* ─── Constants ─────────────────────────────────── */
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function genSequence(len) {
  return Array.from({ length: len }, () => LETTERS[Math.floor(Math.random() * 26)])
}

function getLevelConfig(level) {
  const chars = Math.min(4 + (level - 1), 9)
  const delay = Math.max(3 - (level - 1) * 0.25, 1)
  return { chars, delay }
}

function calcScore(level, accuracy, responseTime) {
  return Math.round((level * 10) + (accuracy * 50) - (responseTime * 2))
}

/* ─── Web Audio helpers ──────────────────────────── */
function playTone(freq, duration, type = 'sine') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch (_) {}
}

const playCorrect = () => { playTone(880, 0.15); setTimeout(() => playTone(1100, 0.15), 120) }
const playWrong   = () => { playTone(180, 0.35, 'sawtooth') }
const playLetter  = () => { playTone(660, 0.1, 'sine') }

/* ─── localStorage ───────────────────────────────── */
const LS_KEY = 'memoryGame_v1'
function loadSaved() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {} } catch { return {} }
}
function saveBest(score, level) {
  const saved = loadSaved()
  const updated = {
    bestScore:     Math.max(score, saved.bestScore || 0),
    highestLevel:  Math.max(level, saved.highestLevel || 0),
  }
  localStorage.setItem(LS_KEY, JSON.stringify(updated))
  return updated
}

/* ─── PHASES ─────────────────────────────────────── */
const PHASE = { IDLE: 'idle', COUNTDOWN: 'countdown', PLAYING: 'playing', INPUT: 'input', RESULT: 'result' }

/* ─── Main Component ─────────────────────────────── */
export default function MemoryGame({ onBack, darkMode, onToggleDark }) {
  const saved = loadSaved()

  const [phase,         setPhase]         = useState(PHASE.IDLE)
  const [level,         setLevel]         = useState(1)
  const [sequence,      setSequence]      = useState([])
  const [showIdx,       setShowIdx]       = useState(-1)
  const [letterVisible, setLetterVisible] = useState(false)
  const [countdown,     setCountdown]     = useState(3)
  const [userInput,     setUserInput]     = useState('')
  const [timeElapsed,   setTimeElapsed]   = useState(0)
  const [inputStart,    setInputStart]    = useState(null)
  const [responseTimes, setResponseTimes] = useState([])
  const [lastResult,    setLastResult]    = useState(null) // { correct, score, accuracy, responseTime }
  const [maxLevel,      setMaxLevel]      = useState(1)
  const [totalScore,    setTotalScore]    = useState(0)
  const [bestScore,     setBestScore]     = useState(saved.bestScore  || 0)
  const [highestLevel,  setHighestLevel]  = useState(saved.highestLevel || 0)
  const [soundOn,       setSoundOn]       = useState(true)

  const timerRef = useRef(null)

  /* ── timer during input ── */
  useEffect(() => {
    if (phase === PHASE.INPUT) {
      const start = Date.now()
      setInputStart(start)
      timerRef.current = setInterval(() => {
        setTimeElapsed((Date.now() - start) / 1000)
      }, 100)
    } else {
      clearInterval(timerRef.current)
      setTimeElapsed(0)
    }
    return () => clearInterval(timerRef.current)
  }, [phase])

  /* ── countdown before playing ── */
  const startCountdown = useCallback(() => {
    setPhase(PHASE.COUNTDOWN)
    setCountdown(3)
    let n = 3
    const iv = setInterval(() => {
      n--
      if (n <= 0) {
        clearInterval(iv)
        startSequence()
      } else {
        setCountdown(n)
      }
    }, 1000)
  }, [level]) // eslint-disable-line

  /* ── play sequence ── */
  const startSequence = useCallback(() => {
    const { chars, delay } = getLevelConfig(level)
    const seq = genSequence(chars)
    setSequence(seq)
    setShowIdx(-1)
    setLetterVisible(false)
    setPhase(PHASE.PLAYING)

    let idx = 0
    const half = delay / 2 * 1000

    function showNext() {
      if (idx >= seq.length) {
        // Sequence done → go to input
        setLetterVisible(false)
        setTimeout(() => {
          setShowIdx(-1)
          setUserInput('')
          setPhase(PHASE.INPUT)
        }, 400)
        return
      }
      setLetterVisible(false)
      setTimeout(() => {
        setShowIdx(idx)
        setLetterVisible(true)
        if (soundOn) playLetter()
        setTimeout(() => {
          idx++
          showNext()
        }, delay * 1000 - half)
      }, half)
    }
    showNext()
  }, [level, soundOn])

  /* ── start game ── */
  function startGame() {
    setLevel(1)
    setTotalScore(0)
    setMaxLevel(1)
    setResponseTimes([])
    startCountdown()
  }

  /* ── submit answer ── */
  function handleSubmit() {
    const rt = (Date.now() - inputStart) / 1000
    const correct = userInput === sequence.join('')
    const accuracy = userInput.split('').reduce((acc, c, i) => acc + (c === sequence[i] ? 1 : 0), 0) / sequence.length
    const roundScore = calcScore(level, accuracy, rt)
    const newTotal = totalScore + roundScore
    const newMax   = Math.max(maxLevel, level)
    const newRTs   = [...responseTimes, rt]

    setResponseTimes(newRTs)
    setTotalScore(newTotal)
    setMaxLevel(newMax)

    if (soundOn) correct ? playCorrect() : playWrong()

    const saved = saveBest(newTotal, newMax)
    setBestScore(saved.bestScore)
    setHighestLevel(saved.highestLevel)

    setLastResult({
      correct,
      score:        newTotal,
      accuracy:     Math.round(accuracy * 100),
      responseTime: rt,
      avgRT:        newRTs.reduce((a, b) => a + b, 0) / newRTs.length,
      sequence:     sequence,
      userInput:    userInput,
    })
    setPhase(PHASE.RESULT)
  }

  /* ── next level ── */
  function nextLevel() {
    const next = level + 1
    setLevel(next)
    startCountdownForLevel(next)
  }

  function startCountdownForLevel(lvl) {
    setPhase(PHASE.COUNTDOWN)
    setCountdown(3)
    let n = 3
    const iv = setInterval(() => {
      n--
      if (n <= 0) {
        clearInterval(iv)
        // play sequence for the new level value
        const { chars, delay } = getLevelConfig(lvl)
        const seq = genSequence(chars)
        setSequence(seq)
        setShowIdx(-1)
        setLetterVisible(false)
        setPhase(PHASE.PLAYING)

        let idx = 0
        const half = delay / 2 * 1000

        function showNext() {
          if (idx >= seq.length) {
            setLetterVisible(false)
            setTimeout(() => { setShowIdx(-1); setUserInput(''); setPhase(PHASE.INPUT) }, 400)
            return
          }
          setLetterVisible(false)
          setTimeout(() => {
            setShowIdx(idx); setLetterVisible(true)
            if (soundOn) playLetter()
            setTimeout(() => { idx++; showNext() }, delay * 1000 - half)
          }, half)
        }
        showNext()
      } else {
        setCountdown(n)
      }
    }, 1000)
  }

  /* ── retry ── */
  function retry() {
    startGame()
  }

  const cfg = getLevelConfig(level)
  const MAX_LEVELS = 6 // levels 1-6 (chars 4→9, delay 3→1.5)

  return (
    <div className={`${styles.wrapper} ${darkMode ? styles.light : ''}`}>
      {/* Background */}
      <div className={styles.bgDots} aria-hidden />

      {/* Top bar */}
      <header className={styles.topBar}>
        <button className={styles.backLink} onClick={onBack}>← Games</button>
        <div className={styles.topBarTitle}>
          <span className={styles.topBarAccent}>MEMORY</span> GAME
        </div>
        <div className={styles.topBarRight}>
          <button className={styles.iconBtn} onClick={() => setSoundOn(s => !s)} title="Toggle sound">
            {soundOn ? '🔊' : '🔇'}
          </button>
          <button className={styles.iconBtn} onClick={onToggleDark} title="Toggle theme">
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* ── IDLE ── */}
      {phase === PHASE.IDLE && (
        <div className={styles.idleScreen} style={{ animation: 'mgFadeIn 0.5s ease' }}>
          <div className={styles.idleLogo}>
            <span className={styles.idleAcc}>COGNITIVE</span>
            <br />MEMORY GAME
          </div>
          <p className={styles.idleTagline}>Test your short-term memory</p>

          <div className={styles.rulesCard}>
            <div className={styles.ruleRow}><span className={styles.ruleNum}>01</span><span>Watch a sequence of letters appear one by one</span></div>
            <div className={styles.ruleRow}><span className={styles.ruleNum}>02</span><span>Type the exact sequence in order from memory</span></div>
            <div className={styles.ruleRow}><span className={styles.ruleNum}>03</span><span>Each level adds a letter & speeds up the display</span></div>
          </div>

          <div className={styles.levelPreview}>
            {Array.from({ length: MAX_LEVELS }, (_, i) => i + 1).map(l => {
              const c = getLevelConfig(l)
              return (
                <div key={l} className={styles.levelPill}>
                  <span className={styles.levelPillNum}>L{l}</span>
                  <span>{c.chars} letters · {c.delay}s</span>
                </div>
              )
            })}
          </div>

          {(bestScore > 0 || highestLevel > 0) && (
            <div className={styles.savedRecord}>
              🏆 Best: <strong>{bestScore}</strong> pts · Level <strong>{highestLevel}</strong>
            </div>
          )}

          <button className={styles.startBtn} onClick={startGame}>
            START GAME
          </button>
        </div>
      )}

      {/* ── COUNTDOWN ── */}
      {phase === PHASE.COUNTDOWN && (
        <div className={styles.centerScreen} style={{ animation: 'mgFadeIn 0.3s ease' }}>
          <div className={styles.levelBadge}>LEVEL {level} OF {MAX_LEVELS}</div>
          <MemoryDisplay countdown={countdown} />
          <div className={styles.levelInfo}>{cfg.chars} letters · {cfg.delay}s each</div>
        </div>
      )}

      {/* ── PLAYING ── */}
      {phase === PHASE.PLAYING && (
        <div className={styles.centerScreen}>
          {/* Progress pip row */}
          <div className={styles.seqProgress}>
            {sequence.map((_, i) => (
              <div key={i} className={`${styles.pip}
                ${i < showIdx ? styles.pipDone : ''}
                ${i === showIdx ? styles.pipActive : ''}
              `} />
            ))}
          </div>

          <MemoryDisplay letter={showIdx >= 0 ? sequence[showIdx] : ''} visible={letterVisible} />

          <div className={styles.levelBadge}>LEVEL {level} · {showIdx + 1}/{sequence.length}</div>
        </div>
      )}

      {/* ── INPUT ── */}
      {phase === PHASE.INPUT && (
        <div className={styles.centerScreen} style={{ animation: 'mgFadeIn 0.4s ease' }}>
          <div className={styles.inputHeader}>
            <div className={styles.levelBadge}>LEVEL {level}</div>
            <div className={styles.recallBanner}>⌨ RECALL THE SEQUENCE</div>
          </div>
          <MemoryInput
            value={userInput}
            onChange={setUserInput}
            onSubmit={handleSubmit}
            sequence={sequence}
            timeElapsed={timeElapsed}
          />
        </div>
      )}

      {/* ── RESULT ── */}
      {phase === PHASE.RESULT && lastResult && (
        <div className={styles.centerScreen} style={{ animation: 'mgFadeIn 0.4s ease' }}>
          <MemoryResult
            correct={lastResult.correct}
            score={lastResult.score}
            level={level}
            maxLevel={maxLevel}
            accuracy={lastResult.accuracy}
            avgResponseTime={lastResult.avgRT}
            bestScore={bestScore}
            highestLevel={highestLevel}
            onRetry={retry}
            onNextLevel={nextLevel}
            onBack={onBack}
            isGameOver={level >= MAX_LEVELS && lastResult.correct}
            sequence={lastResult.sequence}
            userInput={lastResult.userInput}
          />
        </div>
      )}
    </div>
  )
}
