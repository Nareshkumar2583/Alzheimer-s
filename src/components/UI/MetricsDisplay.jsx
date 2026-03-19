import React from "react";
import styled from "styled-components";
import { FaClock,FaExclamationTriangle,FaChartLine,FaBrain } from "react-icons/fa";

const Container = styled.div`
display:grid;
grid-template-columns:repeat(2,1fr);
gap:15px;
margin-top:20px;
`;

const MetricCard = styled.div`
background:#334155;
padding:15px;
border-radius:12px;
text-align:center;
`;

function MetricsDisplay({patternLength,errors,completionTime,level}){

return(

<Container>

<MetricCard>
<FaChartLine/>
<p>Pattern</p>
<h2>{patternLength}</h2>
</MetricCard>

<MetricCard>
<FaExclamationTriangle/>
<p>Errors</p>
<h2>{errors}</h2>
</MetricCard>

<MetricCard>
<FaClock/>
<p>Time</p>
<h2>{completionTime.toFixed(1)}</h2>
</MetricCard>

<MetricCard>
<FaBrain/>
<p>Memory</p>
<h2>{level}</h2>
</MetricCard>

</Container>

)

}

export default MetricsDisplay;