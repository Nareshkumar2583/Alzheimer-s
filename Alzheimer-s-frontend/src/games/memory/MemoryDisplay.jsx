import React from 'react'
import styles from './MemoryGame.module.css'

export default function MemoryDisplay({ letter, visible, countdown }) {
  if (countdown !== undefined) {
    return (
      <div className={styles.displayWrapper}>
        <div className={styles.countdownBadge}>Get Ready</div>
        <div className={`${styles.letterBox} ${styles.countdownBox}`} key={countdown}>
          {countdown > 0 ? countdown : 'GO'}
        </div>
        <div className={styles.displayHint}>Sequence starts soon…</div>
      </div>
    )
  }

  return (
    <div className={styles.displayWrapper}>
      <div className={styles.displayLabel}>MEMORISE</div>
      <div className={`${styles.letterBox} ${visible ? styles.letterVisible : styles.letterHidden}`}>
        {letter}
      </div>
      <div className={styles.displayHint}>Remember each letter in order</div>
    </div>
  )
}
