import React from "react";
import styled from "styled-components";

const Box=styled.div`

max-width:800px;
margin:auto;
padding:20px;

`;

function Container({children}){

return <Box>{children}</Box>

}

export default Container;