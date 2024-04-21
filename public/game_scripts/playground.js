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

// each tile 50px for now
// so it is 26x18
// ignore border actual playground is 24x16


const boardInit = 
[
    ["W1", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2"]
];

const codeToSpriteCoordDict = {
    "W1": [160, 288],
    "W2": [176, 288],
    "G1": [32, 208]
};

function initPlayground() {

    socket = Socket.getSocket();

    canvas = document.getElementById("main-playground");
    context = canvas.getContext("2d");
    context.imageSmoothingEnabled = false;

    spritesheet.src = "assets/sprite.png";
    spritesheet.decode()
        .then(() => {
            initPlaygroundCanvas();
        })
        .catch(() => {
            console.log("why is this logged everytime when it is not even error bruhhhhhh");
        });
}

function initPlaygroundCanvas() {

    // prints out the playground according to the above 2darray
    var x = 0, y = 0;
    for(const row of boardInit) {

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

    socket.emit("getInitPlayer");
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

        switch(event.key.toLowerCase()) {
            case "w": data = {x: 0, y: -1}; break;
            case "a": data = {x: -1, y: 0}; break;
            case "s": data = {x: 0, y: 1}; break;
            case "d": data = {x: 1, y: 0}; break;
        }

        socket.emit("move", JSON.stringify(data));
    }
    else if(enableBuffer){

        if(buffer == null) {
            buffer = {key: event.key};
            setTimeout(keyPressHandler, movementCooldown - (timeNow - lastTimeMoved), buffer);
        }
    }

}

function movePlayer(playerIndex, moveX, moveY) {

    console.log(playerIndex);

    const player = playerList[playerIndex];
    const lastTile = player.getPlayerGridPos();

    // cover up the previous position with the background (or else the player sprite will remain there)
    const currentCode = boardInit[lastTile[1] + 1][lastTile[0] + 1];
    const canvasCoord = localToCanvasCoord(lastTile);

    context.drawImage(spritesheet, 
        codeToSpriteCoordDict[currentCode][0], codeToSpriteCoordDict[currentCode][1],
        spriteSize[0], spriteSize[1],
        canvasCoord[0], canvasCoord[1],
        finalSize[0], finalSize[1]);

    // player class will handle all other stuff (orientation of sprite, validation)
    player.movePlayer(moveX, moveY);
}

function localToCanvasCoord(localCoord) {
    return [localCoord[0] * 50 + 50, localCoord[1] * 50 + 50];
}