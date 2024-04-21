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
            // Get current player list
            socket.emit("get players");
            
            // Get own statistics
            socket.emit("get own statistics");
        });

        // Set up the players event
        socket.on("players", (players) => {
            players = JSON.parse(players);
            console.log(players);
            //TODO: show the players
            LobbyPage.update(players);
        });

        // Set up the add player event
        socket.on("add player", (name) => {
            name = JSON.parse(name);
            console.log(name);
            LobbyPage.addPlayer(name);
        });

        socket.on("remove player", (name) => {
            name = JSON.parse(name);
            console.log(name);
            LobbyPage.removePlayer(name);
        });

        // Set up the start game event
        socket.on("start game", () => {
            // TODO: start the game, change to another page!
            LobbyPage.hide();
            initPlayground();
            GamePlayPage.show();
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

        // Recieve info for how to init player on the playground
        socket.on("initPlayer", (data) => {
            parsedData = JSON.parse(data);
            initPlayer(parsedData["coords"], parsedData["playerID"]);
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