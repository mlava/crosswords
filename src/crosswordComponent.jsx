import { createComponentRender } from "roamjs-components/components/ComponentContainer";
import React, { useEffect, useState } from 'react';
import {
    CrosswordProvider,
    CrosswordGrid,
    DirectionClues,
} from '@jaredreisinger/react-crossword';

const CrosswordElement = ({ blockUid }) => {
    const [guesses, setGuesses] = useState([]);
    let cString, crosswordData, cRRGuesses, cRRGuessesUid, cRRGuessesString, blockData, key;
    var newVersion = true;

    blockData = window.roamAlphaAPI.data.pull("[:node/title :block/string :block/uid :block/props {:block/children ...} {:block/parents ...}]", `[:block/uid \"${blockUid}\"]`);
    key = "roam_research_crossword_";

    for (var i = 0; i < blockData[":block/parents"].length; i++) {
        if (blockData[":block/parents"][i].hasOwnProperty([":block/string"])) {
            var blockString = blockData[":block/parents"][i][":block/string"];
            if (blockString.startsWith("**NYT Crossword**") || blockString.startsWith("**Guardian Cryptic Crossword**")) {
                if (blockData[":block/parents"][i][":block/string"].startsWith("**NYT Crossword**")) {
                    key += "nyt_";
                } else if (blockData[":block/parents"][i][":block/string"].startsWith("**Guardian Cryptic Crossword**")) {
                    key += "gcc_";
                }
                key += blockData[":block/parents"][i][":block/children"][0][":block/string"].split(" ~ ")[0];
                if (blockData[":block/parents"][i].hasOwnProperty([":block/props"])) { // new style -> get data from block/props
                    cRRGuessesUid = blockData[":block/parents"][i][":block/uid"];
                    cRRGuessesString = blockData[":block/parents"][i][":block/props"][":crossword_guesses"];
                    crosswordData = blockData[":block/parents"][i][":block/props"][":crossword_definition"];
                } else { // old style -> get data from block/children
                    let string = blockData[":block/children"][1][":block/string"].toString();
                    if (string.startsWith("Crossword Definition")) {
                        crosswordData = blockData[":block/children"][1][":block/string"];
                        crosswordData = crosswordData.split("^^")[1];
                        cRRGuesses = blockData[":block/children"][0][":block/string"];
                        cRRGuessesUid = blockData[":block/children"][0][":block/uid"];
                    } else {
                        crosswordData = blockData[":block/children"][0][":block/string"];
                        crosswordData = crosswordData.split("^^")[1];
                        cRRGuesses = blockData[":block/children"][1][":block/string"];
                        cRRGuessesUid = blockData[":block/children"][1][":block/uid"];
                    }
                    newVersion = false;
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
        } else {
            localStorage.setItem(key, cRRGuessesString);
        }
    }
    //// finished ensuring sync between RR and browser localStorage

    async function storeGuesses() {
        await sleep(100);
        let ls = localStorage.getItem(key);
        if (ls != undefined) { // update RR from LS
            if (newVersion) {
                window.roamAlphaAPI.updateBlock({
                    "block": {
                        "uid": cRRGuessesUid,
                        "props": {
                            "crossword_definition": crosswordData,
                            "crossword_guesses": ls
                        }
                    }
                });
            } else {
                let string = "Crossword Guesses: #NYTCrosswordData^^" + ls + "^^";
                window.roamAlphaAPI.updateBlock({ "block": { "uid": cRRGuessesUid, "string": string } });
            }
        }
    }

    useEffect(() => {
        const fetchGuesses = async () => {
            setGuesses(cRRGuessesString);
        };
        fetchGuesses();

        return async () => {
            storeGuesses();
            localStorage.removeItem(key); // clean up localstorage :-)
        };
    }, []);

    return <CrosswordProvider data={JSON.parse(crosswordData)} storageKey={key} onCorrect={storeGuesses} onLoadedCorrect={localStorage.setItem(key, cRRGuessesString)} isCrosswordCorrect={() => alert("Congratulations!")} >
        <div class="crosswordGrid">
            <CrosswordGrid />
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