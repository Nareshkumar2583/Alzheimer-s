import React, { useState } from "react";
import { ThemeProvider } from "styled-components";

import Header from "./components/Layout/Header";
import Container from "./components/Layout/Container";

import Card from "./components/UI/Card";
import MetricsDisplay from "./components/UI/MetricsDisplay";
import AnalyticsPanel from "./components/UI/AnalyticsPanel";

import GameBoard from "./components/Game/GameBoard";
import GameControls from "./components/Game/GameControls";

import Leaderboard from "./components/UI/Leaderboard";

import { theme } from "./styles/theme";
import "./styles/global.css";

import { generateSequence } from "./utils/gameLogic";

function App() {

const [gameState,setGameState]=useState({

sequence:[],
userSequence:[],
patternLength:2,
errors:0,
completionTime:0,
level:1,
isPlaying:false,
gameStatus:"idle"

})

const [highlighted,setHighlighted]=useState(null)

const [analytics,setAnalytics]=useState({

totalClicks:0,
correctClicks:0,
reactionTimes:[],
memoryScore:0

})

const [leaderboard,setLeaderboard]=useState([])

const [startTime,setStartTime]=useState(null)



const startGame=()=>{

const seq=generateSequence(gameState.patternLength)

setGameState(prev=>({

...prev,
sequence:seq,
userSequence:[],
isPlaying:true,
gameStatus:"showing"

}))

showSequence(seq)

}



const showSequence=(sequence)=>{

let i=0

const interval=setInterval(()=>{

setHighlighted(sequence[i])

setTimeout(()=>{

setHighlighted(null)

},400)

i++

if(i>=sequence.length){

clearInterval(interval)

setGameState(prev=>({

...prev,
gameStatus:"userTurn"

}))

setStartTime(Date.now())

}

},700)

}



const handleClick=(id)=>{

if(gameState.gameStatus!=="userTurn") return

const clickTime=(Date.now()-startTime)/1000

const newUser=[...gameState.userSequence,id]

const correct=id===gameState.sequence[newUser.length-1]

setAnalytics(prev=>({

...prev,
totalClicks:prev.totalClicks+1,
correctClicks:correct ? prev.correctClicks+1 : prev.correctClicks,
reactionTimes:[...prev.reactionTimes,clickTime]

}))

if(!correct){

setGameState(prev=>({

...prev,
errors:prev.errors+1,
gameStatus:"failed",
userSequence:[]

}))

return

}

if(newUser.length===gameState.sequence.length){

const completion=(Date.now()-startTime)/1000

const accuracy=(analytics.correctClicks+1)/(analytics.totalClicks+1)

const memoryScore=(gameState.level * accuracy)/completion

setAnalytics(prev=>({

...prev,
memoryScore

}))

setGameState(prev=>({

...prev,
userSequence:newUser,
completionTime:completion,
level:prev.level+1,
patternLength:prev.patternLength+1,
gameStatus:"completed"

}))

addScore(memoryScore)

setTimeout(()=>{

startGame()

},1500)

return

}

setGameState(prev=>({

...prev,
userSequence:newUser

}))

}



const addScore=(score)=>{

const player="Player"

const newEntry={

player,
score:score.toFixed(3),
level:gameState.level,
date:new Date().toLocaleDateString()

}

setLeaderboard(prev=>[...prev,newEntry].sort((a,b)=>b.score-a.score).slice(0,5))

}



const resetGame=()=>{

setGameState({

sequence:[],
userSequence:[],
patternLength:2,
errors:0,
completionTime:0,
level:1,
isPlaying:false,
gameStatus:"idle"

})

setHighlighted(null)

}



return(

<ThemeProvider theme={theme}>

<Header/>

<Container>

<Card>

<GameBoard
gameState={gameState}
onCellClick={handleClick}
highlightedCell={highlighted}
/>

<GameControls
onStart={startGame}
onReset={resetGame}
isPlaying={gameState.isPlaying}
/>

<MetricsDisplay
patternLength={gameState.patternLength}
errors={gameState.errors}
completionTime={gameState.completionTime}
level={gameState.level}
/>

<AnalyticsPanel analytics={analytics} />

<Leaderboard scores={leaderboard} />

</Card>

</Container>

</ThemeProvider>

)

}

export default App