import React from 'react'
import styles from './FinalReport.module.css'

const ZONE_CONFIG = {
  'Normal':       { color: 'var(--hit)',  bg: 'var(--hit-dim)',  label: 'Normal Cognition' },
  'MCI':          { color: 'var(--warn)', bg: 'rgba(255,184,0,0.1)', label: 'Mild Cognitive Impairment' },
  "Alzheimer's":  { color: 'var(--miss)', bg: 'var(--miss-dim)', label: "Alzheimer's Range" },
}

export default function FinalReport({ lvlStats, totalStats, apiResult, apiLoading, apiError, onSubmit, onReset }) {
  const zone = apiResult ? ZONE_CONFIG[apiResult.zone] || ZONE_CONFIG['Normal'] : null

  return (
    <div className={styles.report} style={{ animation: 'fadeIn 0.5s ease' }}>
      <div className={styles.titleRow}>
        <h2 className={styles.title}>SESSION COMPLETE</h2>
        <span className={styles.levels}>{lvlStats.length} LEVELS</span>
      </div>

      {/* Aggregated totals */}
      <div className={styles.totalsGrid}>
        <TotalBox label="Total Accuracy"  value={`${totalStats.accuracy}%`}                              color="var(--accent)" big />
        <TotalBox label="Total Correct"   value={totalStats.max_mistakes - totalStats.mistakes}             color="var(--hit)" />
        <TotalBox label="Total Errors"    value={totalStats.mistakes}                                       color="var(--miss)" />
        <TotalBox label="Total Time"      value={`${totalStats.time_taken}s`}    color="var(--text2)" />
        <TotalBox label="Learning Score"  value={`${totalStats.learning_score}/${totalStats.max_learning}`} color="var(--warn)" />
      </div>

      {/* Per-level breakdown */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>LEVEL BREAKDOWN</span>
        <div className={styles.levelRows}>
          {lvlStats.map(s => (
            <div key={s.level} className={styles.levelRow}>
              <span className={styles.lvlNum}>LVL {s.level}</span>
              <div className={styles.lvlBar}>
                <div className={styles.lvlFill}
                  style={{ width: `${s.accuracy}%`,
                    background: s.accuracy >= 70 ? 'var(--hit)' : s.accuracy >= 50 ? 'var(--warn)' : 'var(--miss)'
                  }} />
              </div>
              <span className={styles.lvlAcc}>{s.accuracy}%</span>
              <span className={styles.lvlDetail}>
                ✓{s.correct} ✗{s.mistakes} {s.timeTaken}s
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Payload sent to backend */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>PAYLOAD TO BACKEND</span>
        <div className={styles.payload}>
          <pre className={styles.code}>{JSON.stringify({
            accuracy:       totalStats.accuracy,
            mistakes:       totalStats.mistakes,
            max_mistakes:   totalStats.max_mistakes,
            time_taken:     totalStats.time_taken,
            max_time:       totalStats.max_time,
            learning_score: totalStats.learning_score,
            max_learning:   totalStats.max_learning,
          }, null, 2)}</pre>
        </div>
      </div>

      {/* API result */}
      {!apiResult && !apiLoading && (
        <button className={styles.submitBtn} onClick={onSubmit}>
          ANALYSE WITH ML MODEL →
        </button>
      )}

      {apiLoading && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Running cognitive assessment model...</span>
        </div>
      )}

      {apiError && !apiResult && (
        <div className={styles.errorBox}>
          <span className={styles.errorTitle}>⚠ Backend unavailable</span>
          <span className={styles.errorMsg}>
            Start your Flask server at localhost:5000. Error: {apiError}
          </span>
        </div>
      )}

      {apiResult && (
        <div className={styles.resultBox} style={{ borderColor: zone?.color, background: zone?.bg }}>
          <div className={styles.resultHeader}>
            <span className={styles.resultLabel}>COGNITIVE ASSESSMENT RESULT</span>
            <span className={`${styles.confidenceBadge} ${apiResult.confidence === 'Borderline' ? styles.borderline : styles.clear}`}>
              {apiResult.confidence}
            </span>
          </div>

          <div className={styles.mmseRow}>
            <span className={styles.mmseNum} style={{ color: zone?.color }}>
              {apiResult.mmse}
            </span>
            <div className={styles.mmseInfo}>
              <span className={styles.mmseLabel}>MMSE SCORE</span>
              <div className={styles.mmsebar}>
                <div className={styles.mmseBarFill}
                  style={{
                    width: `${(apiResult.mmse / 30) * 100}%`,
                    background: zone?.color,
                  }} />
                {/* threshold markers */}
                <div className={styles.marker} style={{ left: `${(18/30)*100}%` }} />
                <div className={styles.marker} style={{ left: `${(24/30)*100}%` }} />
              </div>
              <div className={styles.mmseScale}>
                <span>0</span><span>Alz|18</span><span>MCI|24</span><span>Normal|30</span>
              </div>
            </div>
          </div>

          <div className={styles.zoneBand}>
            <span className={styles.zoneIcon}>◈</span>
            <span className={styles.zoneName} style={{ color: zone?.color }}>{apiResult.band}</span>
          </div>

          <div className={styles.advice}>{apiResult.advice}</div>

          {apiResult.clinical && (
            <div className={styles.clinicalGrid}>
              <ClinStat label="RAVLT" value={apiResult.clinical.RAVLT_immediate} />
              <ClinStat label="ADAS13" value={apiResult.clinical.ADAS13} />
              <ClinStat label="CDRSB"  value={apiResult.clinical.CDRSB} />
              <ClinStat label="FAQ"    value={apiResult.clinical.FAQ} />
            </div>
          )}
        </div>
      )}

      <button className={styles.resetBtn} onClick={onReset}>
        ↺  PLAY AGAIN
      </button>
    </div>
  )
}

function TotalBox({ label, value, color, big }) {
  return (
    <div className={`${styles.totalBox} ${big ? styles.bigBox : ''}`}>
      <span className={styles.totalVal} style={{ color, fontSize: big ? '32px' : '22px' }}>{value}</span>
      <span className={styles.totalLbl}>{label}</span>
    </div>
  )
}

function ClinStat({ label, value }) {
  return (
    <div className={styles.clinBox}>
      <span className={styles.clinVal}>{value}</span>
      <span className={styles.clinLbl}>{label}</span>
    </div>
  )
}