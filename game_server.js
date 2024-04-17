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
const chatSession = session({
    secret: "game",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { maxAge: 300000 }
});
app.use(chatSession);

// This helper function checks whether the text only contains word characters
function containWordCharsOnly(text) {
    return /^\w+$/.test(text);
}

// Handle the /register endpoint
app.post("/register", (req, res) => {
    // Get the JSON data from the body
    const { username, avatar, name, password } = req.body;

    // D. Reading the users.json file
    const users = JSON.parse(fs.readFileSync("data/users.json"));

    // E. Checking for the user data correctness
    if (!username || !avatar || !name || !password) {
        res.json({status: "error", error: "username /avatar /name /password is empty!"});
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

    // G. Adding the new user account
    const hash = bcrypt.hashSync(password, 10);
    users[username] = { avatar, name, password: hash };

    // H. Saving the users.json file
    fs.writeFileSync("data/users.json", JSON.stringify(users, null, " "));

    // I. Sending a success response to the browser
    res.json({status: "success"});
});

// Handle the /signin endpoint
app.post("/signin", (req, res) => {
    // Get the JSON data from the body
    const { username, password } = req.body;

    // D. Reading the users.json file
    const users = JSON.parse(fs.readFileSync("data/users.json"));

    // E. Checking for username/password
    if (username in users) {
        if (!bcrypt.compareSync(password, users[username].password)) {
            res.json({status: "error", error: "username /password incorrect!"});
            return;
        }
    } else {
        res.json({status: "error", error: "username /password incorrect!"});
        return;
    }

    // G. Sending a success response with the user account
    req.session.user = {username, avatar: users[username].avatar, name: users[username].name};
    res.json({status: "success", user: {username, avatar: users[username].avatar, name: users[username].name}});
});

// Handle the /validate endpoint
app.get("/validate", (req, res) => {
    // B. Getting req.session.user
    if (!req.session.user) {
        res.json({status: "error", error: "You have not signed in."});
        return;
    }

    // D. Sending a success response with the user account
    res.json({ status: "success", user: req.session.user });
});

// Handle the /signout endpoint
app.get("/signout", (req, res) => {

    // Deleting req.session.user
    delete req.session.user;

    // Sending a success response
    res.json({ status: "success" });
});


//
// ***** Please insert your Lab 6 code here *****
//
const { createServer } = require("http");
const { Server } = require("socket.io");
const httpServer = createServer(app);
const io = new Server(httpServer);

io.use((socket, next) => {
    chatSession(socket.request, {}, next);
});

const onlineUsers = {};
let players = {player1: null, player2: null, player3: null, player4: null};

io.on("connection", (socket) => {
    if (socket.request.session.user) {
        const {username, avatar, name} = socket.request.session.user;
        onlineUsers[username] = {avatar, name};
        io.emit("add user", JSON.stringify(socket.request.session.user));

        socket.on("disconnect", () => {
            delete onlineUsers[username];
            io.emit("remove user", JSON.stringify(socket.request.session.user));

            //TODO: if the socket is in players, remove him or her also
        });

        socket.on("get users", () => {
            socket.emit("users", JSON.stringify(onlineUsers));
        });

        socket.on("get players", () => {
            socket.emit("players", JSON.stringify(players));
        });

        socket.on("join game", () => {
            //TODO: procedure to join the user to the players

            //TODO: broadcast that player joined the game
            if (players.player1 && players.player2 && players.player3 && players.player4) {
                io.emit("start game");
            } else {
                io.emit("add player", name);
            }            
        });

        socket.on("end game", (data) => {
            //TODO: this player is dead, broadcast this to others

            // save the game data of this player to scoreboard.json?

            // check, if all player is dead, stop the game
            io.emit("end game", name);
        });

        socket.on("move", (data) => {
            //TODO: broadcast the movement to all players
        });
    }
});

// Use a web server to listen at port 8000
httpServer.listen(8000, () => {
    console.log("The game server has started...");
});
