import React from "react";
import styled from "styled-components";
import Button from "../UI/Button";
import { FaPlay,FaRedo } from "react-icons/fa";

const Controls=styled.div`
display:flex;
gap:20px;
justify-content:center;
margin-top:20px;
`;

function GameControls({onStart,onReset,isPlaying}){

return(

<Controls>

{!isPlaying &&

<Button icon={<FaPlay/>} onClick={onStart}>
Start Game
</Button>

}

<Button icon={<FaRedo/>} onClick={onReset}>
Reset
</Button>

</Controls>

)

}

export default GameControls;