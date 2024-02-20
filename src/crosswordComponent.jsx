import { createComponentRender } from "roamjs-components/components/ComponentContainer";
import { React, useEffect } from 'react';
import {
    CrosswordProvider,
    CrosswordGrid,
    DirectionClues,
} from '@jaredreisinger/react-crossword';

const CrosswordElement = ({ blockUid }) => {
    let blockData = window.roamAlphaAPI.data.pull("[:node/title :block/string :block/uid {:block/children ...} {:block/parents ...}]", `[:block/uid \"${blockUid}\"]`);

    let cString, crosswordData, cRRGuesses, cRRGuessesUid, cRRGuessesString, cRRGuessesDate, cLSGuesses, cLSGuessesDate;
    let key = "roam_research_nytcrossword_";
    for (var i = 0; i < blockData[":block/parents"].length; i++) {
        if (blockData[":block/parents"][i][":block/string"] == "NYT Crossword") {
            if (blockData[":block/parents"][i].hasOwnProperty([":block/children"])) {
                key += blockData[":block/parents"][i][":block/children"][0][":block/string"].split(" ~ ")[0];
                if (blockData[":block/parents"][i][":block/children"][0].hasOwnProperty([":block/children"])) {
                    cString = blockData[":block/parents"][i][":block/children"][0][":block/children"][1][":block/string"];
                    cRRGuesses = blockData[":block/parents"][i][":block/children"][0][":block/children"][2][":block/string"];
                    cRRGuessesUid = blockData[":block/parents"][i][":block/children"][0][":block/children"][2][":block/uid"];
                }
            }
        }
    }

    //// react-crossword stores guess data in localstorage, which won't work for RR as user might access page with crossword from several browsers/devices
    //// need to store data in RR and then update LS and RR data as required to keep them in sync

    // check if guesses already in localstorage
    if (key != "roam_research_nytcrossword_") { // there's a valid key to look for
        cLSGuesses = localStorage.getItem(key);
    }
    if (cLSGuesses != undefined && cLSGuesses != null) { // there's a localStorage key that matches
        cLSGuessesDate = JSON.parse(cLSGuesses).date;
    }

    // check if guesses already stored in RR
    if (cRRGuesses != undefined) {
        if (cRRGuesses.includes("^^")) {
            cRRGuessesString = cRRGuesses.split("^^")[1].trim();
        }
    }

    // check whether localStorage needs to be written/updated based on RR graph guesses (account for use on another browser)
    if (cRRGuessesString != undefined && JSON.parse(cRRGuessesString)) { // check if there are guesses stored in RR
        let temp = JSON.parse(cRRGuessesString);
        cRRGuessesDate = temp.date;

        if (cLSGuessesDate != undefined && cRRGuessesDate > cLSGuessesDate) { // RR guesses are newer than localStorage, so update localStorage
            localStorage.setItem(key, cRRGuessesString);
            console.info("overwriting LS");
        } else if (cLSGuessesDate != undefined && cRRGuessesDate < cLSGuessesDate) { // localStorage guesses are newer than RR, so update RR
            let string = "Crossword Guesses: #NYTCrosswordData^^" + cLSGuesses + "^^";
            window.roamAlphaAPI.updateBlock({ "block": { "uid": cRRGuessesUid, "string": string } });
        }
    } else {
        let string = "Crossword Guesses: #NYTCrosswordData^^" + cLSGuesses + "^^";
        window.roamAlphaAPI.updateBlock({ "block": { "uid": cRRGuessesUid, "string": string } });
    }

    // add listener so that can update RR guesses if localStorage is changed
    window.addEventListener("storage", localStorageObserver);
    async function localStorageObserver() {
        await sleep(100); // wait for localStorage write to occur
        let ls = localStorage.getItem(key);
        let string = "Crossword Guesses: #NYTCrosswordData^^" + ls + "^^";
        window.roamAlphaAPI.updateBlock({ "block": { "uid": cRRGuessesUid, "string": string } });
    }
    // monitor for hashchange to remove localStorageObserver 
    addEventListener("hashchange", (event) => { removeEventListener('storage', localStorageObserver) });

    //// finished ensuring sync between RR and browser localStorage

    // finally, render the crossword
    if (cString != null) {
        crosswordData = cString.split("^^");
    }
    
    return <CrosswordProvider data={JSON.parse(crosswordData[1])} storageKey={key} onCellChange={() => window.dispatchEvent(new Event('storage'))} /*isCrosswordCorrect={() => alert("All Correct!")} onAnswerCorrect={() => alert("Correct!")}*/ >
        <div class="crosswordGrid">
            <CrosswordGrid class="crosswordGrid1" />
            <DirectionClues direction="across" />
            <DirectionClues direction="down" />
        </div>
    </CrosswordProvider>;
};

export const renderCrossword = createComponentRender(
    ({ blockUid }) => <CrosswordElement blockUid={blockUid} />,
    "crossword-element-parent"
);

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}