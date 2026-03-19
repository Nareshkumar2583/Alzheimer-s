import React from "react";
import styled from "styled-components";

const Panel=styled.div`

margin-top:30px;
padding:20px;
background:#1e293b;
border-radius:12px;

`;

function AnalyticsPanel({analytics}){

const accuracy=(analytics.correctClicks/analytics.totalClicks || 0)*100

const avgReaction=

analytics.reactionTimes.length
? analytics.reactionTimes.reduce((a,b)=>a+b,0)/analytics.reactionTimes.length
:0

return(

<Panel>

<h3>Cognitive Analytics</h3>

<p>Working Memory Span: {analytics.memoryScore.toFixed(3)}</p>

<p>Error Rate: {(100-accuracy).toFixed(1)}%</p>

<p>Accuracy: {accuracy.toFixed(1)}%</p>

<p>Average Reaction Time: {avgReaction.toFixed(2)} s</p>

</Panel>

)

}

export default AnalyticsPanel