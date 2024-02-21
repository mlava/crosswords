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
                    fetchCrossword(uid);
                }
            }
        });

        const args = {
            text: "NYTCROSSWORD",
            help: "Import a random crossword from the New York Times",
            handler: (context) => {
                window.roamAlphaAPI.updateBlock(
                    { block: { uid: context.triggerUid, string: "Loading...".toString(), open: true } });
                fetchCrossword(context.triggerUid);
            }
        };

        if (window.roamjs?.extension?.smartblocks) {
            window.roamjs.extension.smartblocks.registerCommand(args);
        } else {
            document.body.addEventListener(
                `roamjs:smartblocks:loaded`,
                () =>
                    window.roamjs?.extension.smartblocks &&
                    window.roamjs.extension.smartblocks.registerCommand(args)
            );
        }

        async function fetchCrossword(blockUid) {
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
            const data = await response.json();

            let cDate = data.date.toString();
            let cAuthor = data.author.toString();
            cDate = cDate.split("/");
            let cDay = cDate[1];
            let cMonth = cDate[0];
            let cYear = cDate[2];

            let crosswordDate = "";
            if (cMonth == 1) {
                crosswordDate += "January"
            } else if (cMonth == 2) {
                crosswordDate += "February"
            } else if (cMonth == 3) {
                crosswordDate += "March"
            } else if (cMonth == 4) {
                crosswordDate += "April"
            } else if (cMonth == 5) {
                crosswordDate += "May"
            } else if (cMonth == 6) {
                crosswordDate += "June"
            } else if (cMonth == 7) {
                crosswordDate += "July"
            } else if (cMonth == 8) {
                crosswordDate += "August"
            } else if (cMonth == 9) {
                crosswordDate += "September"
            } else if (cMonth == 10) {
                crosswordDate += "October"
            } else if (cMonth == 11) {
                crosswordDate += "November"
            } else if (cMonth == 12) {
                crosswordDate += "December"
            }
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

            let answersGridAcross = data.grid.join('');
            let answersGridDown = "";
            for (var m = 0; m < data.grid.length; m++) {
                let n = Math.floor(m / data.size.rows) + (data.size.rows * (m % data.size.rows));
                answersGridDown += data.grid[n];
            }
            let size = data.size.cols;

            let sourceObject = {};
            let acrossClues = {};
            let lastRow = 0;
            for (var i = 0; i < data.clues.across.length; i++) {
                var row = 0, col = 0;
                var testAnswersGridAcross, index;
                var testAnswer = data.answers.across[i];

                await getIndex();
                async function getIndex(start) {
                    if (start == null) {
                        index = answersGridAcross.indexOf(testAnswer);
                    } else {
                        testAnswersGridAcross = answersGridAcross.substring(start + 1);
                        index = testAnswersGridAcross.indexOf(testAnswer) + start + 1;
                    }

                    if (Math.floor(index/size) < lastRow) { // this can't be right, so there must be another answer match
                        await getIndex(index);
                    } else {
                        row = Math.floor(index/size);
                        col = index % size;
                        lastRow = row;
                    }
                }

                const regex = /([0-9]{1,3}). (.+)/gm;
                let m;
                while ((m = regex.exec(data.clues.across[i])) !== null) {
                    var clueIndex, clue, answer;
                    if (m.index === regex.lastIndex) {
                        regex.lastIndex++;
                    }
                    m.forEach((match, groupIndex) => {
                        if (groupIndex == 1) {
                            clueIndex = match;
                        } else if (groupIndex == 2) {
                            const regex = /([\"\'])/gm;
                            const subst = `\$1`;
                            clue = match.replace(regex, subst);
                            answer = data.answers.across[i];
                        }
                    });
                    acrossClues[clueIndex] = { clue: clue, answer: answer, row: row, col: col, };
                }
            }
            sourceObject['across'] = acrossClues;

            let downClues = {};
            let lastCol = 0;
            for (var i = 0; i < data.clues.down.length; i++) {
                var row = 0, col = 0;
                var testAnswersGridDown, index;
                var testAnswer = data.answers.down[i];

                await getIndex();
                async function getIndex(start) {
                    if (start == null) {
                        index = answersGridDown.indexOf(testAnswer);
                    } else {
                        testAnswersGridDown = answersGridDown.substring(start + 1);
                        index = testAnswersGridDown.indexOf(testAnswer) + start + 1;
                    }

                    col = Math.floor(index/size);
                    row = index % size;
                    lastCol = col;
                }

                const regex = /([0-9]{1,3}). (.+)/gm;
                let m;
                while ((m = regex.exec(data.clues.down[i])) !== null) {
                    var clueIndex, clue, answer;
                    if (m.index === regex.lastIndex) {
                        regex.lastIndex++;
                    }
                    m.forEach((match, groupIndex) => {
                        if (groupIndex == 1) {
                            clueIndex = match;
                        } else if (groupIndex == 2) {
                            const regex = /([\"\'])/gm;
                            const subst = `\$1`;
                            clue = match.replace(regex, subst);
                            answer = data.answers.down[i];
                        }
                    });
                    downClues[clueIndex] = { clue: clue, answer: answer, row: row, col: col, };
                }
            }

            sourceObject['down'] = downClues;
            let sourceString = JSON.stringify(sourceObject);

            // setTimeout is needed because sometimes block is left blank
            setTimeout(async () => {
                await window.roamAlphaAPI.updateBlock({ "block": { "uid": blockUid, "string": "NYT Crossword" } });
                await createBlock({
                    node: {
                        text: "[[" + crosswordDate + "]] ~ [[" + cAuthor + "]]",
                        children: [
                            {
                                text: "{{crossword}}",
                            },
                            {
                                text: "Crossword Definition: #NYTCrosswordData^^" + sourceString + "^^",
                            },
                            {
                                text: "Crossword Guesses: ",
                            },
                        ],
                    },
                    parentUid: blockUid,
                });
            }, 200);

            document.querySelector("body")?.click();
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
    }
}
