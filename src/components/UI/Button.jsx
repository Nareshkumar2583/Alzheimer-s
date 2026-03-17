import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";

const StyledButton = styled(motion.button)`
display:flex;
align-items:center;
justify-content:center;
gap:8px;
border:none;
cursor:pointer;
padding:12px 20px;
border-radius:12px;
background:${({theme})=>theme.colors.primary};
color:white;
font-weight:600;

&:hover{
box-shadow:${({theme})=>theme.shadows.glow};
}
`;

function Button({children,onClick,icon,disabled}){

return(

<StyledButton
onClick={onClick}
disabled={disabled}
whileTap={{scale:0.9}}
whileHover={{scale:1.05}}
>

{icon}
{children}

</StyledButton>

)

}

export default Button;