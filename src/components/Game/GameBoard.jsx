import React from "react";
import styled from "styled-components";
import GameCell from "./GameCell";

const Board=styled.div`

display:grid;
grid-template-columns:repeat(3,1fr);
gap:15px;
max-width:400px;
margin:auto;

`;

function GameBoard({gameState,onCellClick,highlightedCell}){

const cells=[1,2,3,4,5,6,7,8,9]

return(

<Board>

{cells.map(id=>(

<GameCell
key={id}
id={id}
onClick={onCellClick}
highlighted={highlightedCell===id}
disabled={gameState.gameStatus!=="userTurn"}
/>

))}

</Board>

)

}

export default GameBoard