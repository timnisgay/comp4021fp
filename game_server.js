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


// Use a web server to listen at port 8000
app.listen(8000, () => {
    console.log("The game server has started...");
});
