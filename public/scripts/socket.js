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
            
            // Get best statistics
            socket.emit("get best statistics");
        });

        // socket receives the most updated players list, including -1
        // no matter a player is added or deleted, use this function to update the lobby
        socket.on("players", (players) => {
            players = JSON.parse(players);
            console.log(players);
            LobbyPage.update(players);
        });

        // socket receives their own best statistics
        socket.on("best stats", (stats) => {
            stats = JSON.parse(stats);
            console.log(stats);
            LobbyPage.updateBestStats(stats);
        });

        // server tells socket that there are 4 players already and will now start the game
        socket.on("start game", (playerInfo) => {
            LobbyPage.hide();
            GamePlayPage.updatePlayerInfo(Authentication.getUser());
            GamePlayPage.show();
            Playground.setMyInfo(JSON.parse(playerInfo));
        });

        // server tells socket the game is ended, please show the end game page
        socket.on("end game", () => {
            Playground.gameEnded();
            GamePlayPage.hide();
            GameEndPage.show();
        });

        socket.on("print playground", (data) => {
            parsedData = JSON.parse(data);
            printPlayground(parsedData);
        });

        //server tells this socket that player[XXX] moves/stops at which direction
        //moveData should contain which player is doing the movement, and what is the movement
        socket.on("move", (moveData) => {
            Playground.playerMove(JSON.parse(moveData));
        });

        socket.on("stop", (moveData) => {
            Playground.playerStop(JSON.parse(moveData));
        });

        //server tells this socket there is a bomb somewhere
        //bombData should have the bomb location, attack radius
        // and the socket should do update to show the bomb and do the self countdown and self explode
        socket.on("bomb", (data) => {
            const bombData = JSON.parse(data);
            const {bombInfo, gridCoord} = bombData

            Playground.addBomb(bombInfo, gridCoord);
        });

        socket.on("explode bomb", (bombID) => {
            Playground.explodeBomb(bombID);
        })

        // socket received base map from server, ask playground to init
        socket.on("init map", (mapJSON) => {
            Playground.initPlayground(JSON.parse(mapJSON));
        });

        // only "host" would receive this, host would need to get all player coords and return back to server
        socket.on("sync host", () => {
            const coord = Playground.getPlayerCoords();
            if(coord) socket.emit("sync host return", JSON.stringify(coord));
        });

        // everyone will receive this, sync player position according to the JSON received
        socket.on("sync position", (playerPositionJSON) => {
            const playerPosition = JSON.parse(playerPositionJSON);
            Playground.syncPosition(playerPosition);
        });

        socket.on("player died", (playerID) => {
            Playground.playerDied(playerID);
        });

        socket.on("remove wall", (data) => {
            Playground.removeWall(JSON.parse(data));
        });

        socket.on("spawn powerup", (data) => {
            Playground.addPowerUp(JSON.parse(data));
        });

        socket.on("receive powerup", (data) => {
            Playground.applyPowerUp(JSON.parse(data));
        });

        socket.on("remove item", (itemID) => {
            Playground.removePowerUp(itemID);
        });

        socket.on("player frozen", (playerID) => {
            Playground.freezePlayer(playerID);
        });

        socket.on("unfreeze player", (playerID) => {
            Playground.unfreezePlayer(playerID);
        });

        socket.on("get personal stat", () => {
            Playground.getMyStat();
        });

        socket.on("show all stats", (playerStats) => {
            playerStats = JSON.parse(playerStats);
            GameEndPage.update(playerStats);
        });

        socket.on("spectate", (data) => {
            LobbyPage.hide();
            Playground.syncItem(JSON.parse(data));
            GamePlayPage.updatePlayerInfo(Authentication.getUser());
            GamePlayPage.show();
        })

        socket.on("get sync item", () => {
            const item = Playground.getSyncItem();
            if(item) socket.emit("sync item", JSON.stringify(item));
        });

        socket.on("player status", (data) => {
            Playground.initDeath(data);
        });
    };

    // This function disconnects the socket from the server
    const disconnect = function() {
        socket.disconnect();
        socket = null;
        Playground.gameEnded();
    };

    const getPlayers = function() {
        if (socket && socket.connected) {
            socket.emit("get players");
        }
    };

    const getBestGameStats = function() {
        if (socket && socket.connected) {
            socket.emit("get best statistics");
        }
    };

    // This function tells server this socket joined the game
    const joinGame = function() {
        if (socket && socket.connected) {
            socket.emit("join game");
        }
    };

    //This function tells server this socket's movement
    const postMovement = function(movementDirection) {
        if (socket && socket.connected) {
            const data = {"direction" : movementDirection};
            socket.emit("player move", JSON.stringify(data));
        }
    };

    // stop the animation and the last position the player was facing
    const stopMovement = function(movementDirection) {
        if (socket && socket.connected) {
            const data = {"direction" : movementDirection};
            socket.emit("player stop", JSON.stringify(data));
        }
    };

    //This function tells server where the bomb is placed
    //dont tell server to place bomb if it exceeds the number of bomb it can placed
    const postBomb = function(bombInfo, canvasCoords) {
        if (socket && socket.connected) {
            const data = JSON.stringify({bombInfo, canvasCoords});
            socket.emit("place bomb", data);
        }
    };

    // asking server to send the base map
    const getMap = function() {
        if (socket && socket.connected) {
            socket.emit("init board");
        }
    }

    // player death can only be announced by themselves
    const playerDied = function() {
        if (socket && socket.connected) {
            socket.emit("dead");
        }
    }

    const removeWall = function(coord) {
        if (socket && socket.connected) {
            socket.emit("remove wall", JSON.stringify(coord));
        }
    }

    const powerUpPickUp = function(item) {
        if (socket && socket.connected) {
            socket.emit("power up get", JSON.stringify(item));
        }
    }

    const playerFrozen = function(coord) {
        if (socket && socket.connected) {
            socket.emit("player frozen", JSON.stringify(coord));
        }
    }

    const returnPersonalStat = function(stats, myID, myName) {
        if (socket && socket.connected) {
            const data = {
                stats : stats,
                playerID : myID,
                playerName : myName
            }
            socket.emit("return stat", JSON.stringify(stats));
        }
    }

    return { getSocket, connect, disconnect, getPlayers, getBestGameStats, 
            joinGame, postMovement, stopMovement, postBomb, getMap,
            playerDied, removeWall, powerUpPickUp, playerFrozen, returnPersonalStat};
})();