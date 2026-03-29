import React, { useState, useEffect, useRef, useCallback } from 'react'
import DualNBackGrid   from './DualNBackGrid'
import DualNBackResult from './DualNBackResult'
import styles          from './DualNBack.module.css'

/* ─── Constants ──────────────────────────────────── */
const LETTERS   = 'BCDFGHJKLMNPQRSTVWXYZ'.split('')   // 20 consonants, easy to distinguish
const STEP_MS   = (nLevel) => Math.max(2800 - nLevel * 200, 1400)  // base interval per step
const SHOW_MS   = 500          // how long cell stays highlighted
const STEPS_PER_ROUND = 15

function randLetter() { return LETTERS[Math.floor(Math.random() * LETTERS.length)] }
function randCell()   { return Math.floor(Math.random() * 9) }

/* ─── Web Audio ───────────────────────────────────── */
function playTone(freq, dur, type = 'sine') {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(); osc.stop(ctx.currentTime + dur)
  } catch(_) {}
}
const sfxCorrect = () => { playTone(880, 0.12); setTimeout(() => playTone(1100, 0.12), 100) }
const sfxWrong   = () => playTone(200, 0.25, 'sawtooth')
const sfxStep    = () => playTone(440, 0.08, 'sine')

/* ─── PHASE enum ─────────────────────────────────── */
const PHASE = { IDLE: 'idle', PLAYING: 'playing', RESULT: 'result' }

/* ─── Main Component ─────────────────────────────── */
export default function DualNBack({ onBack, darkMode, onToggleDark }) {
  const [phase,        setPhase]       = useState(PHASE.IDLE)
  const [nLevel,       setNLevel]      = useState(1)
  const [sequence,     setSequence]    = useState([])   // [{pos, letter}]
  const [stepIdx,      setStepIdx]     = useState(-1)
  const [flashCell,    setFlashCell]   = useState(false)
  const [soundOn,      setSoundOn]     = useState(true)

  // Per-step user-click tracking
  const [posPressed,   setPosPressed]  = useState(false)
  const [ltrPressed,   setLtrPressed]  = useState(false)

  // Cumulative stats
  const [correctPos,   setCorrectPos]  = useState(0)
  const [correctLtr,   setCorrectLtr]  = useState(0)
  const [falsePos,     setFalsePos]    = useState(0)
  const [falseLtr,     setFalseLtr]    = useState(0)
  const [missedPos,    setMissedPos]   = useState(0)
  const [missedLtr,    setMissedLtr]   = useState(0)
  const [reactionTimes, setReactionTimes] = useState([])
  const [stepStart,    setStepStart]   = useState(null)

  // Level-up streak counters
  const correctStreak = useRef(0)
  const falseStreak   = useRef(0)

  // Tick timer ref
  const tickRef = useRef(null)

  /* ── Evaluate the just-finished step (before advancing) ── */
  const evaluateStep = useCallback((idx, seq, posP, ltrP, stepStartMs) => {
    if (idx < nLevel) return   // not enough history yet
    const cur  = seq[idx]
    const back = seq[idx - nLevel]
    const isPosMatch = cur.pos    === back.pos
    const isLtrMatch = cur.letter === back.letter

    let correct = false

    if (isPosMatch) {
      if (posP) { setCorrectPos(p => p + 1); correct = true }
      else       { setMissedPos(p => p + 1) }
    } else {
      if (posP) { setFalsePos(p => p + 1); if (soundOn) sfxWrong() }
    }

    if (isLtrMatch) {
      if (ltrP) { setCorrectLtr(p => p + 1); correct = true }
      else       { setMissedLtr(p => p + 1) }
    } else {
      if (ltrP) { setFalseLtr(p => p + 1); if (soundOn) sfxWrong() }
    }

    if (correct && soundOn) sfxCorrect()

    if (correct) { correctStreak.current++; falseStreak.current = 0 }
    else         { falseStreak.current++;   correctStreak.current = 0 }

    // Log reaction time if a match existed and was detected
    if ((isPosMatch && posP) || (isLtrMatch && ltrP)) {
      const rt = Date.now() - stepStartMs
      setReactionTimes(prev => [...prev, rt])
    }
  }, [nLevel, soundOn])

  /* ── Generate a new sequence ── */
  function buildSequence() {
    return Array.from({ length: STEPS_PER_ROUND }, () => ({
      pos:    randCell(),
      letter: randLetter(),
    }))
  }

  /* ── Start game ── */
  function startGame(lvl = 1) {
    const seq = buildSequence()
    setSequence(seq)
    setNLevel(lvl)
    setStepIdx(-1)
    setFlashCell(false)
    setPosPressed(false)
    setLtrPressed(false)
    setCorrectPos(0); setCorrectLtr(0)
    setFalsePos(0);   setFalseLtr(0)
    setMissedPos(0);  setMissedLtr(0)
    setReactionTimes([])
    correctStreak.current = 0
    falseStreak.current   = 0
    setPhase(PHASE.PLAYING)
  }

  /* ── Advance one step ── */
  useEffect(() => {
    if (phase !== PHASE.PLAYING) return

    const interval = STEP_MS(nLevel)

    tickRef.current = setTimeout(() => {
      setStepIdx(prev => {
        const next = prev + 1

        // End of round
        if (next >= STEPS_PER_ROUND) {
          clearTimeout(tickRef.current)
          setPhase(PHASE.RESULT)
          return prev
        }

        // Evaluate previous step before moving
        if (prev >= 0) {
          evaluateStep(prev, sequence, posPressed, ltrPressed, stepStart)
        }

        // Reset clicks for new step
        setPosPressed(false)
        setLtrPressed(false)
        setStepStart(Date.now())
        if (soundOn) sfxStep()

        // Flash the cell
        setFlashCell(true)
        setTimeout(() => setFlashCell(false), SHOW_MS)

        return next
      })
    }, interval)

    return () => clearTimeout(tickRef.current)
  }, [phase, stepIdx, sequence, posPressed, ltrPressed, nLevel, soundOn, evaluateStep]) // eslint-disable-line

  /* ── Button handlers ── */
  function handlePosMatch() {
    if (phase !== PHASE.PLAYING || stepIdx < nLevel) return
    setPosPressed(true)
  }
  function handleLtrMatch() {
    if (phase !== PHASE.PLAYING || stepIdx < nLevel) return
    setLtrPressed(true)
  }

  /* ── Summary stats ── */
  const avgRT = reactionTimes.length
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : 0
  const score = (correctPos + correctLtr) * 10
              - (falsePos + falseLtr) * 5
              - (missedPos + missedLtr) * 5

  /* ── Current step data ── */
  const cur = sequence[stepIdx] ?? null

  /* ── N-indicator: is there a match this step? (shown as "?" to user, debug off) ── */
  const hasBackStep = stepIdx >= nLevel
  const posMatch = hasBackStep && cur && sequence[stepIdx - nLevel].pos    === cur.pos
  const ltrMatch = hasBackStep && cur && sequence[stepIdx - nLevel].letter === cur.letter

  /* ── Progress ── */
  const progress = stepIdx >= 0 ? ((stepIdx + 1) / STEPS_PER_ROUND) * 100 : 0

  return (
    <div className={`${styles.wrapper} ${darkMode ? styles.light : ''}`}>
      <div className={styles.bgDots} aria-hidden />

      {/* ── Top bar ── */}
      <header className={styles.topBar}>
        <button className={styles.backLink} onClick={onBack}>← Games</button>
        <div className={styles.topBarTitle}>
          <span className={styles.topBarAccent}>DUAL</span> N-BACK
        </div>
        <div className={styles.topBarRight}>
          <button className={styles.iconBtn} onClick={() => setSoundOn(s => !s)}>
            {soundOn ? '🔊' : '🔇'}
          </button>
          <button className={styles.iconBtn} onClick={onToggleDark}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* ═══════ IDLE SCREEN ═══════ */}
      {phase === PHASE.IDLE && (
        <div className={styles.idleScreen}>
          <div className={styles.idleLogo}>
            <span className={styles.idleAcc}>DUAL</span> N-BACK
          </div>
          <p className={styles.idleTagline}>Working memory · Attention · Processing speed</p>

          <div className={styles.rulesCard}>
            <div className={styles.ruleRow}><span className={styles.ruleNum}>01</span>
              <span>A square lights up AND a letter appears each step</span></div>
            <div className={styles.ruleRow}><span className={styles.ruleNum}>02</span>
              <span>If the <strong>position</strong> matches N steps ago → click <em>Position Match</em></span></div>
            <div className={styles.ruleRow}><span className={styles.ruleNum}>03</span>
              <span>If the <strong>letter</strong> matches N steps ago → click <em>Letter Match</em></span></div>
            <div className={styles.ruleRow}><span className={styles.ruleNum}>04</span>
              <span>Both can match at the same time. You have until the next step to click!</span></div>
          </div>

          <div className={styles.levelRow}>
            {[1, 2, 3, 4].map(n => (
              <button
                key={n}
                className={`${styles.lvlBtn} ${nLevel === n ? styles.lvlBtnActive : ''}`}
                onClick={() => setNLevel(n)}
              >
                {n}-Back
              </button>
            ))}
          </div>
          <p className={styles.levelHint}>Start at N={nLevel} · {STEPS_PER_ROUND} steps per round</p>

          <button className={styles.startBtn} onClick={() => startGame(nLevel)}>
            START GAME
          </button>
        </div>
      )}

      {/* ═══════ PLAYING SCREEN ═══════ */}
      {phase === PHASE.PLAYING && cur && (
        <div className={styles.playScreen}>

          {/* HUD */}
          <div className={styles.hud}>
            <div className={styles.hudPill}>N = {nLevel}</div>
            <div className={styles.hudStep}>Step {stepIdx + 1} / {STEPS_PER_ROUND}</div>
            <div className={styles.hudPill}>Score {score}</div>
          </div>

          {/* Progress bar */}
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>

          {/* Letter display */}
          <div className={styles.letterDisplay} key={stepIdx}>
            {cur.letter}
          </div>

          {/* Grid */}
          <DualNBackGrid activeCell={cur.pos} flash={flashCell} />

          {/* N-back hint strip */}
          <div className={styles.hintStrip}>
            <span>N-back: compare with step{' '}
              <strong>{Math.max(0, stepIdx - nLevel + 1)}</strong>
            </span>
          </div>

          {/* Match buttons */}
          <div className={styles.matchBtns}>
            <button
              className={`${styles.matchBtn} ${styles.matchBtnPos} ${posPressed ? styles.matchBtnPressed : ''}`}
              onClick={handlePosMatch}
              disabled={stepIdx < nLevel}
            >
              <span className={styles.matchBtnIcon}>⊞</span>
              <span>Position Match</span>
              {posPressed && <span className={styles.matchBtnCheck}>✓</span>}
            </button>
            <button
              className={`${styles.matchBtn} ${styles.matchBtnLtr} ${ltrPressed ? styles.matchBtnPressed : ''}`}
              onClick={handleLtrMatch}
              disabled={stepIdx < nLevel}
            >
              <span className={styles.matchBtnIcon}>Aa</span>
              <span>Letter Match</span>
              {ltrPressed && <span className={styles.matchBtnCheck}>✓</span>}
            </button>
          </div>

          {/* Live stats */}
          <div className={styles.liveStats}>
            <div className={styles.liveStat}>
              <span className={styles.liveStatGood}>✓ {correctPos + correctLtr}</span>
              <span className={styles.liveStatLbl}>Correct</span>
            </div>
            <div className={styles.liveStat}>
              <span className={styles.liveStatBad}>✗ {falsePos + falseLtr}</span>
              <span className={styles.liveStatLbl}>False</span>
            </div>
            <div className={styles.liveStat}>
              <span className={styles.liveStatWarn}>~ {missedPos + missedLtr}</span>
              <span className={styles.liveStatLbl}>Missed</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ RESULT SCREEN ═══════ */}
      {phase === PHASE.RESULT && (
        <div className={styles.resultWrapper}>
          <DualNBackResult
            score={score}
            nLevel={nLevel}
            correctPos={correctPos}
            correctLetter={correctLtr}
            falsePos={falsePos}
            falseLetter={falseLtr}
            missedPos={missedPos}
            missedLetter={missedLtr}
            avgReactionTime={avgRT}
            totalSteps={STEPS_PER_ROUND}
            onRetry={() => startGame(nLevel)}
            onBack={onBack}
          />
        </div>
      )}
    </div>
  )
}
