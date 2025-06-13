import { renderCrossword } from "./crosswordComponent";
import createButtonObserver from "roamjs-components/dom/createButtonObserver";
import createBlock from "roamjs-components/writes/createBlock";

var runners = {
    observers: [],
}

export default {
    onload: ({ extensionAPI }) => {
        const onloadArgs = { extensionAPI };
        const crosswordObserver = createButtonObserver({
            attribute: 'crossword',
            render: (b) => {
                renderCrossword(b, onloadArgs)
            }
        });
        runners['observers'] = [crosswordObserver];

        extensionAPI.ui.commandPalette.addCommand({
            label: "Random crossword from New York Times",
            callback: () => {
                const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
                if (uid == undefined) {
                    alert("Please focus a block before importing a puzzle");
                    return;
                } else {
                    window.roamAlphaAPI.updateBlock(
                        { block: { uid: uid, string: "Loading...".toString(), open: true } });
                    fetchCrossword(uid, false);
                }
            }
        });

        extensionAPI.ui.commandPalette.addCommand({
            label: "Today's crossword from New York Times",
            callback: () => {
                const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
                if (uid == undefined) {
                    alert("Please focus a block before importing a puzzle");
                    return;
                } else {
                    window.roamAlphaAPI.updateBlock(
                        { block: { uid: uid, string: "Loading...".toString(), open: true } });
                    fetchCrossword(uid, true);
                }
            }
        });

        const args = {
            text: "NYTCROSSWORD",
            help: "Import a random crossword from the New York Times",
            handler: (context) => {
                window.roamAlphaAPI.updateBlock(
                    { block: { uid: context.triggerUid, string: "Loading...".toString(), open: true } });
                fetchCrossword(context.triggerUid, false);
            }
        };

        const args1 = {
            text: "NYTCROSSWORDTODAY",
            help: "Import today's crossword from the New York Times",
            handler: (context) => {
                window.roamAlphaAPI.updateBlock(
                    { block: { uid: context.triggerUid, string: "Loading...".toString(), open: true } });
                fetchCrossword(context.triggerUid, true);
            }
        };

        if (window.roamjs?.extension?.smartblocks) {
            window.roamjs.extension.smartblocks.registerCommand(args);
        } else {
            document.body.addEventListener(
                `roamjs:smartblocks:loaded`,
                () =>
                    window.roamjs?.extension.smartblocks &&
                    window.roamjs.extension.smartblocks.registerCommand(args) &&
                    window.roamjs.extension.smartblocks.registerCommand(args1)
            );
        }

        // clean up any rogue localstorage entries associated with this extension
        Object.keys(localStorage)
            .filter(x =>
                x.startsWith('roam_research_nytcrossword_'))
            .forEach(x =>
                localStorage.removeItem(x));

        async function fetchCrossword(blockUid, today) {
            var cDate, cAuthor, cDay, cMonth, cYear, data, cols, rows;
            breakme: {
                if (today) { // get today's crossword from XWordInfo
                    var url = `https://frozen-forest-74426-64fa1018c64c.herokuapp.com/`;
                    const response = await fetch(url);
                    data = await response.json();
                    data = JSON.parse(data);
                } else { // get a random crossword from an archive on github
                    function randomDate(start, end) {
                        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
                    }
                    const d = randomDate(new Date(1979, 0, 1), new Date(2014, 12, 31));

                    var month = (d.getMonth() + 1).toString();
                    if (month < 10) {
                        month = "0" + month;
                    }
                    var day = d.getDate().toString();
                    if (day < 10) {
                        day = "0" + day;
                    }
                    var year = d.getFullYear().toString();

                    // source for NYT crossword definitions is https://github.com/doshea/nyt_crosswords
                    // no license specified on github

                    var url = `https://raw.githubusercontent.com/doshea/nyt_crosswords/master/${year}/${month}/${day}.json`;
                    const response = await fetch(url);
                    data = await response.json();
                }

                // Main crossword processing
                if (data.circles != null && data.circles.length > 0) {
                    await window.roamAlphaAPI.updateBlock({
                        "block": {
                            "uid": blockUid,
                            "string": "Sorry. Today's New York Times Crossword has special features (shaded squares) which means that it cannot be rendered."
                        }
                    });
                    break breakme;
                }
                // Check for double letter blocks in the grid
                let hasDoubleLetterBlock = data.grid.some(cell => cell.length > 1);
                if (hasDoubleLetterBlock) {
                    await window.roamAlphaAPI.updateBlock({
                        "block": {
                            "uid": blockUid,
                            "string": "Sorry. Today's New York Times Crossword contains double letter blocks which cannot be rendered."
                        }
                    });
                    break breakme;
                }

                cDate = data.date.toString();
                cAuthor = data.author.toString();
                cDate = cDate.split("/");
                cDay = cDate[1];
                cMonth = cDate[0];
                cYear = cDate[2];
                cols = data.size.cols;
                rows = data.size.rows;

                let crosswordDate = "";
                if (cMonth == 1) { crosswordDate += "January" }
                else if (cMonth == 2) { crosswordDate += "February" }
                else if (cMonth == 3) { crosswordDate += "March" }
                else if (cMonth == 4) { crosswordDate += "April" }
                else if (cMonth == 5) { crosswordDate += "May" }
                else if (cMonth == 6) { crosswordDate += "June" }
                else if (cMonth == 7) { crosswordDate += "July" }
                else if (cMonth == 8) { crosswordDate += "August" }
                else if (cMonth == 9) { crosswordDate += "September" }
                else if (cMonth == 10) { crosswordDate += "October" }
                else if (cMonth == 11) { crosswordDate += "November" }
                else if (cMonth == 12) { crosswordDate += "December" }

                if (cDay > 3 && cDay < 21) {
                    cDay += "th";
                } else if (cDay == 1 || cDay == 21 || cDay == 31) {
                    cDay += "st";
                } else if (cDay == 2 || cDay == 22) {
                    cDay += "nd";
                } else if (cDay == 3 || cDay == 23) {
                    cDay += "rd";
                } else {
                    cDay += "th";
                }
                crosswordDate += " " + cDay + ", " + cYear;

                // --- Helper functions ---

                function isAcrossStart(grid, rows, cols, r, c) {
                    const idx = r * cols + c;
                    if (grid[idx] === ".") return false;
                    // At left edge or after a black square, AND at least two white cells to the right
                    if ((c === 0 || grid[r * cols + (c - 1)] === ".") &&
                        (c + 1 < cols && grid[r * cols + (c + 1)] !== ".")) {
                        return true;
                    }
                    return false;
                }

                function isDownStart(grid, rows, cols, r, c) {
                    const idx = r * cols + c;
                    if (grid[idx] === ".") return false;
                    // At top edge or after a black square, AND at least two white cells downward
                    if ((r === 0 || grid[(r - 1) * cols + c] === ".") &&
                        (r + 1 < rows && grid[(r + 1) * cols + c] !== ".")) {
                        return true;
                    }
                    return false;
                }

                // Checks if answer fits at given across start
                function answerFitsAtAcross(grid, rows, cols, r, c, answer) {
                    let aIdx = 0, cc = c;
                    while (aIdx < answer.length && cc < cols) {
                        let cell = grid[r * cols + cc];
                        if (cell === ".") return false;
                        let cellLen = cell.length;
                        let ansSlice = answer.substr(aIdx, cellLen);
                        if (ansSlice.toUpperCase() !== cell.toUpperCase()) return false;
                        aIdx += cellLen;
                        cc++;
                    }
                    // Make sure we matched the entire answer (not too short or too long)
                    return aIdx === answer.length;
                }

                // Checks if answer fits at given down start
                function answerFitsAtDown(grid, rows, cols, r, c, answer) {
                    let aIdx = 0, rr = r;
                    while (aIdx < answer.length && rr < rows) {
                        let cell = grid[rr * cols + c];
                        if (cell === ".") return false;
                        let cellLen = cell.length;
                        let ansSlice = answer.substr(aIdx, cellLen);
                        if (ansSlice.toUpperCase() !== cell.toUpperCase()) return false;
                        aIdx += cellLen;
                        rr++;
                    }
                    return aIdx === answer.length;
                }

                // --- Main logic ---

                // Assume data, rows, cols, etc. are already defined
                let acrossClues = {};
                let downClues = {};
                let sourceObject = {};

                // Find all valid across and down starts
                let acrossStarts = [];
                let downStarts = [];
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        if (isAcrossStart(data.grid, rows, cols, r, c)) {
                            acrossStarts.push({ row: r, col: c });
                        }
                        if (isDownStart(data.grid, rows, cols, r, c)) {
                            downStarts.push({ row: r, col: c });
                        }
                    }
                }

                // --- Across clues ---
                for (let i = 0; i < data.clues.across.length; i++) {
                    let answer = data.answers.across[i];
                    let found = false;
                    let startRow = -1, startCol = -1;

                    for (let start of acrossStarts) {
                        if (answerFitsAtAcross(data.grid, rows, cols, start.row, start.col, answer)) {
                            startRow = start.row;
                            startCol = start.col;
                            found = true;
                            // Remove this start so it's not reused
                            acrossStarts = acrossStarts.filter(s => !(s.row === start.row && s.col === start.col));
                            break;
                        }
                    }

                    // Parse clue number and text
                    const regex = /([0-9]{1,3})\. (.+)/gm;
                    let m;
                    while ((m = regex.exec(data.clues.across[i])) !== null) {
                        let clueIndex = m[1];
                        let clue = m[2]
                            .replaceAll("&quot;", "'")
                            .replaceAll("&#39;", "'")
                            .replaceAll("<em>", "")
                            .replaceAll("</em>", "");
                        if (found) {
                            acrossClues[clueIndex] = { clue: clue, answer: answer, row: startRow, col: startCol };
                        }
                    }
                }
                sourceObject['across'] = acrossClues;

                // --- Down clues ---
                for (let i = 0; i < data.clues.down.length; i++) {
                    let answer = data.answers.down[i];
                    let found = false;
                    let startRow = -1, startCol = -1;

                    for (let start of downStarts) {
                        if (answerFitsAtDown(data.grid, rows, cols, start.row, start.col, answer)) {
                            startRow = start.row;
                            startCol = start.col;
                            found = true;
                            // Remove this start so it's not reused
                            downStarts = downStarts.filter(s => !(s.row === start.row && s.col === start.col));
                            break;
                        }
                    }

                    // Parse clue number and text
                    const regex = /([0-9]{1,3})\. (.+)/gm;
                    let m;
                    while ((m = regex.exec(data.clues.down[i])) !== null) {
                        let clueIndex = m[1];
                        let clue = m[2]
                            .replaceAll("&quot;", "'")
                            .replaceAll("&#39;", "'")
                            .replaceAll("<em>", "")
                            .replaceAll("</em>", "");
                        if (found) {
                            downClues[clueIndex] = { clue: clue, answer: answer, row: startRow, col: startCol };
                        }
                    }
                }
                sourceObject['down'] = downClues;

                // --- Output as JSON string if needed ---
                let sourceString = JSON.stringify(sourceObject);


                // setTimeout is needed because sometimes block is left blank
                setTimeout(async () => {
                    await window.roamAlphaAPI.updateBlock({ "block": { "uid": blockUid, "string": "**NYT Crossword**" } });
                    var authorString = "";
                    if (cAuthor.match(" and ")) {
                        authorString = "[[";
                        var cAuthors = cAuthor.split(" and ");
                        for (var i = 0; i < cAuthors.length - 1; i++) {
                            authorString += cAuthors[i] + "]] [["
                        }
                        authorString += cAuthors[cAuthors.length - 1] + "]]";
                    } else {
                        authorString = "[[" + cAuthor + "]]"
                    }
                    await createBlock({
                        node: {
                            text: "[[" + crosswordDate + "]] ~ " + authorString,
                            children: [
                                {
                                    text: "{{crossword}}",
                                    children: [
                                        {
                                            text: "Crossword Definition: #NYTCrosswordData^^" + sourceString + "^^",
                                        },
                                        {
                                            text: "Crossword Guesses: #NYTCrosswordData^^{\"guesses\":{}}^^",
                                        },
                                    ],
                                },
                            ],
                        },
                        parentUid: blockUid,
                    });
                    let blockData = window.roamAlphaAPI.data.pull("[:node/title :block/uid {:block/children ...}]", `[:block/uid \"${blockUid}\"]`);
                    await window.roamAlphaAPI.updateBlock({ "block": { "uid": blockData[":block/children"][0][":block/children"][0][":block/uid"], "open": false } });
                }, 200);

                document.querySelector("body")?.click();
            }
        };
    },
    onunload: () => {
        for (let index = 0; index < runners['observers'].length; index++) {
            const element = runners['observers'][index];
            element.disconnect()
        };
        if (window.roamjs?.extension?.smartblocks) {
            window.roamjs.extension.smartblocks.unregisterCommand("NYTCROSSWORD");
        };
        // clean up any rogue localstorage entries associated with this extension
        Object.keys(localStorage)
            .filter(x =>
                x.startsWith('roam_research_nytcrossword_'))
            .forEach(x =>
                localStorage.removeItem(x));
    }
}
