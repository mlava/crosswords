import { createComponentRender } from "roamjs-components/components/ComponentContainer";
import React, { useEffect } from 'react';
import {
    CrosswordProvider,
    CrosswordGrid,
    DirectionClues,
} from '@jaredreisinger/react-crossword';

const CrosswordElement = ({ blockUid }) => {
    let cString, crosswordData, cRRGuesses, cRRGuessesUid, cRRGuessesString, cRRGuessesDate, cLSGuesses, cLSGuessesDate;
    let blockData = window.roamAlphaAPI.data.pull("[:node/title :block/string :block/uid {:block/children ...} {:block/parents ...}]", `[:block/uid \"${blockUid}\"]`);
    let key = "roam_research_nytcrossword_";
    for (var i = 0; i < blockData[":block/parents"].length; i++) {
        if (blockData[":block/parents"][i][":block/string"] == "NYT Crossword") {
            if (blockData[":block/parents"][i].hasOwnProperty([":block/children"])) {
                key += blockData[":block/parents"][i][":block/children"][0][":block/string"].split(" ~ ")[0];
                if (blockData[":block/parents"][i][":block/children"][0].hasOwnProperty([":block/children"])) {
                    if (blockData[":block/parents"][i][":block/children"][0][":block/children"][0].hasOwnProperty([":block/children"])) {
                        cString = blockData[":block/parents"][i][":block/children"][0][":block/children"][0][":block/children"][0][":block/string"];
                        cRRGuesses = blockData[":block/parents"][i][":block/children"][0][":block/children"][0][":block/children"][1][":block/string"];
                        cRRGuessesUid = blockData[":block/parents"][i][":block/children"][0][":block/children"][0][":block/children"][1][":block/uid"];
                    }
                }
            }
        }
    }

    //// react-crossword stores guess data in localstorage, which won't work for RR as user might access page with crossword from several browsers/devices
    //// need to store data in RR and then update LS and RR data as required to keep them in sync
    // check if guesses already stored in RR
    if (cRRGuesses != undefined) {
        if (cRRGuesses.includes("^^")) {
            cRRGuessesString = cRRGuesses.split("^^")[1].trim();
            localStorage.setItem(key, cRRGuessesString);
        }
    }

    // add listener so that can update RR guesses if localStorage is changed
    window.addEventListener("storage", localStorageObserver);
    async function localStorageObserver() {
        await sleep(100); // wait for localStorage write to occur
        let ls = localStorage.getItem(key);
        let string = "Crossword Guesses: #NYTCrosswordData^^" + ls + "^^";
        window.roamAlphaAPI.updateBlock({ "block": { "uid": cRRGuessesUid, "string": string } });
    }
    //// finished ensuring sync between RR and browser localStorage

    // finally, get the crossword data to build and render
    if (cString != null) {
        crosswordData = cString.split("^^");
    }

    useEffect(() => {
        return async () => {
            removeEventListener('storage', localStorageObserver);
            let ls = localStorage.getItem(key);
            if (ls != undefined) { // update RR from LS
                let string = "Crossword Guesses: #NYTCrosswordData^^" + ls + "^^";
                await window.roamAlphaAPI.updateBlock({ "block": { "uid": cRRGuessesUid, "string": string } });
            }
            await sleep(100);
            localStorage.removeItem(key); // clean up localstorage :-)
        };
    }, []);

    if (cRRGuessesString != "null" && cRRGuessesString != undefined) {
        return <CrosswordProvider data={JSON.parse(crosswordData[1])} storageKey={key} onLoadedCorrect={localStorage.setItem(key, cRRGuessesString)} /*onCellChange={() => window.dispatchEvent(new Event('storage'))}*/ /*isCrosswordCorrect={() => alert("All Correct!")} onAnswerCorrect={() => alert("Correct!")}*/ >
            <div class="crosswordGrid">
                <CrosswordGrid />
                <DirectionClues direction="across" />
                <DirectionClues direction="down" />
            </div>
        </CrosswordProvider>;
    } else {
        return <CrosswordProvider data={JSON.parse(crosswordData[1])} storageKey={key} /*onCellChange={() => window.dispatchEvent(new Event('storage'))}*/ /*isCrosswordCorrect={() => alert("All Correct!")} onAnswerCorrect={() => alert("Correct!")}*/ >
            <div class="crosswordGrid">
                <CrosswordGrid />
                <DirectionClues direction="across" />
                <DirectionClues direction="down" />
            </div>
        </CrosswordProvider>;
    }

};

export const renderCrossword = createComponentRender(
    ({ blockUid }) => <CrosswordElement blockUid={blockUid} />,
    "crossword-element-parent"
);

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}