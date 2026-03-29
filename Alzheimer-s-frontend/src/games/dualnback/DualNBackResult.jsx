import React from 'react'
import styles from './DualNBack.module.css'

/* ── analyzePerformance ──────────────────────────── */
export function analyzePerformance({ accuracy, avgReactionTime, falsePositives, totalMatches }) {
  const fpRate = totalMatches > 0 ? falsePositives / totalMatches : falsePositives

  let classification
  if (accuracy > 80 && falsePositives <= 2 && avgReactionTime < 1200) {
    classification = 'Normal'
  } else if (accuracy >= 50 && fpRate < 0.5 && avgReactionTime < 2000) {
    classification = 'Mild Cognitive Decline'
  } else {
    classification = 'Severe Impairment'
  }
  return { accuracy, avgReactionTime, classification }
}

/* ── Config per classification ────────────────────── */
const CLASS_CFG = {
  'Normal': {
    color:  '#00ff88',
    dimBg:  'rgba(0,255,136,.10)',
    border: 'rgba(0,255,136,.5)',
    icon:   '🧠',
    msg:    'Your working memory and attention are performing strongly.',
    badge:  styles.classNormal,
    bar:    styles.barNormal,
  },
  'Mild Cognitive Decline': {
    color:  '#ffb800',
    dimBg:  'rgba(255,184,0,.10)',
    border: 'rgba(255,184,0,.5)',
    icon:   '⚠️',
    msg:    'Some decline in working memory or attention detected.',
    badge:  styles.classMild,
    bar:    styles.barMild,
  },
  'Severe Impairment': {
    color:  '#ff3d5a',
    dimBg:  'rgba(255,61,90,.10)',
    border: 'rgba(255,61,90,.5)',
    icon:   '🔴',
    msg:    'Significant difficulty with working memory observed.',
    badge:  styles.classSevere,
    bar:    styles.barSevere,
  },
}

/* ── Component ─────────────────────────────────────── */
export default function DualNBackResult({
  score, nLevel, correctPos, correctLetter,
  falsePos, falseLetter, missedPos, missedLetter,
  avgReactionTime, totalSteps, onRetry, onBack,
}) {
  const totalCorrect = correctPos + correctLetter
  const totalFalse   = falsePos  + falseLetter
  const totalMissed  = missedPos + missedLetter
  const totalMatchOpp = totalCorrect + totalMissed        // opportunities
  const accuracy = totalMatchOpp > 0
    ? Math.round((totalCorrect / totalMatchOpp) * 100)
    : totalFalse === 0 ? 100 : 0

  const analysis = analyzePerformance({
    accuracy,
    avgReactionTime,
    falsePositives: totalFalse,
    totalMatches:   totalMatchOpp,
  })
  const cfg = CLASS_CFG[analysis.classification]

  return (
    <div className={styles.resultScreen}>

      {/* ── Header ── */}
      <div className={styles.resultHeader}>
        <div className={styles.resultTitle}>ROUND COMPLETE</div>
        <div className={styles.resultSub}>N-Back Level {nLevel} · {totalSteps} steps</div>
      </div>

      {/* ── Classification banner ── */}
      <div className={styles.classBanner} style={{ borderColor: cfg.border, background: cfg.dimBg }}>
        <span className={styles.classBannerIcon}>{cfg.icon}</span>
        <div>
          <div className={`${styles.classBadge} ${cfg.badge}`}>{analysis.classification}</div>
          <div className={styles.classBannerMsg}>{cfg.msg}</div>
        </div>
      </div>

      {/* ── Score + Accuracy ── */}
      <div className={styles.scoreRow}>
        <div className={styles.scoreBig}>
          <div className={styles.scoreBigNum} style={{ color: cfg.color }}>{score}</div>
          <div className={styles.scoreBigLbl}>FINAL SCORE</div>
        </div>
        <div className={styles.scoreDivider} />
        <div className={styles.scoreBig}>
          <div className={styles.scoreBigNum} style={{ color: cfg.color }}>{accuracy}%</div>
          <div className={styles.scoreBigLbl}>ACCURACY</div>
        </div>
        <div className={styles.scoreDivider} />
        <div className={styles.scoreBig}>
          <div className={styles.scoreBigNum}>{(avgReactionTime / 1000).toFixed(2)}s</div>
          <div className={styles.scoreBigLbl}>AVG REACT</div>
        </div>
      </div>

      {/* ── Accuracy progress bar ── */}
      <div className={styles.barSection}>
        <div className={styles.barHeader}>
          <span className={styles.barLabel}>Memory Accuracy</span>
          <span className={styles.barPct} style={{ color: cfg.color }}>{accuracy}%</span>
        </div>
        <div className={styles.barTrack}>
          <div
            className={`${styles.barFill} ${cfg.bar}`}
            style={{ width: `${accuracy}%` }}
          />
        </div>
      </div>

      {/* ── Breakdown grid ── */}
      <div className={styles.breakdown}>
        <BreakdownRow label="Correct Position"  value={correctPos}   good />
        <BreakdownRow label="Correct Letter"    value={correctLetter} good />
        <BreakdownRow label="False Pos Clicks"  value={falsePos}     bad />
        <BreakdownRow label="False Ltr Clicks"  value={falseLetter}  bad />
        <BreakdownRow label="Missed Position"   value={missedPos}    warn />
        <BreakdownRow label="Missed Letter"     value={missedLetter} warn />
      </div>

      {/* ── Highlights ── */}
      <div className={styles.highlights}>
        <div className={styles.highlightBox}>
          <div className={styles.highlightVal}>{nLevel}</div>
          <div className={styles.highlightLbl}>Highest N</div>
        </div>
        <div className={styles.highlightBox}>
          <div className={styles.highlightVal}>{totalCorrect}</div>
          <div className={styles.highlightLbl}>Total Correct</div>
        </div>
        <div className={styles.highlightBox}>
          <div className={styles.highlightVal}>{totalFalse}</div>
          <div className={styles.highlightLbl}>False Pos</div>
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <p className={styles.disclaimer}>
        This is a cognitive assessment tool for screening purposes only and not a medical diagnosis.
      </p>

      {/* ── Actions ── */}
      <div className={styles.actions}>
        <button className={styles.retryBtn} onClick={onRetry}>↺ PLAY AGAIN</button>
        <button className={styles.backBtn}  onClick={onBack}>← GAMES HUB</button>
      </div>
    </div>
  )
}

function BreakdownRow({ label, value, good, bad, warn }) {
  const color = good ? '#00ff88' : bad ? '#ff3d5a' : '#ffb800'
  return (
    <div className={styles.breakdownRow}>
      <span className={styles.breakdownLabel}>{label}</span>
      <span className={styles.breakdownValue} style={{ color }}>{value}</span>
    </div>
  )
}
