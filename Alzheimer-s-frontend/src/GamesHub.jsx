import React, { useState } from 'react'
import styles from './GamesHub.module.css'

const GAMES = [
  {
    id: 'spatial',
    title: 'Spatial Matrix',
    subtitle: 'COGNIGRID',
    description: 'Watch a grid light up in sequence, then tap the cells back in order from memory. A test of spatial working memory.',
    icon: '⊞',
    difficulty: 'SPATIAL',
    difficultyColor: 'cyan',
    tags: ['Grid', 'Visual', 'Sequence'],
    stat1: { label: 'Grid Size', value: 'Up to 5×5' },
    stat2: { label: 'Sequences', value: '3–9 cells' },
  },
  {
    id: 'memory',
    title: 'Cognitive Memory',
    subtitle: 'LETTER RECALL',
    description: 'Watch letters flash on screen one by one, then type the exact sequence from memory. Speed and accuracy matter.',
    icon: 'Aa',
    difficulty: 'VERBAL',
    difficultyColor: 'purple',
    tags: ['Letters', 'Typing', 'Speed'],
    stat1: { label: 'Characters', value: '4–9 letters' },
    stat2: { label: 'Delay', value: '1–3 sec' },
  },
  {
    id: 'dualnback',
    title: 'Dual N-Back',
    subtitle: 'WORKING MEMORY',
    description: 'A grid square lights up AND a letter appears each step. Detect when position or letter matches N steps ago. Trains executive function.',
    icon: '⟳',
    difficulty: 'EXECUTIVE',
    difficultyColor: 'orange',
    tags: ['Attention', 'N-Back', 'Advanced'],
    stat1: { label: 'N-Back Level', value: '1-Back → 4' },
    stat2: { label: 'Steps', value: '15 per round' },
  },
]

export default function GamesHub({ onSelect, darkMode, onToggleDark }) {
  const [hovered, setHovered] = useState(null)

  return (
    <div className={`${styles.hub} ${darkMode ? styles.light : ''}`}>
      {/* Animated background */}
      <div className={styles.bgGrid} aria-hidden />
      <div className={styles.bgGlow1} aria-hidden />
      <div className={styles.bgGlow2} aria-hidden />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoAcc}>COGNI</span>VERSE
        </div>
        <p className={styles.tagline}>Cognitive Assessment Game Suite</p>
        <button className={styles.themeBtn} onClick={onToggleDark} title="Toggle theme">
          {darkMode ? '☀️' : '🌙'}
        </button>
      </header>

      {/* Sub-heading */}
      <div className={styles.selectLabel}>SELECT A GAME TO BEGIN</div>

      {/* Game Cards */}
      <div className={styles.cardsRow}>
        {GAMES.map(g => (
          <button
            key={g.id}
            className={`${styles.card} ${hovered === g.id ? styles.cardHovered : ''} ${styles[`card_${g.difficultyColor}`]}`}
            onMouseEnter={() => setHovered(g.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelect(g.id)}
          >
            {/* Icon */}
            <div className={`${styles.cardIcon} ${styles[`icon_${g.difficultyColor}`]}`}>
              {g.icon}
            </div>

            {/* Diff badge */}
            <div className={`${styles.diffBadge} ${styles[`badge_${g.difficultyColor}`]}`}>
              {g.difficulty}
            </div>

            <div className={styles.cardSubtitle}>{g.subtitle}</div>
            <div className={styles.cardTitle}>{g.title}</div>
            <p className={styles.cardDesc}>{g.description}</p>

            {/* Tags */}
            <div className={styles.tags}>
              {g.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
            </div>

            {/* Mini stats */}
            <div className={styles.miniStats}>
              <div className={styles.miniStat}>
                <span className={styles.miniStatVal}>{g.stat1.value}</span>
                <span className={styles.miniStatLbl}>{g.stat1.label}</span>
              </div>
              <div className={styles.miniStatDivider} />
              <div className={styles.miniStat}>
                <span className={styles.miniStatVal}>{g.stat2.value}</span>
                <span className={styles.miniStatLbl}>{g.stat2.label}</span>
              </div>
            </div>

            {/* CTA */}
            <div className={`${styles.playBtn} ${styles[`playBtn_${g.difficultyColor}`]}`}>
              PLAY NOW →
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <span>COGNIVERSE · Cognitive Assessment Suite</span>
        <span>·</span>
        <span>For research purposes only</span>
      </footer>
    </div>
  )
}
