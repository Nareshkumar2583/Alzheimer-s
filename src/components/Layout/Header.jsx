import React from "react";
import styled from "styled-components";

const HeaderBox=styled.div`

text-align:center;
padding:40px;

`;

function Header(){

return(

<HeaderBox>

<h1>Spatial Memory Game</h1>

<p>
Test your spatial working memory using a Corsi Block inspired task
</p>

</HeaderBox>

)

}

export default Header;