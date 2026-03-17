import React from "react";
import styled from "styled-components";

const Cell=styled.div`

aspect-ratio:1;
background:${props=>props.highlighted ? "#fbbf24" : "#334155"};
border-radius:12px;
display:flex;
align-items:center;
justify-content:center;
font-size:20px;
cursor:pointer;
transition:0.2s;

&:hover{
background:#6366f1;
}

`;

function GameCell({id,onClick,highlighted,disabled}){

return(

<Cell
highlighted={highlighted}
onClick={()=>!disabled && onClick(id)}
>

{id}

</Cell>

)

}

export default GameCell