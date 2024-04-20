const Socket = (function() {
    // This stores the current Socket.IO socket
    let socket = null;

    // This function gets the socket from the module
    const getSocket = function() {
        return socket;
    };

    // This function connects the server and initializes the socket
    const connect = function() {
        socket = io();

        // Wait for the socket to connect successfully
        socket.on("connect", () => {
            // Get the online user list
            socket.emit("get users");

            // Get player list
            socket.emit("get players");
        });

        // Set up the users event
        socket.on("users", (onlineUsers) => {
            onlineUsers = JSON.parse(onlineUsers);

            // Show the online users
            OnlineUsersPanel.update(onlineUsers);
        });

        // Set up the players event
        socket.on("players", (players) => {
            players = JSON.parse(players);

            //TODO: show the players

        });

        // Set up the add user event
        socket.on("add user", (user) => {
            user = JSON.parse(user);

            // Add the online user
            OnlineUsersPanel.addUser(user);
        });

        // Set up the remove user event
        socket.on("remove user", (user) => {
            user = JSON.parse(user);

            // Remove the online user
            OnlineUsersPanel.removeUser(user);
        });

        // Set up the add player event
        socket.on("add player", (name) => {
            name = JSON.parse(name);

            // TODO: show the player name in the lobby

        });

        // Set up the start game event
        socket.on("start game", () => {
            // TODO: start the game, change to another page!
            
        });

        // Set up the end game event
        socket.on("end game", (name) => {
            // TODO: remove the player that is dead, the name should not be the same as this socket
        });

        // Set up the move event
        socket.on("move", (data) => {
            parsedData = JSON.parse(data);
            movePlayer(parsedData["playerID"], parsedData["x"], parsedData["y"]);
        });
    };

    // This function disconnects the socket from the server
    const disconnect = function() {
        socket.disconnect();
        socket = null;
    };

    // This function tells server this socket joined the game
    const joinGame = function() {
        if (socket && socket.connected) {
            socket.emit("join game");
        }
    };

    //This function tells server this socket died in the game
    const endGame = function() {
        if (socket && socket.connected) {
            socket.emit("end game");
        }
    };

    //This function tells server this socket's movement
    const postMovement = function() {
        if (socket && socket.connected) {
            //TODO: prepare data
            const data = null;

            setTimeout(function () {
                socket.emit("move", data);
            }, 10);
        }
    };

    return { getSocket, connect, disconnect, joinGame, endGame, postMovement};
})();