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

        // socket receives the most updated players list, including -1
        // no matter a player is added or deleted, use this function to update the lobby
        socket.on("players", (players) => {
            players = JSON.parse(players);
            console.log(players);
            LobbyPage.update(players);
        });

        // server tells socket that there are 4 players already and will now start the game
        socket.on("start game", () => {
            // TODO: start the game, change to another page!
            LobbyPage.hide();
            GamePlayPage.show();
            //game.start();
        });

        // Set up the end game event
        socket.on("end game", (name) => {
            // TODO: remove the player that is dead, the name should not be the same as this socket
        });

        socket.on("print playground", (data) => {
            parsedData = JSON.parse(data);
            printPlayground(parsedData);
        });
    };

    // This function disconnects the socket from the server
    const disconnect = function() {
        socket.disconnect();
        socket = null;
    };

    const getPlayers = function() {
        if (socket && socket.connected) {
            socket.emit("get players");
        }
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

    return { getSocket, connect, disconnect, getPlayers, joinGame, endGame, postMovement};
})();