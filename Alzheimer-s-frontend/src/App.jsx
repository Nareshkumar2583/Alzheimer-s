import React from 'react'
import { useGameEngine } from './hooks/useGameEngine'
import Grid         from './components/Grid'
import HUD          from './components/HUD'
import ResultCard   from './components/ResultCard'
import FinalReport  from './components/FinalReport'
import styles       from './App.module.css'

export default function App() {
  const [selectedLevels, setSelectedLevels] = React.useState(3)
  const game = useGameEngine(selectedLevels)
  const { phase, PHASE } = game

  return (
    <div className={styles.app}>
      <div className={styles.bgGrid} aria-hidden />

      {/* ── LANDING ── */}
      {phase === PHASE.IDLE && (
        <div className={styles.landing} style={{ animation: 'fadeIn 0.6s ease' }}>
          <div className={styles.logo}>
            <span className={styles.logoAccent}>COGNI</span>GRID
          </div>
          <p className={styles.tagline}>Cognitive memory sequence assessment</p>

          <div className={styles.howItWorks}>
            <div className={styles.step}><span className={styles.stepNum}>01</span>
              <span>Watch the grid — cells light up one by one in a sequence</span></div>
            <div className={styles.step}><span className={styles.stepNum}>02</span>
              <span>Once the full sequence finishes, <strong>tap the cells in the same order from memory</strong></span></div>
            <div className={styles.step}><span className={styles.stepNum}>03</span>
              <span>Complete all selected levels — sequences get longer and faster each time</span></div>
          </div>

          <div className={styles.levelSelect}>
            <span className={styles.selectLabel}>NUMBER OF LEVELS</span>
            <div className={styles.levelBtns}>
              {[1,2,3,4,5].map(n => (
                <button key={n}
                  className={`${styles.lvlBtn} ${selectedLevels === n ? styles.lvlBtnActive : ''}`}
                  onClick={() => setSelectedLevels(n)}>
                  {n}
                </button>
              ))}
            </div>
            <span className={styles.levelHint}>
              {game.LEVEL_CONFIG[selectedLevels]?.label} · {game.LEVEL_CONFIG[selectedLevels]?.grid}×{game.LEVEL_CONFIG[selectedLevels]?.grid} grid · {game.LEVEL_CONFIG[selectedLevels]?.seqLen} cells to memorise on final level
            </span>
          </div>

          <div className={styles.profileSection}>
            <span className={styles.selectLabel}>YOUR PROFILE</span>
            <div className={styles.profileGrid}>
              <ProfileField label="Age" type="number" value={game.userProfile.age} min={18} max={100}
                onChange={v => game.setUserProfile(p => ({ ...p, age: parseInt(v) || 65 }))} />
              <ProfileField label="Education (years)" type="number" value={game.userProfile.pteducat} min={0} max={25}
                onChange={v => game.setUserProfile(p => ({ ...p, pteducat: parseInt(v) || 12 }))} />
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>APOE4 STATUS</label>
                <select className={styles.fieldInput} value={game.userProfile.apoe4}
                  onChange={e => game.setUserProfile(p => ({ ...p, apoe4: parseInt(e.target.value) }))}>
                  <option value={0}>Not Carrier (0)</option>
                  <option value={1}>Carrier (1)</option>
                  <option value={2}>Homozygous (2)</option>
                </select>
              </div>
            </div>
          </div>

          <button className={styles.startBtn} onClick={game.startGame}>
            BEGIN ASSESSMENT
          </button>
          <p className={styles.disclaimer}>For research purposes only. Not a clinical diagnostic tool.</p>
        </div>
      )}

      {/* ── COUNTDOWN ── */}
      {phase === PHASE.COUNTDOWN && (
        <div className={styles.countdown} style={{ animation: 'fadeIn 0.3s ease' }}>
          <span className={styles.cdLevel}>LEVEL {game.currentLvl} OF {game.totalLevels}</span>
          <div className={styles.cdNum} key={game.countdown}>
            {game.countdown > 0 ? game.countdown : 'WATCH'}
          </div>
          <span className={styles.cdHint}>
            Memorise {game.cfg.seqLen} cells · {game.cfg.grid}×{game.cfg.grid} grid
          </span>
        </div>
      )}

      {/* ── WATCHING: sequence plays, grid is locked ── */}
      {phase === PHASE.WATCHING && (
        <div className={styles.gameArea} style={{ animation: 'fadeIn 0.25s ease' }}>
          <div className={styles.watchBanner}>
            <span className={styles.watchIcon}>👁</span>
            <div className={styles.watchText}>
              <span className={styles.watchTitle}>WATCH THE SEQUENCE</span>
              <span className={styles.watchSub}>Memorise the order — you will tap it back next</span>
            </div>
            <div className={styles.seqBadge}>{game.cfg.seqLen} <span>cells</span></div>
          </div>

          <Grid
            gridSize={game.cfg.grid}
            litCell={game.litCell}
            cellState={{}}
            onCellClick={() => {}}
            disabled={true}
            watching={true}
          />

          <LevelDots current={game.currentLvl} total={game.totalLevels} />
        </div>
      )}

      {/* ── RECALLING: player taps from memory ── */}
      {phase === PHASE.RECALLING && (
        <div className={styles.gameArea} style={{ animation: 'fadeIn 0.3s ease' }}>
          <HUD
            recallIdx={game.recallIdx}
            seqLen={game.seqLen}
            recallLeft={game.recallLeft}
            level={game.currentLvl}
            totalLevels={game.totalLevels}
          />

          {/* Progress dots — one per cell in sequence */}
          <div className={styles.recallProgress}>
            {Array.from({ length: game.seqLen }, (_, i) => (
              <div key={i} className={`${styles.seqDot}
                ${i < game.recallIdx  ? styles.seqDotDone   : ''}
                ${i === game.recallIdx ? styles.seqDotActive : ''}
              `} />
            ))}
          </div>

          <Grid
            gridSize={game.cfg.grid}
            litCell={null}
            cellState={game.cellState}
            onCellClick={game.handleCellClick}
            disabled={false}
            watching={false}
          />

          <LevelDots current={game.currentLvl} total={game.totalLevels} />
        </div>
      )}

      {/* ── LEVEL RESULT ── */}
      {phase === PHASE.RESULT && game.lvlStats.length > 0 && (
        <div className={styles.resultArea}>
          <ResultCard
            stat={game.lvlStats[game.lvlStats.length - 1]}
            onNext={game.nextLevel}
            isLast={game.currentLvl >= game.totalLevels}
          />
        </div>
      )}

      {/* ── FINAL REPORT ── */}
      {phase === PHASE.COMPLETE && (
        <div className={styles.reportArea}>
          <FinalReport
            lvlStats={game.lvlStats}
            totalStats={game.totalStats}
            apiResult={game.apiResult}
            apiLoading={game.apiLoading}
            apiError={game.apiError}
            onSubmit={game.submitToBackend}
            onReset={game.reset}
          />
        </div>
      )}
    </div>
  )
}

function LevelDots({ current, total }) {
  return (
    <div style={{ display:'flex', gap:'8px', alignItems:'center', justifyContent:'center' }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          width: i + 1 === current ? '18px' : '6px', height: '6px',
          borderRadius: i + 1 === current ? '3px' : '50%',
          background: i + 1 < current ? 'var(--hit)' : i + 1 === current ? 'var(--accent)' : 'var(--border2)',
          boxShadow: i + 1 === current ? '0 0 10px var(--accent)' : 'none',
          transition: 'all 0.3s',
        }} />
      ))}
    </div>
  )
}

function ProfileField({ label, type, value, min, max, onChange }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
      <label style={{ fontSize:'9px', letterSpacing:'.12em', color:'var(--text3)', textTransform:'uppercase' }}>
        {label.toUpperCase()}
      </label>
      <input
        style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r)',
          color:'var(--text)', padding:'8px 10px', fontSize:'13px', width:'100%', fontFamily:'var(--font-m)' }}
        type={type} value={value} min={min} max={max}
        onChange={e => onChange(e.target.value)}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e =>  e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  )
}
