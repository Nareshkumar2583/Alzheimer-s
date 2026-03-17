import React from "react";
import styled from "styled-components";

const Board=styled.div`

margin-top:30px;
padding:20px;
background:#1e293b;
border-radius:12px;

`;

const Row=styled.div`

display:flex;
justify-content:space-between;
margin:6px 0;

`;

function Leaderboard({scores}){

return(

<Board>

<h3>Leaderboard</h3>

{scores.length===0 && <p>No scores yet</p>}

{scores.map((s,i)=>(

<Row key={i}>

<span>{i+1}. {s.player}</span>

<span>{s.score}</span>

<span>Lvl {s.level}</span>

</Row>

))}

</Board>

)

}

export default Leaderboard