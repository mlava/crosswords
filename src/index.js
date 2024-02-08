import { renderCrossword } from "./crosswordComponent";
import createButtonObserver from "roamjs-components/dom/createButtonObserver";

var runners = {
    observers: [],
}

export default {
    onload: ({ extensionAPI }) => {
        const onloadArgs = {extensionAPI};
        const crosswordObserver = createButtonObserver({
            attribute: 'crossword-block',
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
            handler: (context) => fetchCrossword,
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

            let answersGridAcross = data.grid.join('');
            let answersGridDown = "";
            for (var m = 0; m < data.grid.length; m++) {
                let n = Math.floor(m / data.size.rows) + (data.size.rows * (m % data.size.rows));
                answersGridDown += data.grid[n];
            }
            let size = data.size.cols;

            let sourceData = "{across: {";
            for (var i = 0; i < data.clues.across.length; i++) {
                var row = 0, col = 0;
                let index = answersGridAcross.indexOf(data.answers.across[i]) + 1;
                for (var k = 1; k < size + 1; k++) {
                    if (index < ((size * k) + 1) && row == 0 && col == 0) {
                        row = k;
                        if (k == 1) {
                            col = index;
                        } else {
                            col = index - (size * (k - 1));
                        }
                    }
                }

                const regex = /([0-9]{1,2}). (.+)/gm;
                let m;
                while ((m = regex.exec(data.clues.across[i])) !== null) {
                    if (m.index === regex.lastIndex) {
                        regex.lastIndex++;
                    }
                    m.forEach((match, groupIndex) => {
                        if (groupIndex == 1) {
                            sourceData += `${match}: {clue: "`;
                        } else if (groupIndex == 2) {
                            const regex = /([\"\'])/gm;
                            const subst = `\\$1`;
                            var clue = match.replace(regex, subst);
                            sourceData += `${clue}", answer: "${data.answers.across[i]}", row: ${row}, col: ${col},},`;
                        }
                    });
                }
            }
            sourceData += "}, ";

            sourceData += "down: {";
            for (var i = 0; i < data.clues.down.length; i++) {
                var row = 0, col = 0;
                let index = answersGridDown.indexOf(data.answers.down[i]) + 1;

                for (var k = 1; k < size + 1; k++) {
                    if (index < ((size * k) + 1) && row == 0 && col == 0) {
                        col = k;
                        if (k == 1) {
                            row = index;
                        } else {
                            row = index - (size * (k - 1));
                        }
                    }
                }

                const regex = /([0-9]{1,2}). (.+)/gm;
                let m;
                while ((m = regex.exec(data.clues.down[i])) !== null) {
                    if (m.index === regex.lastIndex) {
                        regex.lastIndex++;
                    }
                    m.forEach((match, groupIndex) => {
                        if (groupIndex == 1) {
                            sourceData += `${match}: {clue: "`;
                        } else if (groupIndex == 2) {
                            const regex = /([\"\'])/gm;
                            const subst = `\\$1`;
                            var clue = match.replace(regex, subst);
                            sourceData += `${clue}", answer: "${data.answers.down[i]}", row: ${row}, col: ${col},},`;
                        }
                    });
                }
            }

            sourceData += "}}";
            window.crosswordData = sourceData;
            console.info(window.crosswordData);

            // setTimeout is needed because sometimes block is left blank
            setTimeout(async () => {
                await window.roamAlphaAPI.updateBlock({ "block": { "uid": blockUid, "string": "{{crossword}}" } });
            }, 200);

            /*
            await window.roamAlphaAPI.createBlock({
                node: {
                    text: "scratch",
                    children: [
                        {
                            text: "custom",
                        },
                        {
                            text: "selections",
                        },
                        {
                            text: "conditions",
                            children: [
                                {
                                    text: "clause",
                                    children: [
                                        {
                                            text: "source",
                                            children: [{ text: "node" }],
                                        },
                                        {
                                            text: "relation",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                parentUid: blockUid,
            });
            */
            
            document.querySelector("body")?.click();

            /*
            // TODO replace with document.body.dispatchEvent(new CustomEvent)
            setTimeout(() => {
                const el = document.querySelector(`.roam-block[id*="${uid}"]`);
                const conditionEl = el?.querySelector(
                    ".roamjs-query-condition-relation"
                );
                const conditionInput = conditionEl?.querySelector(
                    "input"
                );
                conditionInput?.focus();
            }, 200);
            */
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
