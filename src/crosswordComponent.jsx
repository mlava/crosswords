import { createComponentRender } from "roamjs-components/components/ComponentContainer";
import React from 'react';
import {
    CrosswordProvider,
    CrosswordGrid,
    DirectionClues,
  } from '@jaredreisinger/react-crossword';

const CrosswordElement = ({ blockUid }) => {
    let blockData = window.roamAlphaAPI.data.pull("[:node/title :block/string {:block/children ...} {:block/parents ...}]", `[:block/uid \"${blockUid}\"]`);
    
    let cString, crosswordData;
    for (var i=0; i < blockData[":block/parents"].length; i++) {
        if (blockData[":block/parents"][i][":block/string"] == "NYT Crossword") {
            cString = blockData[":block/parents"][i][":block/children"][0][":block/children"][1][":block/string"];
        }
    }
    if (cString != null) {
        crosswordData = cString.split("^^");
    }
return <CrosswordProvider data={JSON.parse(crosswordData[1])} storageKey={crosswordData[1]}>
<div class="crosswordGrid">
    <CrosswordGrid class="crosswordGrid1" />
  <DirectionClues direction="across" />
  <DirectionClues direction="down" />
</div>
</CrosswordProvider>;
    //return <div><button onClick="isCrosswordCorrect()">Check</button><Crossword data={JSON.parse(crosswordData[1])} columnBreakpoint={'300px'} storageKey={crosswordData[1]} /></div>;
};

export const renderCrossword = createComponentRender(
    ({ blockUid }) => <CrosswordElement blockUid={blockUid} />,
    "crossword-element-parent"
  );