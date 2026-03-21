import React from 'react'
import styles from './HUD.module.css'

export default function HUD({ recallIdx, seqLen, recallLeft, level, totalLevels }) {
  const progress = Math.round((recallIdx / Math.max(seqLen, 1)) * 100)

  return (
    <div className={styles.hud}>
      <div className={styles.stat}>
        <span className={styles.label}>LEVEL</span>
        <span className={styles.value}>{level}<span className={styles.dim}>/{totalLevels}</span></span>
      </div>

      <div className={styles.stat}>
        <span className={styles.label}>TAPPED</span>
        <span className={`${styles.value} ${styles.green}`}>
          {recallIdx}<span className={styles.dim}>/{seqLen}</span>
        </span>
      </div>

      <div className={styles.statCenter}>
        <span className={styles.label}>PROGRESS</span>
        <div className={styles.accBar}>
          <div className={styles.accFill} style={{ width: `${progress}%` }} />
        </div>
        <span className={`${styles.value} ${styles.accent}`}>{progress}%</span>
      </div>

      <div className={styles.stat}>
        <span className={styles.label}>TIME LEFT</span>
        <span className={`${styles.value} ${recallLeft <= 5 ? styles.red : ''}`}>
          {recallLeft}<span className={styles.dim}>s</span>
        </span>
      </div>

      <div className={styles.stat}>
        <span className={styles.label}>RECALL</span>
        <span className={styles.value} style={{ fontSize: '11px', color: 'var(--text2)', letterSpacing: '0.06em' }}>
          NOW
        </span>
      </div>
    </div>
  )
}
