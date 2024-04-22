var canvas;
var context;

// sets the original size and final size of the sprite on playground
const spriteSize = [16, 16];
const finalSize = [50, 50];

const spritesheet = new Image();
// this refers to the player him/herself
// everything will be server side, so technically the player dont even need to know who is he/she
var myPlayer;

// how long must the player wait before they could move one tile;
const movementCooldown = 150;
var lastTimeMoved = 0;
var buffer;

// toggles if buffer mechanic will be allowed, it might make the game feel sluggish sometime
const enableBuffer = true;
var socket;


// dont question me pls, im on the verge of shooting myself in the foot when im writing this
const codeToSpriteCoordDict = {
    "W1": [160, 288], "W2": [176, 288], "G1": [32, 208],
    "P020": [0, 224], "P021": [16, 224], "P022": [32, 224], "P030": [48, 224], "P031": [64, 224], "P032": [80, 224], "P033": [96, 224],
    "P000": [112, 224], "P001": [128, 224], "P002": [144, 224], "P010": [160, 224], "P011": [176, 224], "P012": [192, 224], "P013": [208, 224], 
    "P120": [0, 240], "P121": [16, 240], "P122": [32, 240], "P130": [48, 240], "P131": [64, 240], "P132": [80, 240], "P133": [96, 240],
    "P100": [112, 240], "P101": [128, 240], "P102": [144, 240], "P110": [160, 240], "P111": [176, 240], "P112": [192, 240], "P113": [208, 240],
    "P220": [0, 256], "P221": [16, 256], "P222": [32, 256], "P230": [48, 256], "P231": [64, 256], "P232": [80, 256], "P233": [96, 256],
    "P200": [112, 256], "P201": [128, 256], "P202": [144, 256], "P210": [160, 256], "P211": [176, 256], "P212": [192, 256], "P213": [208, 256],
    "P320": [0, 272], "P321": [16, 272], "P322": [32, 272], "P330": [48, 272], "P331": [64, 272], "P332": [80, 272], "P333": [96, 272],
    "P300": [112, 272], "P301": [128, 272], "P302": [144, 272], "P310": [160, 272], "P311": [176, 272], "P312": [192, 272], "P313": [208, 272]
};

function initPlayground() {

    socket = Socket.getSocket();

    canvas = document.getElementById("main-playground");
    context = canvas.getContext("2d");
    context.imageSmoothingEnabled = false;

    spritesheet.src = "assets/sprite.png";
    spritesheet.decode()
        .then(() => {
            Socket.joinGame();
        })
        .catch(() => {
            console.log("error, sprite.png doesn't exist or the path is wrong");
        });
}

// get info like where to spawn, what sprite to use from the server
function initPlayer(coord, playerID) {
    myPlayer = Player(context, coord, playerID, "xd");
}

function keyPressHandler(event) {

    const timeNow = performance.now();

    if(timeNow - lastTimeMoved >= movementCooldown) {

        lastTimeMoved = timeNow;
        buffer = null;
        var data;
        const keyInputted = event.key.toLowerCase();
        const keyToMovementMap = {
            "w" : {x: 0, y: -1},
            "a" : {x: -1, y: 0},
            "s" : {x: 0, y: 1},
            "d" : {x: 1, y: 0}
        }

        if(keyToMovementMap[keyInputted] != undefined) {
            data = keyToMovementMap[keyInputted];
            socket.emit("move", JSON.stringify(data));
        }
    }
    else if(enableBuffer){

        if(buffer == null) {
            buffer = {key: event.key};
            setTimeout(keyPressHandler, movementCooldown - (timeNow - lastTimeMoved), buffer);
        }
    }

}

function localToCanvasCoord(localCoord) {
    return [localCoord[0] * 50 + 50, localCoord[1] * 50 + 50];
}

function printPlayground(boardstate) {

    function printLayer(layer) {
        var x = 0, y = 0;
        for(const row of layer) {

            for(const code of row) {
                context.drawImage(spritesheet, 
                    codeToSpriteCoordDict[code][0], codeToSpriteCoordDict[code][1],
                    spriteSize[0], spriteSize[1],
                    x, y,
                    finalSize[0], finalSize[1]);

                x += finalSize[0];
            }

            x = 0; 
            y += finalSize[1];
        }
    }

    printLayer(boardstate["base"]);
    printLayer(boardstate["overlay"]);
}