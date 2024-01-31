const config = {
    tabTitle: "NYT Crosswords",
    settings: [
        {
            id: "theme",
            name: "Theme",
            description: "Your preferred colour theme",
            action: { type: "select", items: ["default", "blue", "blue2", "blue3", "blue-marble", "canvas", "wood", "wood2", "wood3", "wood4", "maple", "maple2", "brown", "leather", "green", "marble", "green-plastic", "grey", "metal", "olive", "newspaper", "purple", "purple-diag", "pink", "ic", "horsey"] },
        },
        {
            id: "background",
            name: "Background",
            description: "Your preferred background colour",
            action: { type: "select", items: ["default", "light", "dark", "system"] },
        },
        {
            id: "pieceset",
            name: "Piece Set",
            description: "Your preferred piece set",
            action: { type: "select", items: ["default", "cburnett", "merida", "alpha", "pirouetti", "chessnut", "chess7", "reillycraig", "companion", "riohacha", "kosal", "leipzig", "fantasy", "spatial", "celtic", "california", "caliente", "pixel", "maestro", "fresca", "cardinal", "gioco", "tatiana", "staunty", "governor", "dubrovny", "icpieces", "mpchess", "kiwen-suwi", "horsey", "anarcandy", "shapes", "letter", "disguised"] },
        },
    ]
};

export default {
    onload: ({ extensionAPI }) => {
        extensionAPI.settings.panel.create(config);

        extensionAPI.ui.commandPalette.addCommand({
            label: "Daily Chess Puzzle from Lichess",
            callback: () => {
                const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
                if (uid == undefined) {
                    alert("Please focus a block before importing a puzzle");
                    return;
                } else {
                    window.roamAlphaAPI.updateBlock(
                        { block: { uid: uid, string: "Loading...".toString(), open: true } });
                }
                fetchChessPuzzle().then(async (blocks) => {
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
            text: "CHESSPUZZLE",
            help: "Import the daily chess puzzle from Lichess",
            handler: (context) => fetchChessPuzzle,
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

        async function fetchChessPuzzle() {
            var theme, bg, pS;
            var titleString = "**Lichess Puzzle of the Day:**"
            var url = "https://lichess.org/training/frame?theme=";
            if (extensionAPI.settings.get("theme")) {
                theme = extensionAPI.settings.get("theme");
            } else {
                theme = "brown";
            }
            url += theme + "&bg=";
            if (extensionAPI.settings.get("background")) {
                bg = extensionAPI.settings.get("background");
            } else {
                bg = "dark";
            }
            url += bg;
            if (extensionAPI.settings.get("pieceset")) {
                pS = extensionAPI.settings.get("pieceset");
                url += "&pieceSet=" + pS;
            }

            const response = await fetch("https://lichess.org/api/puzzle/daily");
            const data = await response.json();
            var hint = data.puzzle.solution[0];
            hint = hint.slice(0, 2);

            return [
                {
                    text: titleString,
                    children: [
                        { text: "{{iframe: " + url + "}} #lichess" },
                        { text: "Focus for Hint: #lichess-hint^^    Move piece at " + hint + "    ^^" },
                    ]
                },
            ];
        };
    },
    onunload: () => {
        if (window.roamjs?.extension?.smartblocks) {
            window.roamjs.extension.smartblocks.unregisterCommand("CHESSPUZZLE");
        }
    }
}

async function fetchChessPuzzle() {
    return [
        {
            text: "{{iframe: https://lichess.org/training/frame?theme=blue&bg=light}} #lichess",
        },
    ];
};