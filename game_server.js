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
let players = [-1, -1, -1, -1];

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
                    io.emit("remove player", JSON.stringify(username));
                }
            }
            
            delete onlineUsers[username];
            //io.emit("remove user", JSON.stringify(socket.request.session.user));
        });

        //actually we dont need to get users
        // socket.on("get users", () => {
        //     socket.emit("users", JSON.stringify(onlineUsers));
        // });

        socket.on("get players", () => {
            socket.emit("players", JSON.stringify(getPlayerList()));
        });

        socket.on("join game", () => {
            if (!players.includes(username) && getPlayerLength() < 4) {
                if(addPlayer(username) != -1) {

                    const len = getPlayerLength();

                    console.log(len);
                    console.log("current players: ", players);
        
                    if (len === 4) {
                        io.emit("start game");
                    } else {
                        io.emit("add player", JSON.stringify(username));
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
            newData = { ...newData, playerID: 0};

            io.emit("move", JSON.stringify(newData));
        });

        socket.on("getInitPlayer", () => {

            const initSpawnPoint = [[0,0], [23, 0], [0, 15], [23, 15]];

            const index = players.indexOf(username);
            data = {coords: initSpawnPoint[index], playerID: index};

            io.emit("initPlayer", JSON.stringify(data));
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

function getPlayerList() {
    var playerlist = [];
    for(var i = 0; i < 4; ++i) {
        if(players[i] != -1) playerlist = [...playerlist, players[i]];
    }
    return playerlist;
}