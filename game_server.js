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
const players = [-1, -1, -1, -1];
const playerCoords = [[-1, -1], [-1, -1], [-1, -1], [-1, -1]];
// 4 indexes refer to 4 players, the first element is direction, the second element is sprite count
const playerSpriteCondition = [[-1, -1], [-1, -1], [-1, -1], [-1, -1]];
const playerSockets = [-1, -1, -1, -1];
// exist to get what was supposed to replace the player/object after it moved/vanished
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
// the actual board state, modify this one for game related actions
const boardCurrent = 
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


io.on("connection", (socket) => {

    if (socket.request.session.user) {

        const {username} = socket.request.session.user;
        onlineUsers[username] = {username};
        // io.emit("add user", JSON.stringify(socket.request.session.user));

        console.log(onlineUsers);

        socket.on("disconnect", () => {
            if(players.includes(username)) {
                if(removePlayer(username) != -1) {
                    playerSockets[getPlayerID(username)] = -1;
                    console.log(username, "is removed from players, current players: ", players);
                    io.emit("players", JSON.stringify(players));
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

                    playerSockets[playerID] = socket;
                    addPlayerOnBoard(playerID);

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
function getPlayerList() {
    var playerlist = [];
    for(var i = 0; i < 4; ++i) {
        if(players[i] != -1) playerlist = [...playerlist, players[i]];
    }
    return playerlist;
}

function getPlayerID(username) {
    return players.indexOf(username);
}

function removePlayerOnBoard(playerID) {

}

// tells all client to print the server side map
function broadcastPrintPlayground() {
    let data = {base: boardInit, overlay: boardCurrent};
    let jsonData = JSON.stringify(data);

    for(const playerSocket of playerSockets) {
        if (playerSocket != -1) {
            playerSocket.emit("print playground", jsonData);
        }
    }
}

function addPlayerOnBoard(playerID) {
    const initSpawnPoint = [[1, 1], [24, 1], [1, 16], [24, 16]];
    var pc = playerCoords[playerID] = initSpawnPoint[playerID];
    boardCurrent[pc[1]][pc[0]] = "P" + playerID + "20";
    broadcastPrintPlayground();
}

// bear witness, the epitome of garbage coding
function playerMove(playerID, movex, movey) {
    const playableAreaX = 25;
    const playableAreaY = 17;

    const playerOldCoord = playerCoords[playerID];
    const spriteCondition = playerSpriteCondition[playerID];

    // clamp the final coord back within the playable area
    var newX = Math.min(Math.max(playerOldCoord[0] + movex, 1), playableAreaX - 1);
    var newY = Math.min(Math.max(playerOldCoord[1] + movey, 1), playableAreaY - 1);

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
        else if (moveDirection == 1 || moveDirection == 3) {
            spriteCondition[1]++;
            spriteCondition[1] = spriteCondition[1] % 4;
        }
    }
    else {
        spriteCondition[0] = moveDirection;
        spriteCondition[1] = 0;
    }

    const playerNewCoord = [newX, newY];
    boardCurrent[playerOldCoord[1]][playerOldCoord[0]] = boardInit[playerOldCoord[1]][playerOldCoord[0]];
    boardCurrent[playerNewCoord[1]][playerNewCoord[0]] = "P" + playerID + spriteCondition[0] + spriteCondition[1];

    playerCoords[playerID] = playerNewCoord;
    playerSpriteCondition[playerID] = spriteCondition;

    broadcastPrintPlayground();
}