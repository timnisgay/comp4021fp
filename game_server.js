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
    users[username] = { password: hash, bestStats: {bestGameTime: null, numBombUsed: null, numIceTrapUsed: null, attackRadius: null} };

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
var players = [-1, -1, -1, -1];
var playerDead = [true, true, true, true];
var playerSockets = [-1, -1, -1, -1];
var playerStats = {};

var gameRunning = false;

// starts from 0, each bomb will be given their own bombID for easier identification
var currentBombID = 0;
var currentItemID = 0;

// exist for later restart game
const boardRestartInit = 
[
    ["W1", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W2", "W1"],
    ["W1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "G1", "W1"],
    ["W1", "G1", "W2", "WR", "W2", "WR", "W2", "WR", "W2", "WR", "W2", "WR", "W1", "G1", "G1", "W2", "WR", "W2", "WR", "W2", "G1", "W2", "G1", "W2", "G1", "W1"],
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

// exist to get what was supposed to replace the player/object after it moved/vanished
var boardInit = boardRestartInit;

io.on("connection", (socket) => {

    if (socket.request.session.user) {

        const {username} = socket.request.session.user;
        onlineUsers[username] = {username};
        // io.emit("add user", JSON.stringify(socket.request.session.user));

        console.log(onlineUsers);

        socket.on("disconnect", () => {
            if(players.includes(username)) {
                if(removePlayer(username) != -1) {
                    console.log(username, "is removed from players, current players: ", players);
                    io.emit("players", JSON.stringify(players));
                    gameRunning = false;
                }
            }
            
            delete onlineUsers[username];
            //io.emit("remove user", JSON.stringify(socket.request.session.user));
        });

        //socket get the current players including -1
        socket.on("get players", () => {
            console.log("current players: ", players);
            socket.emit("players", JSON.stringify(players));
        });

        //socket get the best game statistics from users.json
        socket.on("get best statistics", () => {
            const users = JSON.parse(fs.readFileSync("data/users.json"));
            const bestStats = users[username].bestStats;
            socket.emit("best stats", JSON.stringify(bestStats));
        });

        //socket joins the game
        socket.on("join game", () => {
            if (!players.includes(username) && getPlayerLength() < 4) {
                const playerID = addPlayer(username);
                if(playerID != -1) {

                    const len = getPlayerLength();

                    console.log(len);
                    console.log("current players: ", players);

                    // store the player socket
                    playerSockets[playerID] = socket;
                    // set the player to be alive
                    playerDead[playerID] = false;

                    // DEBUG purpose
                    // if (len === 4) {
                    if (len === 2) {
                        //do map init
                        boardInit = boardRestartInit;
                        playerStats = {};

                        for(var i = 0; i < 4; ++i){
                            if(playerSockets[i] != -1) {
                                const playerInfo = {
                                    playerID : i,
                                    playerName : username
                                }
                                playerSockets[i].emit("start game", JSON.stringify(playerInfo));
                            }
                        }

                        gameRunning = true;
                        // 3000 here, in the future maybe 3 seconds count down before start
                        setTimeout(syncRequest, 3000);
                    } else {
                        io.emit("players", JSON.stringify(players));
                    }
                }  
            }
        });

        // Send the base board to whoever request for the info
        socket.on("init board", () => {
            socket.emit("init map", JSON.stringify(boardInit));
        });

        // socket tells server its player movement
        socket.on("player move", (data) => {
            var playerMovementData = JSON.parse(data);
            playerMovementData["playerID"] = getPlayerID(username);
            io.emit("move", JSON.stringify(playerMovementData));
        });

        // socket tells server the player it is controlling has stopped
        socket.on("player stop", (data) => {
            var playerMovementData = JSON.parse(data);
            playerMovementData["playerID"] = getPlayerID(username);
            io.emit("stop", JSON.stringify(playerMovementData));
        });

        //socket tells server he/she places a bomb with bomb location and attack radius
        socket.on("place bomb", (bombData) => {

            // adding this to prevent extreme corner case
            // maybe 2 players place bomb at same time
            // since js async, data integrity might be affected
            // causing currentBombID to change midway and weird stuff happen
            const bombIDnow = currentBombID++;

            const { bombInfo, canvasCoords } = JSON.parse(bombData);
            bombInfo.bombID = bombIDnow;
            const { x, y} = canvasCoords;

            const gridCoord = {x : Math.floor(x / 50), y : Math.floor(y / 50)}

            io.emit("bomb", JSON.stringify({bombInfo, gridCoord}));
            setTimeout(bombExplode, 2400, bombIDnow);
        });

        // host tells server the player coords, time to broadcast it
        socket.on("sync host return", (playerPositionJSON) => {

            const coord = JSON.parse(playerPositionJSON);

            const playerPosition = {
                "playerID" : getPlayerID(username),
                "coord" : coord
            }

            io.emit("sync position", JSON.stringify(playerPosition));
        });

        socket.on("dead", () => {
            const playerID = getPlayerID(username);
            playerDead[playerID] = true;

            console.log(playerDead);
            console.log("how many player left: ", playerDead.filter(value => value === false).length);
            if (playerDead.filter(value => value === false).length <= 1) {
                
                io.emit("end game");
                io.emit("get personal stat");
                
                gameRunning = false;
                // players = [-1, -1, -1, -1];
                // playerDead = [true, true, true, true];
                // playerSockets = [-1, -1, -1, -1];
                // io.emit("players", JSON.stringify(players));
                // boardInit = boardRestartInit;
                
            } else {
                io.emit("player died", playerID);
            }
        });

        socket.on("remove wall", (coord) => {
            // tell everyone to remove the wall
            io.emit("remove wall", coord);

            // chance server own board
            const {x, y} = JSON.parse(coord);
            if(boardInit[y][x] == "WR") boardInit[y][x] = "G1";

            // tries to spawn a power up
            const powerUp = spawnPowerUp();
            if(powerUp != "nothing") {
                const powerUpInfo = {
                    powerUp : powerUp,
                    itemID : currentItemID++
                }
                io.emit("spawn powerup", JSON.stringify({"powerUpInfo" : powerUpInfo, "coord" : JSON.parse(coord)}));
            }
        });

        socket.on("power up get", (data) => {
            const {powerUp, itemID} = JSON.parse(data);

            socket.emit("receive powerup", JSON.stringify(powerUp));
            io.emit("remove item", itemID);
        });

        socket.on("player frozen", () => {
            const playerID = getPlayerID(username);
            io.emit("player frozen", playerID);
            setTimeout(unfreezePlayer, 4000, playerID);
        });

        // sockets tell server the current game stats
        socket.on("return stat", (data) => {
            const stats = JSON.parse(data);
            const playerID = getPlayerID(username);
            console.log(playerID);
            if(playerID != -1) {
                playerStats[username] = stats;
                playerStats[username]["playerID"] = playerID;
                console.log(playerStats[username]);

                removePlayer(username); //after storing the stat, can remove this player
                io.emit("players", JSON.stringify(players));
            }

            // if(Object.keys(playerStats).length === 4) {
            if(Object.keys(playerStats).length === 2) {
                io.emit("show all stats", JSON.stringify(playerStats));
                console.log("emit show all stats: ", playerStats);

                //check winner stats, overwrite the best stats if needed
                var winnerName = -1;
                var tempShortestTime = 0;

                // find the winner who has the longest timeDied
                for (const name in playerStats) {
                    if (tempShortestTime < playerStats[name].timeDied) {
                        winnerName = name;
                        tempShortestTime = playerStats[name].timeDied;
                    }
                }

                const users = JSON.parse(fs.readFileSync("data/users.json"));
                if (winnerName in users) {
                    const bestStat = users[winnerName].bestStats;
                    if (bestStat.bestGameTime == null || bestStat.bestGameTime > stats.timeDied) {
                        console.log("update best stats of player: ", winnerName);
                        users[winnerName].bestStats = {
                            bestGameTime: stats.timeDied, 
                            numBombUsed: stats.numBomb,
                            numIceTrapUsed: stats.numIceTrap, 
                            attackRadius: stats.attackRadius
                        };
                        fs.writeFileSync("data/users.json", JSON.stringify(users, null, " "));
                    }
                }
            }
        });
    }
});

// Use a web servers to listen at port 8000
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
    const index = getPlayerID(username);
    if(index == -1) return -1;

    playerSockets[index] = -1;
    playerDead[index] = true;
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

// does what it says
function getPlayerID(username) {
    return players.indexOf(username);
}

// Send request to host every 200 ms, asking for the hosts player positions
function syncRequest() {

    if(!gameRunning) return;

    for(var i = 0; i < 4; ++i) {
        if(!playerDead[i]) playerSockets[i].emit("sync host");
    }

    setTimeout(syncRequest, 200);
}

function bombExplode(bombID) {
    io.emit("explode bomb", bombID);
}

// chanceToSpawnPowerUp - chance to spawn a power up after breaking a wall
const chanceToSpawnPowerUp = 1.0;

// chance for each power up to spawn (if something is going to spawn for sure)
// the chances should add up to 1 in the end, 
// if the sum is less than 1: might cause an originally spawning item to not spawn
// if the sum is larger than 1: some power up might spawn more than they should, some power up might never spawn
// just make them add up to 1 lol
const chanceBombCount = 0.3;
const chanceBombPower = 0.3;
const chanceIceCount = 0.4;
function spawnPowerUp() {
    if(Math.random() < chanceToSpawnPowerUp) {
        var randomSeed = Math.random();

        randomSeed -= chanceBombCount;
        if(randomSeed <= 0) {
            return "bombCount";
        }

        randomSeed -= chanceBombPower;
        if(randomSeed <= 0) {
            return "bombPower";
        }

        randomSeed -= chanceIceCount;
        if(randomSeed <= 0) {
            return "iceCount";
        }

    }
    return "nothing";
}

function unfreezePlayer(playerID) {
    io.emit("unfreeze player", playerID);
}