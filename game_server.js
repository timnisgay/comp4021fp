const express = require("express");

const bcrypt = require("bcrypt");
const fs = require("fs");
const session = require("express-session");

// Create the Express app
const app = express();

// Use the 'public' folder to serve static files
app.use(express.static("public"));

// Use the json middleware to parse JSON data
app.use(express.json());

// Use the session middleware to maintain sessions
const gameSession = session({
    secret: "game",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { maxAge: 300000 }
});
app.use(gameSession);

// This helper function checks whether the text only contains word characters
function containWordCharsOnly(text) {
    return /^\w+$/.test(text);
}

// Handle the /register endpoint
app.post("/register", (req, res) => {
    const { username, password } = req.body;

    const users = JSON.parse(fs.readFileSync("data/users.json"));

    if (!username || !password) {
        res.json({status: "error", error: "username /password is empty!"});
        return;
    }
    if (!containWordCharsOnly(username)) {
        res.json({status: "error", error: "username can only contain underscore, letters or numbers."});
        return;
    }
    if (username in users) {
        res.json({status: "error", error: "username has already been used."});
        return;
    }

    const hash = bcrypt.hashSync(password, 10);
    users[username] = { password: hash };

    fs.writeFileSync("data/users.json", JSON.stringify(users, null, " "));

    res.json({status: "success"});
});

// Handle the /signin endpoint
app.post("/signin", (req, res) => {
    const { username, password } = req.body;

    const users = JSON.parse(fs.readFileSync("data/users.json"));

    if (username in users) {
        if (!bcrypt.compareSync(password, users[username].password)) {
            res.json({status: "error", error: "username /password incorrect!"});
            return;
        }
    } else {
        res.json({status: "error", error: "username /password incorrect!"});
        return;
    }

    req.session.user = {username};
    res.json({status: "success", user: {username}});
});

// Handle the /validate endpoint
app.get("/validate", (req, res) => {
    if (!req.session.user) {
        res.json({status: "error", error: "You have not signed in."});
        return;
    }

    res.json({ status: "success", user: req.session.user });
});

// Handle the /signout endpoint
app.get("/signout", (req, res) => {

    // Deleting req.session.user
    delete req.session.user;

    // Sending a success response
    res.json({ status: "success" });
});


const { createServer } = require("http");
const { Server } = require("socket.io");
const httpServer = createServer(app);
const io = new Server(httpServer);

io.use((socket, next) => {
    gameSession(socket.request, {}, next);
});

const onlineUsers = {};

// technically i should create a player class to store all these highly repetitive info, but if it works, dont touch it
const players = [-1, -1, -1, -1];
const playerCoords = [[1, 1], [24, 1], [1, 16], [24, 16]];
// 3 variables: direction, sequence number, alive status
const playerCondition = [[2, 0, false], [2, 0, false], [2, 0, false], [2, 0, false]];
const playerSockets = [-1, -1, -1, -1];
// 4 indexes again, each means the following: ice trap unlocked, bomb power, bomb limit, current placed bombs
const playerBombInfo = [[false, 1, 1, 0], [false, 1, 1, 0], [false, 1, 1, 0], [false, 1, 1, 0]];

// exist to get what was supposed to replace the player/object after it moved/vanished
const boardInit = 
[
    ["W1", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W1", "G1", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W2", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "G1", "G1", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W1", "G1", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "G1", "W1", "G1", "W1", "G1", "W1", "G1", "W1", "G1", "W2", "W2", "G1", "W1", "G1", "W1", "G1", "W1", "G1", "W1", "G1", "W1", "G1", "W1", "W1"],
    ["W1", "G1", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "G1", "G1", "W1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "G1", "G1", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2"]
];
// the actual board state, modify this one for game related actions
const boardCurrent = 
[
    ["W1", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W1", "G1", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W2", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "G1", "G1", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W1", "G1", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "G1", "W1", "G1", "W1", "G1", "W1", "G1", "W1", "G1", "W2", "W2", "G1", "W1", "G1", "W1", "G1", "W1", "G1", "W1", "G1", "W1", "G1", "W1", "W1"],
    ["W1", "G1", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "G1", "G1", "W1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "G1", "G1", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W2", "G1", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2"]
];


io.on("connection", (socket) => {

    if (socket.request.session.user) {

        const {username} = socket.request.session.user;
        onlineUsers[username] = {username};
        // io.emit("add user", JSON.stringify(socket.request.session.user));

        console.log(onlineUsers);

        socket.on("disconnect", () => {
            if(players.includes(username)) {
                if(removePlayer(username) != -1) {
                    if(getPlayerID(username) != -1) {
                        playerSockets[getPlayerID(username)] = -1;
                        playerCondition[getPlayerID(username)][2] = false;
                        console.log(username, "is removed from players, current players: ", players);
                        io.emit("players", JSON.stringify(players));
                    }
                }
            }
            
            delete onlineUsers[username];
            //io.emit("remove user", JSON.stringify(socket.request.session.user));
        });

        //actually we dont need to get users
        // socket.on("get users", () => {
        //     socket.emit("users", JSON.stringify(onlineUsers));
        // });

        //socket get the current players including -1
        socket.on("get players", () => {
            console.log("current players: ", players);
            socket.emit("players", JSON.stringify(players));
        });

        //socket joins the game
        socket.on("join game", () => {
            if (!players.includes(username) && getPlayerLength() < 4) {
                const playerID = addPlayer(username)
                if(playerID != -1) {

                    const len = getPlayerLength();

                    console.log(len);
                    console.log("current players: ", players);

                    // store the player socket
                    playerSockets[playerID] = socket;
                    // set the player to be alive
                    playerCondition[playerID][2] = true;
                    broadcastPrintPlayground();

                    if (len === 4) {
                        io.emit("start game");
                    } else {
                        io.emit("players", JSON.stringify(players));
                    }
                }  
            }
        });

        socket.on("end game", (data) => {
            //TODO: this player is dead, broadcast this to others

            // save the game data of this player to scoreboard.json?

            // check, if all player is dead, stop the game
            io.emit("end game", name);
        });

        // player tells server its gonna move
        // server add in the indicator of which player it is 
        // the final json broadcasted to all players for them to display themselves
        // no validation done on server side, so a player can send a move request 300 times per second
        // and all of them would be considered valid
        // who needs anti cheat when theres literally a cheat button anyway
        socket.on("move", (data) => {
            newData = JSON.parse(data);
            playerMove(getPlayerID(username), newData["x"], newData["y"]);
        });

        // player attempts to place down a bomb
        socket.on("bomb", (data) => {
            newData = JSON.parse(data);
            playerPlaceBomb(getPlayerID(username),newData["bombType"]);
        });
    }
});

// Use a web server to listen at port 8000
httpServer.listen(8000, () => {
    console.log("The game server has started...");
});

// custom add player logic, returns -1 if cannot add
function addPlayer(username) {
    const index = getFirstAvailableIndex();
    if(index == -1) return -1;

    players[index] = username;
    return index;
}

// returns first player slot that is empty, -1 if there are none
function getFirstAvailableIndex() {
    for(var i = 0; i < 4; ++i) {
        if(players[i] == -1) return i;
    }
    return -1;
}

// returns the removed player index, -1 if username is not a player
function removePlayer(username) {
    const index = players.indexOf(username);
    if(index == -1) return -1;

    players[index] = -1;
    return index;
}

// returns the length of user, needs to be implemented in this way because -1 means no player
function getPlayerLength() {
    var playerCount = 0;
    for(var i = 0; i < 4; ++i) {
        if(players[i] != -1) ++playerCount;
    }

    return playerCount;
}

// returns player list that only contains non -1 value
/*function getPlayerList() {
    var playerlist = [];
    for(var i = 0; i < 4; ++i) {
        if(players[i] != -1) playerlist = [...playerlist, players[i]];
    }
    return playerlist;
}*/

function getPlayerID(username) {
    return players.indexOf(username);
}

function removePlayerOnBoard(playerID) {

}

// tells all client to print the server side map
function broadcastPrintPlayground() {

    checkDeath();

    var coordSprite = [];

    for(var i = 0; i < 4; ++i) {
        if (players[i] != -1 && playerCondition[i][2]) {
            const psc = playerCondition[i];
            const pc = playerCoords[i];
            coordSprite = [...coordSprite, ["P" + i + psc[0] + psc[1], [pc[0], pc[1]]]];
        }
    }

    let data = {base: boardInit, overlay: boardCurrent, playerSprite: coordSprite};
    let jsonData = JSON.stringify(data);

    for(const playerSocket of playerSockets) {
        if (playerSocket != -1) {
            playerSocket.emit("print playground", jsonData);
        }
    }
}

// bear witness, the epitome of garbage coding
function playerMove(playerID, movex, movey) {
    const playableAreaX = 25;
    const playableAreaY = 17;

    const playerOldCoord = playerCoords[playerID];
    const spriteCondition = playerCondition[playerID];

    // clamp the final coord back within the playable area
    var newX = Math.min(Math.max(playerOldCoord[0] + movex, 1), playableAreaX - 1);
    var newY = Math.min(Math.max(playerOldCoord[1] + movey, 1), playableAreaY - 1);

    // collision check, prevent the player from moving if the destination is obstructing
    // extremely bad hack here, assuming all blocks with a code that starts with "B" means bomb, which are impassable
    const targetBlock = boardInit[newY][newX];
    if(targetBlock == "W1" || targetBlock == "W2" || boardCurrent[newY][newX][0] == "B") {
        newX = playerOldCoord[0];
        newY = playerOldCoord[1];
    }

    // determine where the player is facing after the move
    // it basically explodes if somehow the player is moving diagonally (could it be someone cheating with console :thonk:)
    // when i said explode, it is more like giving back the wrong direction, nothing is exploding today
    var moveDirection;

    if(movex > 0) moveDirection = 3;
    else if(movex < 0) moveDirection = 1;
    else if(movey > 0) moveDirection = 2;
    else moveDirection = 0;

    if(spriteCondition[0] == moveDirection) {
        // w or s, only 3 sprites
        if(moveDirection == 0 || moveDirection == 2) {
            spriteCondition[1]++;
            spriteCondition[1] = spriteCondition[1] % 3;
        }
        // a or d, have 4 sprites
        else if (moveDirection == 1 || moveDirection == 3) {
            spriteCondition[1]++;
            spriteCondition[1] = spriteCondition[1] % 4;
        }
    }
    else {
        spriteCondition[0] = moveDirection;
        spriteCondition[1] = 0;
    }

    playerCoords[playerID] = [newX, newY];
    playerCondition[playerID] = spriteCondition;

    broadcastPrintPlayground();
}

function playerPlaceBomb(playerID, bombType) {

    const bombInfo = playerBombInfo[playerID];
    const bombCoord = playerCoords[playerID];

    // if it is ice trap, check whether the player has unlocked it first
    if(bombType == "ice" && bombInfo[0]) {
        // havnt implement ice trap lol
    }else if (bombType == "normal") {
        // bomb limit havnt been reached yet, and the tile doesnt already have a bomb
        if(bombInfo[2] >= bombInfo[3] + 1 && boardCurrent[bombCoord[1]][bombCoord[0]][0] != "B") {
            bombInfo[3]++;
            bombCountDownTimer(playerID, bombCoord, 0);
        }
    }else {
        console.log("illegal bomb type was being placed by client!");
        console.log(bombType);
        return;
    }
}

function bombCountDownTimer(playerID, bombCoord, countdownStage) {
    if(countdownStage < 7) {
        // time to boom
        if(countdownStage == 6) {
            playerBombInfo[playerID][3]--;
            spawnExplosionTimer(bombCoord, playerBombInfo[playerID][1]);
        }else {
            boardCurrent[bombCoord[1]][bombCoord[0]] = "B" + countdownStage;

            // -------------------------------look at me pls-------------------------------
            // the second number is the ms needed to advance one frame for the bomb,
            // there are 6 frames before it explode
            // i wrote this comment to remind the future me, saving my hairline
            // -------------------------------look at me pls-------------------------------

            setTimeout(bombCountDownTimer, 500, playerID, bombCoord, ++countdownStage);
            broadcastPrintPlayground();

        }
    }
    else {
        console.log("the bomb should have exploded lol");
    }
}


function spawnExplosionTimer(bombCoord, bombPower) {

    boardCurrent[bombCoord[1]][bombCoord[0]] = "EC"

    // 4 directions, so 4 loops
    for(var i = 0; i < 4; ++i) {
        for(var j = 1; j <= bombPower; ++j) {

            var targetCoord;

            switch(i) {
                // upward explosion
                case 0: targetCoord = [bombCoord[1] - j, bombCoord[0]]; break;
                // leftward explosion
                case 1: targetCoord = [bombCoord[1], bombCoord[0] - j]; break;
                // downward explosion
                case 2: targetCoord = [bombCoord[1] + j, bombCoord[0]]; break;
                // rightward explosion
                case 3: targetCoord = [bombCoord[1], bombCoord[0] + j]; break;
            }

            // ignore the inconsistency of switching x and y sometimes but not others
            const targetBlock = boardCurrent[targetCoord[0]][targetCoord[1]];

            // stops the explosion if it is wall/bomb
            if(targetBlock == "W1" || targetBlock == "W2" || targetBlock[0] == "B" || targetBlock[0] == "E") break;

            // check if the explosion has reached maximum length, if yes use different set of sprite
            const endOfExplosion = (j == bombPower);

            // "EW" - E = Explosion, W = up (wasd)
            // "EV" and "EH", Vertical and Horizontal, since they share the same sprite
            switch(i) {
                case 0: boardCurrent[targetCoord[0]][targetCoord[1]] = endOfExplosion ? "EW" : "EV"; break;
                case 1: boardCurrent[targetCoord[0]][targetCoord[1]] = endOfExplosion ? "EA" : "EH"; break;
                case 2: boardCurrent[targetCoord[0]][targetCoord[1]] = endOfExplosion ? "ES" : "EV"; break;
                case 3: boardCurrent[targetCoord[0]][targetCoord[1]] = endOfExplosion ? "ED" : "EH"; break;
            }
        }
    }
    
    setTimeout(removeExplosion, 2000, bombCoord, bombPower);
    broadcastPrintPlayground();
}

function removeExplosion(bombCoord, bombPower) {

    // remove center of explosion
    if(boardCurrent[bombCoord[1]][bombCoord[0]][0] == "E") boardCurrent[bombCoord[1]][bombCoord[0]] = boardInit[bombCoord[1]][bombCoord[0]];

    for(var i = 0; i < 4; ++i) {
        for(var j = 1; j <= bombPower; ++j) {

            var targetCoord;

            switch(i) {
                case 0: targetCoord = [bombCoord[1] - j, bombCoord[0]]; break;
                case 1: targetCoord = [bombCoord[1], bombCoord[0] - j]; break;
                case 2: targetCoord = [bombCoord[1] + j, bombCoord[0]]; break;
                case 3: targetCoord = [bombCoord[1], bombCoord[0] + j]; break;
            }

            const targetBlock = boardCurrent[targetCoord[0]][targetCoord[1]];

            if(targetBlock[0] == "E") {
                boardCurrent[targetCoord[0]][targetCoord[1]] = boardInit[targetCoord[0]][targetCoord[1]];
            }
            else break;
        }
    }

    broadcastPrintPlayground();
}

function checkDeath() {

    for(var i = 0; i < 4; ++i){
        if(players[i] != -1 && playerCondition[i][2]) {
            const playerCoord = playerCoords[i];

            // The player is in explosion
            if(boardCurrent[playerCoord[1]][playerCoord[0]][0] == "E") {
                playerCondition[i][2] = false;
            }
        }
    }

}