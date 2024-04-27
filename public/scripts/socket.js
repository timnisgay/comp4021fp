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

        // server tells socket a player is dead, please remove that player in the playArea
        // but can keep the player stat?
        socket.on("remove player", (player) => {

        });

        // server tells socket the game is ended, please show the end game page
        socket.on("end game", () => {

        });

        socket.on("print playground", (data) => {
            parsedData = JSON.parse(data);
            printPlayground(parsedData);
        });

        //server tells this socket that player[XXX] moves/stops at which direction
        //moveData should contain which player is doing the movement, and what is the movement
        socket.on("move", (moveData) => {

        });

        //server tells this socket there is a bomb somewhere
        //bombData should have the bomb location, attack radius
        // and the socket should do update to show the bomb and do the self countdown and self explode
        socket.on("bomb", (bombData) => {

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

            socket.emit("player move", data);
        }
    };

    //This function tells server where the bomb is placed
    //dont tell server to place bomb if it exceeds the number of bomb it can placed
    const postBomb = function() {
        if (socket && socket.connected) {
            //TODO: prepare data
            const data = null;

            socket.emit("place bomb", data);
        }
    };

    return { getSocket, connect, disconnect, getPlayers, joinGame, endGame, postMovement, postBomb};
})();