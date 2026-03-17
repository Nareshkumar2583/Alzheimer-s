import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";

const StyledCard = styled(motion.div)`
background:rgba(255,255,255,0.05);
border-radius:20px;
padding:30px;
backdrop-filter:blur(10px);
border:1px solid rgba(255,255,255,0.1);
`;

function Card({children}){

return(

<StyledCard
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
transition={{duration:0.4}}
>

{children}

</StyledCard>

)

}

export default Card;