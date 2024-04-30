const Playground = (function() {
    let canvas = null;
    let context = null;

    const spritesheet = new Image();

    const codeToSpriteCoordDict = {
        "W1": [160, 288], "W2": [176, 288], "WR": [192, 288], "G1": [32, 208],
        "EW": [224, 208], "EV": [224, 224], "ES": [224, 240], 
        "EA": [0, 288], "EH": [16, 288], "EC": [32, 288], "ED": [48, 288]
    };

    // each sequence refers to the sprite that player use
    const spawnCoords = [[75, 75], [1225, 75], [75, 825], [1225, 825]];
    const sequences = [    
    {
        moveLeft:  { x: 160, y: 224, width: 16, height: 16, count: 4, timing: 50, loop: true },
        moveUp:    { x: 112, y: 224, width: 16, height: 16, count: 3, timing: 50, loop: true },
        moveRight: { x: 48 , y: 224, width: 16, height: 16, count: 4, timing: 50, loop: true },
        moveDown:  { x: 0  , y: 224, width: 16, height: 16, count: 3, timing: 50, loop: true }
    }
    ,
    {
        moveLeft:  { x: 160, y: 240, width: 16, height: 16, count: 4, timing: 50, loop: true },
        moveUp:    { x: 112, y: 240, width: 16, height: 16, count: 3, timing: 50, loop: true },
        moveRight: { x: 48 , y: 240, width: 16, height: 16, count: 4, timing: 50, loop: true },
        moveDown:  { x: 0  , y: 240, width: 16, height: 16, count: 3, timing: 50, loop: true }
    }
    ,
    {
        moveLeft:  { x: 160, y: 256, width: 16, height: 16, count: 4, timing: 50, loop: true },
        moveUp:    { x: 112, y: 256, width: 16, height: 16, count: 3, timing: 50, loop: true },
        moveRight: { x: 48 , y: 256, width: 16, height: 16, count: 4, timing: 50, loop: true },
        moveDown:  { x: 0  , y: 256, width: 16, height: 16, count: 3, timing: 50, loop: true }
    }
    ,
    {
        moveLeft:  { x: 160, y: 272, width: 16, height: 16, count: 4, timing: 50, loop: true },
        moveUp:    { x: 112, y: 272, width: 16, height: 16, count: 3, timing: 50, loop: true },
        moveRight: { x: 48 , y: 272, width: 16, height: 16, count: 4, timing: 50, loop: true },
        moveDown:  { x: 0  , y: 272, width: 16, height: 16, count: 3, timing: 50, loop: true }
    }];

    // baseMap, map layer that doesnt change at all (walls and grounds)
    let baseMap = null;

    // self explanatory
    const playerList = [];
    const bombList = [];
    const explosionList = [];
    const iceTrapList = [];
    const itemList = [];

    // this client's player id (0 - 3)
    var myID = -1;
    // the player is dead
    var dead = true;
    // individual explosion id to keep track
    var explosionID = 0;

    // only called once to init everything
    const initPlayground = function(mapArray) {
        canvas = document.getElementById("main-playground");
        context = canvas.getContext("2d");
        context.imageSmoothingEnabled = false;
        baseMap = mapArray;
        dead = false;
        gameEnd = false;

        // ensures that other init functions would only be called after the sprite is loaded
        spritesheet.src = "assets/sprite.png";
        spritesheet.decode()
            .then(() => {
                Socket.joinGame();
                printBaseMap();
                initPlayers();
                customAnimationFrame();
            })
            .catch(() => {
                console.log("error, sprite.png doesn't exist or the path is wrong");
            });
    }

    // just 2 for loops to print map, only thing to care is x/y are interchanged because how i put them originally at server
    const printBaseMap = function() {
        var x = 0, y = 0;
        for(const row of baseMap) {
            for(const code of row) {
                context.drawImage(spritesheet, 
                    codeToSpriteCoordDict[code][0], codeToSpriteCoordDict[code][1],
                    16, 16,
                    x, y,
                    50, 50);

                x += 50;
            }

            x = 0; 
            y += 50;
        }
    }

    // create 4 Player objects, and draw them
    const initPlayers = function() {
        for(var i = 0; i < 4; ++i){
            playerList[i] = Player(context, spawnCoords[i][0], spawnCoords[i][1], sequences[i]);
            playerList[i].draw();
        }
    };

    // used to avoid spamming "move" command to server
    // replaced the old "running" boolean check so can buffer 1 single input (could be better but i dont bother)
    let lastDirection = -1;

    const keyDownHandler = function(e) {

        if(dead) return;

        const keyToDirectionMapping = ["arrowleft", "arrowup", "arrowright", "arrowdown"];
        const keyToActionMapping = ["b", "v", " "];
        const keyInput = e.key.toLowerCase();

        const movementDirection = keyToDirectionMapping.indexOf(keyInput);
        const actionIndex = keyToActionMapping.indexOf(keyInput);

        // the key input is about movement
        if(movementDirection != -1) {
            // if player is already holding "w", for example, future "w" will not emit to server unless change direction/let go
            if(lastDirection == movementDirection) return;

            lastDirection = movementDirection;
            Socket.postMovement(JSON.stringify(movementDirection + 1));
        }
        // the key input is about action
        else if(actionIndex != -1) {
            switch(actionIndex) {
                // bomb
                case 0: playerList[myID].attemptPlaceBomb(0, myID); break;
                // ice trap
                case 1: playerList[myID].attemptPlaceBomb(1, myID); break;
                // cheat
                case 2: console.log("cheating"); break;
            }
        }

        
    }

    // handles when the key were no longer pressed
    const keyUpHandler = function(e) {

        if(dead) return;

        const keyToDirectionMapping = ["arrowleft", "arrowup", "arrowright", "arrowdown"];
        const keyInput = e.key.toLowerCase();
        const movementDirection = keyToDirectionMapping.indexOf(keyInput);

        // if the user was already running in some direction, then send the "stop" message to server
        if(movementDirection != -1) {
            lastDirection = -1;
            Socket.stopMovement(JSON.stringify(movementDirection + 1));
        }
    }

    // client receives data from server, move players on own screen
    const playerMove = function(moveData) {
        const { direction, playerID } = moveData;
        if(playerList[playerID] != undefined) {
            playerList[playerID].move(direction);
        }
    }

    // client receives data from server, stop the said player
    const playerStop = function(moveData) {
        const { direction, playerID } = moveData;
        if(playerList[playerID] != undefined) {
            playerList[playerID].stop(direction);
        }
    }

    var gameEnd = false;

    // it runs at 30 fps, can be changed by changing the setTimeout delay
    const customAnimationFrame = function() {

        const timeNow = performance.now();

        printBaseMap();

        // print all bombs first
        for(var bomb of bombList) {
            bomb.update(timeNow);
            bomb.draw();
        }

        // perform death check if not dead
        var myCoord = undefined;
        if(myID != -1 && !dead) myCoord = playerList[myID].getGridXY();

        // print all explosion clusters
        for(const explosion of explosionList) {
            const clusters = explosion.explosionClusters;

            for(const cluster of clusters) {
                const {code, coord} = cluster;
                const {x, y} = coord;

                // here is where death detection occurs
                if(myCoord) {
                    if(myCoord.x == x && myCoord.y == y) {
                        Socket.playerDied();
                        dead = true;
                    }
                }

                // draw each cluster piece individually
                context.drawImage(spritesheet, 
                    codeToSpriteCoordDict[code][0], codeToSpriteCoordDict[code][1],
                    16, 16,
                    x * 50, y * 50,
                    50, 50);
            }

        }

        // draw each player that still exist / is alive
        for(var player of playerList) {
            if(player) {
                player.update(timeNow);
                player.draw();
            }
        }

        if(!gameEnd) setTimeout(customAnimationFrame, 33);
    }

    // for replying to server's sync check
    const getPlayerCoords = function() {
        if(dead) return null;
        return playerList[myID].getXY();
    }

    // server sends coord of certain player, the client sync it
    const syncPosition = function(playerPositions) {

        const { playerID, coord } = playerPositions;
        const { x, y } = coord;
        
        if(playerList[playerID]) playerList[playerID].setXY(x, y);
    }

    // return true if it is going to collide with something
    // false otherwise
    const collisionCheck = function(x, y, direction) {

        // testing for 2 coords only, if the user is moving left, only test for the projected top left and bottom left points
        // since it would not make sense to test for top right and bottom right points if the user is only moving left
        const coordsToTestFor = [];

        // setting up different 2 points to test for based on the direction user is moving
        // the x + 17, y - 10, those numbers are hardcoded, change them with care
        // the "toTestFor" points are points that user "might" reach after moving
        // so for example, if my two points to test for are "100, 100" and "100, 120" respective to top left, bottom left
        // after moving to left successfully, the player might have his coord only at "105, 100" and "105, 120"
        // it exaggerate the moving direction (in this case, the negative x axis) for the testing point
        // this can somehow prevents cases where moving left until stuck would mean up and down movement would also be locked somehow
        
        // TL;DR: collision check stuff, handle with care
        switch(direction) {
            case 1:
                coordsToTestFor[0] = [Math.floor((x - 17) / 50), Math.floor((y - 10) / 50)];
                coordsToTestFor[1] = [Math.floor((x - 17) / 50), Math.floor((y + 20) / 50)];
            break;
            case 2: 
                coordsToTestFor[0] = [Math.floor((x - 7) / 50), Math.floor((y - 20) / 50)];
                coordsToTestFor[1] = [Math.floor((x + 7) / 50), Math.floor((y - 20) / 50)];
            break;
            case 3: 
                coordsToTestFor[0] = [Math.floor((x + 17) / 50), Math.floor((y - 10) / 50)];
                coordsToTestFor[1] = [Math.floor((x + 17) / 50), Math.floor((y + 20) / 50)];
            break;
            case 4:
                coordsToTestFor[0] = [Math.floor((x - 7) / 50), Math.floor((y + 30) / 50)];
                coordsToTestFor[1] = [Math.floor((x + 7) / 50), Math.floor((y + 30) / 50)];
            break;
        }

        // getting the code of the two test points on base map
        const girdBlockCode1 = baseMap[coordsToTestFor[0][1]][coordsToTestFor[0][0]];
        const girdBlockCode2 = baseMap[coordsToTestFor[1][1]][coordsToTestFor[1][0]];

        // wall collision here
        if( girdBlockCode1[0] == "W" || girdBlockCode2[0] == "W" ) return true;

        return false;
    }

    const setMyID = function(id) {
        myID = id;
    }

    // add the bomb to bomb list by creating a new bomb object
    const addBomb = function(bombInfo, gridCoord) {
        bombList.push(Bomb(context, bombInfo, gridCoord));
    }

    // explode bomb with given bombID
    const explodeBomb = function(bombID) {
        for(var i = 0; i < bombList.length; ++i) {
            if(bombList[i].getID() == bombID) {
                const bombOwner = playerList[bombList[i].getOwner()];

                // tell the player entity that the bomb has exploded
                if(bombOwner) {
                    bombOwner.bombExploded();
                }

                scuffBombExplosionSprite(bombList[i]);
                bombList.splice(i, 1);

                // prevent unneeded calculation
                return;
            }
        }

        // lol bug happened or sth 
        console.log("Bomb " + bombID + " was detonated, but it doesn't exist...");
    }

    // garbage way to display explosion sprite, since the explosion radius and stuff are all dynamic...
    const scuffBombExplosionSprite = function(bomb) {
        const {x, y} = bomb.getGridXY();
        const bombPower = bomb.getPower();

        // every sprite with their coord that belongs to this explosion stored here
        const explosionClusters = [];
        // special case, add the origin of explosion first
        explosionClusters.push({"code" : "EC", "coord" : {x, y}});
        
        // loop 4 directions of explosion, in wasd order
        for(var i = 0; i < 4; ++i) {
            for(var j = 1; j <= bombPower; ++j) {

                // coordsToPaintOver
                var ctpo;
                switch(i) {
                    case 0: ctpo = [x, y - j]; break;
                    case 1: ctpo = [x - j, y]; break;
                    case 2: ctpo = [x, y + j]; break;
                    case 3: ctpo = [x + j, y]; break;
                }

                // technically this line could crash, because y - j could be out of bound and undefined[x] is just begging for crash
                // but it shouldnt happen if wall check is performed correctly, and bombs dont appear inside wall somehow...
                const blockToPaintOver = baseMap[ctpo[1]][ctpo[0]];
                // stop this branch of explosion if it hits wall
                if(blockToPaintOver[0] == "W") {
                    if(blockToPaintOver == "WR") 
                    {
                        Socket.removeWall({"x" : ctpo[0] , "y" : ctpo[1]});
                    }
                    break;
                }

                const endOfExplosion = (j == bombPower);
                
                // spriteCodeToUse
                var sctu;
                switch(i) {
                    case 0: endOfExplosion ? sctu = "EW" : "EV"; break;
                    case 1: endOfExplosion ? sctu = "EA" : "EH"; break;
                    case 2: endOfExplosion ? sctu = "ES" : "EV"; break;
                    case 3: endOfExplosion ? sctu = "ED" : "EH"; break;
                }

                const explosionCluster = {"code" : sctu, "coord" : {"x" : ctpo[0] , "y" : ctpo[1]}};
                explosionClusters.push(explosionCluster);
            }
        }

        const thisExplosionID = explosionID++;

        explosionList.push({"ID" : thisExplosionID, "explosionClusters" : explosionClusters});
        setTimeout(removeExplosionSprite, 2000, thisExplosionID);
    }

    // remove explosion sprit according to ID
    const removeExplosionSprite = function(ID) {
        for(var i = 0; i < explosionList.length; ++i) {
            if(explosionList[i].ID == ID) explosionList.splice(i, 1); 
        }
    }

    // remove player according to ID
    const playerDied = function(ID) {
        playerList[ID] = null;
    }

    const removeWall = function(coord) {
        const {x, y} = coord;
        if(baseMap[y][x] == "WR") {
            baseMap[y][x] = "G1";
        }
    }

    const gameEnded = function() {
        gameEnd = true;
    }

    return {initPlayground, printBaseMap, keyDownHandler, keyUpHandler, playerMove,
            playerStop, getPlayerCoords, syncPosition, collisionCheck, setMyID, addBomb,
            explodeBomb, playerDied, removeWall, gameEnded};
})();