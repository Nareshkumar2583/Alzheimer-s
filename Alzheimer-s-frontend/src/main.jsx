import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import App        from './App.jsx'
import GamesHub   from './GamesHub.jsx'
import MemoryGame from './games/memory/MemoryGame.jsx'
import DualNBack  from './games/dualnback/DualNBack.jsx'
import './index.css'

function Root() {
  const [activeGame, setActiveGame] = useState(null)   // null | 'spatial' | 'memory'
  const [darkMode,   setDarkMode]   = useState(false)

  function handleBack() { setActiveGame(null) }
  function toggleDark()  { setDarkMode(d => !d) }

  if (activeGame === 'spatial') {
    return <App onBack={handleBack} darkMode={darkMode} onToggleDark={toggleDark} />
  }
  if (activeGame === 'memory') {
    return <MemoryGame onBack={handleBack} darkMode={darkMode} onToggleDark={toggleDark} />
  }
  if (activeGame === 'dualnback') {
    return <DualNBack onBack={handleBack} darkMode={darkMode} onToggleDark={toggleDark} />
  }
  return <GamesHub onSelect={setActiveGame} darkMode={darkMode} onToggleDark={toggleDark} />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
