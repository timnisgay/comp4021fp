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

    let baseMap = null;
    const playerList = [];

    const initPlayground = function(mapArray) {
        canvas = document.getElementById("main-playground");
        context = canvas.getContext("2d");
        context.imageSmoothingEnabled = false;
        baseMap = mapArray;

        console.log(baseMap);

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

    const initPlayers = function() {
        for(var i = 0; i < 4; ++i){
            playerList[i] = Player(context, spawnCoords[i][0], spawnCoords[i][1], sequences[i]);
            playerList[i].draw();
        }
    };

    let moving = false;

    const keyDownHandler = function(e) {

        if(moving) return;

        const keyToDirectionMapping = ["a", "w", "d", "s"];
        const keyInput = e.key.toLowerCase();

        const movementDirection = keyToDirectionMapping.indexOf(keyInput);

        if(movementDirection != -1) {
            moving = true;
            Socket.postMovement(JSON.stringify(movementDirection + 1));
        }
    }

    const keyUpHandler = function(e) {
        const keyToDirectionMapping = ["a", "w", "d", "s"];
        const keyInput = e.key.toLowerCase();
        const movementDirection = keyToDirectionMapping.indexOf(keyInput);

        if(movementDirection != -1) {
            moving = false;
            Socket.stopMovement(JSON.stringify(movementDirection + 1));
        }
    }

    const playerMove = function(moveData) {
        const { direction, playerID } = moveData;
        if(playerList[playerID] != undefined) {
            playerList[playerID].move(direction);
        }
    }

    const playerStop = function(moveData) {
        const { direction, playerID } = moveData;
        if(playerList[playerID] != undefined) {
            playerList[playerID].stop(direction);
        }
    }

    const customAnimationFrame = function() {

        const timeNow = performance.now();

        printBaseMap();

        for(player of playerList) {
            player.update(timeNow);
            player.draw();
        }

        setTimeout(customAnimationFrame, 33);
    }

    return {initPlayground, printBaseMap, keyDownHandler, keyUpHandler, playerMove, playerStop};
})();