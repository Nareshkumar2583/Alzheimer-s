import React from 'react'
import styles from './Grid.module.css'

export default function Grid({ gridSize, litCell, cellState, onCellClick, disabled }) {
  const cells = Array.from({ length: gridSize * gridSize }, (_, i) => i)

  return (
    <div
      className={styles.grid}
      style={{ '--cols': gridSize }}
    >
      {cells.map(i => {
        const state = cellState[i] || 'idle'
        const isLit = i === litCell
        return (
          <button
            key={i}
            className={[
              styles.cell,
              state !== 'idle' && styles[state],
              isLit      && styles.lit,
              disabled   && styles.locked,
            ].filter(Boolean).join(' ')}
            onClick={() => !disabled && onCellClick(i)}
            aria-label={`Cell ${i + 1}`}
            style={{ pointerEvents: disabled ? 'none' : 'auto' }}
          >
            <span className={styles.inner} />
            {isLit && <span className={styles.ring} />}
          </button>
        )
      })}
    </div>
  )
}