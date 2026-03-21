import React from 'react'
import styles from './ResultCard.module.css'

export default function ResultCard({ stat, onNext, isLast }) {
  const isGood = stat.accuracy >= 70

  return (
    <div className={styles.card} style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className={styles.header}>
        <span className={styles.levelTag}>LEVEL {stat.level} COMPLETE</span>
        <span className={`${styles.grade} ${isGood ? styles.good : styles.warn}`}>
          {stat.accuracy >= 90 ? 'EXCELLENT' :
           stat.accuracy >= 70 ? 'GOOD' :
           stat.accuracy >= 50 ? 'FAIR' : 'NEEDS WORK'}
        </span>
      </div>

      <div className={styles.scoreRow}>
        <div className={styles.bigScore} style={{ color: isGood ? 'var(--hit)' : 'var(--warn)' }}>
          {stat.accuracy}<span className={styles.pct}>%</span>
        </div>
        <div className={styles.subLabel}>accuracy</div>
      </div>

      <div className={styles.statsGrid}>
        <StatBox label="Correct" value={stat.correct} color="var(--hit)" />
        <StatBox label="Errors"  value={stat.mistakes} color="var(--miss)" />
        <StatBox label="Time"    value={`${stat.timeTaken}s`} color="var(--accent)" />
        <StatBox label="Learning" value={`${stat.learningScore}/${stat.maxLearning}`} color="var(--warn)" />
      </div>

      <button className={styles.nextBtn} onClick={onNext}>
        {isLast ? 'VIEW RESULTS →' : `START LEVEL ${stat.level + 1} →`}
      </button>
    </div>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div className={styles.statBox}>
      <span className={styles.statVal} style={{ color }}>{value}</span>
      <span className={styles.statLbl}>{label}</span>
    </div>
  )
}
