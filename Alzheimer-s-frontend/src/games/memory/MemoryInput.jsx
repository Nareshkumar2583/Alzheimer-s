import React, { useEffect, useRef } from 'react'
import styles from './MemoryGame.module.css'

export default function MemoryInput({ value, onChange, onSubmit, sequence, timeElapsed }) {
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleKey(e) {
    if (e.key === 'Enter') onSubmit()
  }

  // Real-time char-by-char feedback
  const chars = value.split('')
  const seqChars = sequence

  return (
    <div className={styles.inputSection}>
      <div className={styles.inputLabel}>
        <span>TYPE THE SEQUENCE</span>
        <span className={styles.timer}>⏱ {timeElapsed.toFixed(1)}s</span>
      </div>

      {/* Visual character feedback */}
      <div className={styles.charFeedback}>
        {seqChars.map((_, i) => {
          let cls = styles.charSlot
          if (i < chars.length) {
            cls += chars[i] === seqChars[i] ? ` ${styles.charCorrect}` : ` ${styles.charWrong}`
          } else if (i === chars.length) {
            cls += ` ${styles.charCurrent}`
          }
          return (
            <div key={i} className={cls}>
              {chars[i] || '_'}
            </div>
          )
        })}
      </div>

      <div className={styles.inputRow}>
        <input
          ref={inputRef}
          className={styles.textInput}
          type="text"
          value={value}
          maxLength={sequence.length}
          onChange={e => onChange(e.target.value.toUpperCase())}
          onKeyDown={handleKey}
          placeholder={`Type ${sequence.length} letters…`}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <button className={styles.submitBtn} onClick={onSubmit}>
          SUBMIT
        </button>
      </div>

      <p className={styles.inputHint}>Press Enter or click Submit when done</p>
    </div>
  )
}
