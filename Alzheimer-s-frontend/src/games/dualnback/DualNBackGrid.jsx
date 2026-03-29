import React from 'react'
import styles from './DualNBack.module.css'

/* 3×3 grid — highlights one cell per step */
export default function DualNBackGrid({ activeCell, flash }) {
  return (
    <div className={styles.gridWrapper}>
      <div className={styles.grid}>
        {Array.from({ length: 9 }, (_, i) => (
          <div
            key={i}
            className={`${styles.cell} ${activeCell === i ? styles.cellActive : ''} ${activeCell === i && flash ? styles.cellFlash : ''}`}
          />
        ))}
      </div>
    </div>
  )
}
