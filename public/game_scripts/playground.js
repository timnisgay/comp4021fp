const Playground = (function() {
    let canvas = null;
    let context = null;

    const spritesheet = new Image();

    const codeToSpriteCoordDict = {
        "W1": [160, 288], "W2": [176, 288], "G1": [32, 208]
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
    // player list, duh
    const playerList = [];

    // only called once to init everything
    const initPlayground = function(mapArray) {
        canvas = document.getElementById("main-playground");
        context = canvas.getContext("2d");
        context.imageSmoothingEnabled = false;
        baseMap = mapArray;

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

        const keyToDirectionMapping = ["a", "w", "d", "s"];
        const keyInput = e.key.toLowerCase();

        const movementDirection = keyToDirectionMapping.indexOf(keyInput);

        // if player is already holding "w", for example, future "w" will not emit to server unless change direction/let go
        if(lastDirection == movementDirection) return;

        if(movementDirection != -1) {
            lastDirection = movementDirection;
            Socket.postMovement(JSON.stringify(movementDirection + 1));
        }
    }

    // handles when the key were no longer pressed
    const keyUpHandler = function(e) {
        const keyToDirectionMapping = ["a", "w", "d", "s"];
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

    // it runs at 30 fps, can be changed by changing the setTimeout delay
    const customAnimationFrame = function() {

        const timeNow = performance.now();

        // always print the base map first
        printBaseMap();

        // in the future maybe have bombs and stuff needs to be printed here too

        // prints player last
        for(player of playerList) {
            player.update(timeNow);
            player.draw();
        }

        setTimeout(customAnimationFrame, 33);
    }

    // technically, only the host would ever use this function
    // used for host getting all player coord in his screen
    const getPlayerCoords = function() {

        const playerCoords = [];

        for(player of playerList) {
            playerCoords.push(player.getXY());
        }

        return playerCoords;
    }

    // everyone, including host, will call it after the server sends all player coords back
    const syncPosition = function(playerPositions) {
        
        for(var i = 0; i < 4; ++i) {
            const x = playerPositions[i]["x"];
            const y = playerPositions[i]["y"];
            playerList[i].setXY(x, y);
        }
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
                coordsToTestFor[0] = [Math.floor((x - 7) / 50), Math.floor((y + 27) / 50)];
                coordsToTestFor[1] = [Math.floor((x + 7) / 50), Math.floor((y + 27) / 50)];
            break;
        }

        // getting the code of the two test points on base map
        const girdBlockCode1 = baseMap[coordsToTestFor[0][1]][coordsToTestFor[0][0]];
        const girdBlockCode2 = baseMap[coordsToTestFor[1][1]][coordsToTestFor[1][0]];

        // in the future, need to test for bomb, explosion, item collision

        // wall collision here
        if( girdBlockCode1[0] == "W" || girdBlockCode2[0] == "W" ) return true;

        return false;
    }

    return {initPlayground, printBaseMap, keyDownHandler, keyUpHandler, playerMove, playerStop, getPlayerCoords, syncPosition, collisionCheck};
})();