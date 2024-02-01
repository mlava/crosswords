import Crossword from '@jaredreisinger/react-crossword';

export default {
    onload: ({ extensionAPI }) => {
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
                }
                fetchCrossword().then(async (blocks) => {
                    await window.roamAlphaAPI.updateBlock(
                        { block: { uid: uid, string: blocks[0].text.toString(), open: true } });
                    for (var i = 0; i < blocks[0].children.length; i++) {
                        var thisBlock = window.roamAlphaAPI.util.generateUID();
                        await window.roamAlphaAPI.createBlock({
                            location: { "parent-uid": uid, order: i + 1 },
                            block: { string: blocks[0].children[i].text.toString(), uid: thisBlock }
                        });
                    }
                });
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

        async function fetchCrossword() {
            function randomDate(start, end) {
                return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
            }
            const d = randomDate(new Date(1979, 0, 1), new Date(2014, 12, 31));
            
            var month = (d.getMonth() + 1).toString();
            if (month < 10) {
                month = "0"+month;
            }
            var day = d.getDate().toString();
            if (day < 10) {
                day = "0"+day;
            }
            var year = d.getFullYear().toString();

            var url = `https://raw.githubusercontent.com/doshea/nyt_crosswords/master/${year}/${month}/${day}.json`;
            const response = await fetch(url);
            const data = await response.json();
            console.info(data);
            let answersGridAcross = data.grid.join('');
            let answersGridDown = "";
            for (var m = 0; m < data.grid.length; m++) {
                let n = Math.floor(m/data.size.rows) + (data.size.rows * (m % data.size.rows));
                answersGridDown += data.grid[n];
            }
            let size = data.size.cols;
            
            let sourceData = "{across: ";
            for (var i = 0; i< data.clues.across.length; i++) {
                var row = 0, col = 0;
                let index = answersGridAcross.indexOf(data.answers.across[i]) + 1;
                for (var k = 1; k < size + 1; k++) {
                    if (index < ((size * k) + 1) && row == 0 && col == 0) {
                        row = k;
                        if (k == 1) {
                            col = index;
                        } else {
                            col = index - (size * (k-1));
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

            sourceData += "{down: ";
            for (var i = 0; i< data.clues.down.length; i++) {
                var row = 0, col = 0;
                let index = answersGridDown.indexOf(data.answers.down[i]) + 1;
                
                for (var k = 1; k < size + 1; k++) {
                    if (index < ((size * k) + 1) && row == 0 && col == 0) {
                        col = k;
                        if (k == 1) {
                            row = index;
                        } else {
                            row = index - (size * (k-1));
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
            
            sourceData += "}";
            console.info(sourceData);
            return <Crossword data={sourceData} />;
        };
    },
    onunload: () => {
        if (window.roamjs?.extension?.smartblocks) {
            window.roamjs.extension.smartblocks.unregisterCommand("NYTCROSSWORD");
        }
    }
}