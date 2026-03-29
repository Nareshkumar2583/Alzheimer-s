import React from 'react'
import styles from './MemoryGame.module.css'

/* ─────────────────────────────────────────────────────────────
   analyzePerformance
   Compares userInput against correctSequence from the END.
   Returns: { matchedFromEnd, totalLength, percentageRemembered, classification }
───────────────────────────────────────────────────────────── */
export function analyzePerformance(correctSequence, userInput) {
  const correct = Array.isArray(correctSequence) ? correctSequence : correctSequence.split('')
  const user    = userInput.toUpperCase().split('')
  const n       = correct.length

  // Count consecutive matches from the end
  let matchedFromEnd = 0
  for (let i = 0; i < Math.min(n, user.length); i++) {
    if (correct[n - 1 - i] === user[n - 1 - i]) {
      matchedFromEnd++
    } else {
      break
    }
  }

  const percentageRemembered = Math.round((matchedFromEnd / n) * 100)

  // Classification thresholds
  let classification
  if (percentageRemembered === 100) {
    classification = 'Normal'
  } else if (percentageRemembered >= 50) {
    classification = 'Mild Cognitive Impairment'
  } else {
    classification = 'Severe Memory Loss'
  }

  return { matchedFromEnd, totalLength: n, percentageRemembered, classification }
}

/* ─── Helpers ──────────────────────────────────────────────── */
const CLASS_CONFIG = {
  'Normal': {
    color:   'var(--hit, #00ff88)',
    dimBg:   'var(--hit-dim, rgba(0,255,136,.1))',
    border:  'var(--hit, #00ff88)',
    glow:    'var(--hit-glow, rgba(0,255,136,.35))',
    icon:    '🧠',
    badge:   styles.classNormal,
    message: 'Your memory performance is strong.',
  },
  'Mild Cognitive Impairment': {
    color:   'var(--warn, #ffb800)',
    dimBg:   'rgba(255,184,0,.1)',
    border:  'var(--warn, #ffb800)',
    glow:    'rgba(255,184,0,.35)',
    icon:    '⚠️',
    badge:   styles.classMild,
    message: 'Some memory decline detected.',
  },
  'Severe Memory Loss': {
    color:   'var(--miss, #ff3d5a)',
    dimBg:   'var(--miss-dim, rgba(255,61,90,.1))',
    border:  'var(--miss, #ff3d5a)',
    glow:    'var(--miss-glow, rgba(255,61,90,.35))',
    icon:    '🔴',
    badge:   styles.classSevere,
    message: 'Significant recall difficulty observed.',
  },
}

/* ─── Main Component ────────────────────────────────────────── */
export default function MemoryResult({
  correct, score, level, maxLevel, accuracy,
  avgResponseTime, bestScore, highestLevel,
  onRetry, onNextLevel, onBack, isGameOver,
  sequence, userInput,
}) {
  const isNewBest    = score > bestScore
  const isNewHighest = maxLevel > highestLevel

  // Run analysis
  const analysis   = analyzePerformance(sequence, userInput || '')
  const classCfg   = CLASS_CONFIG[analysis.classification]
  const userChars  = (userInput || '').toUpperCase().split('')
  const seqChars   = sequence

  return (
    <div className={styles.resultScreen}>

      {/* ── 1. Status Banner ── */}
      <div className={`${styles.resultBanner} ${correct ? styles.resultBannerCorrect : styles.resultBannerWrong}`}>
        <span className={styles.resultIcon}>{correct ? '✓' : '✗'}</span>
        <div>
          <div className={styles.resultTitle}>{correct ? 'CORRECT!' : 'WRONG!'}</div>
          <div className={styles.resultSub}>
            {correct
              ? isGameOver ? 'You completed all levels!' : `Level ${level} cleared`
              : 'Sequence was incorrect'}
          </div>
        </div>
      </div>

      {/* ── 2. Cognitive Analysis Card ── */}
      <div className={styles.analysisCard} style={{ borderColor: classCfg.border, background: classCfg.dimBg }}>
        <div className={styles.analysisHeader}>
          <span className={styles.analysisLabel}>COGNITIVE ANALYSIS</span>
          <span className={`${styles.classBadge} ${classCfg.badge}`}>
            {classCfg.icon} {analysis.classification}
          </span>
        </div>

        {/* Sequence comparison */}
        <div className={styles.seqCompareSection}>
          <div className={styles.seqCompareRow}>
            <span className={styles.seqCompareLabel}>CORRECT</span>
            <div className={styles.seqChars}>
              {seqChars.map((ch, i) => (
                <div key={i} className={`${styles.seqChar} ${styles.seqCharCorrect}`}>{ch}</div>
              ))}
            </div>
          </div>
          <div className={styles.seqCompareRow}>
            <span className={styles.seqCompareLabel}>YOUR INPUT</span>
            <div className={styles.seqChars}>
              {seqChars.map((_, i) => {
                const u = userChars[i] || '?'
                // Determine per-char match (from end = consecutive from end)
                const n = seqChars.length
                const matchStart = n - analysis.matchedFromEnd
                const isEndMatch = i >= matchStart && seqChars[i] === userChars[i]
                const isWrong    = u !== seqChars[i]
                return (
                  <div
                    key={i}
                    className={`${styles.seqChar}
                      ${isEndMatch ? styles.seqCharMatch : ''}
                      ${!isEndMatch && isWrong ? styles.seqCharWrong : ''}
                    `}
                  >
                    {u}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Memory percentage bar */}
        <div className={styles.memBarSection}>
          <div className={styles.memBarHeader}>
            <span className={styles.memBarLabel}>Memory Recall</span>
            <span className={styles.memBarPct} style={{ color: classCfg.color }}>
              {analysis.percentageRemembered}%
            </span>
          </div>
          <div className={styles.memBarTrack}>
            <div
              className={styles.memBarFill}
              style={{
                width: `${analysis.percentageRemembered}%`,
                background: classCfg.color,
                boxShadow: `0 0 12px ${classCfg.glow}`,
              }}
            />
          </div>
          <div className={styles.memBarSub}>
            {analysis.matchedFromEnd} of {analysis.totalLength} trailing characters matched correctly
          </div>
        </div>

        {/* Classification message */}
        <div className={styles.classMessage} style={{ color: classCfg.color }}>
          {classCfg.icon} {classCfg.message}
        </div>

        {/* Disclaimer */}
        <p className={styles.analysisDisclaimer}>
          This tool is for cognitive screening purposes only and not a medical diagnosis.
        </p>
      </div>

      {/* ── 3. Stats Grid ── */}
      <div className={styles.statsGrid}>
        <StatBox label="Score"        value={score}                  highlight accent />
        <StatBox label="Level Reached" value={`${maxLevel}`}         />
        <StatBox label="Accuracy"     value={`${accuracy}%`}         />
        <StatBox label="Avg Response" value={`${avgResponseTime.toFixed(1)}s`} />
      </div>

      {/* ── 4. Records ── */}
      {(isNewBest || isNewHighest) && (
        <div className={styles.recordsBadge}>
          🏆 New Record{isNewBest && isNewHighest ? 's' : ''}:{' '}
          {isNewBest && `Best Score (${score})`}
          {isNewBest && isNewHighest && ' · '}
          {isNewHighest && `Highest Level (${maxLevel})`}
        </div>
      )}

      <div className={styles.savedStats}>
        <span>Best Score: <strong>{Math.max(score, bestScore)}</strong></span>
        <span>·</span>
        <span>Highest Level: <strong>{Math.max(maxLevel, highestLevel)}</strong></span>
      </div>

      {/* ── 5. Actions ── */}
      <div className={styles.resultActions}>
        {correct && !isGameOver && (
          <button className={styles.nextBtn} onClick={onNextLevel}>
            NEXT LEVEL →
          </button>
        )}
        <button className={styles.retryBtn} onClick={onRetry}>
          ↺ {isGameOver || !correct ? 'RETRY' : 'RESTART'}
        </button>
        <button className={styles.backBtn} onClick={onBack}>
          ← GAMES HUB
        </button>
      </div>
    </div>
  )
}

function StatBox({ label, value, highlight, accent }) {
  return (
    <div className={`${styles.statBox} ${highlight ? styles.statBoxHighlight : ''}`}>
      <div className={`${styles.statValue} ${accent ? styles.statValueAccent : ''}`}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  )
}
