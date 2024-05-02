// This function defines the Player module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the player
// - `y` - The initial y position of the player
const Player = function(ctx, x, y, sequence) {

    //player stats
    let stats = {
        timeDied: 0,
        numBomb: 0,
        numIceTrap: 0,
        AttackRadius: 1, //bomb and ice trap share same level, bombradius 1 means is 3*3 cross, icetrap is 3*3 rectangle
    };

    // bomb stats
    let bombStats = {
        maxBomb: 1,
        currentPlaced: 0,
        power: 1,
        iceTrapUnlocked: false
    };

    var dead = false;
    var frozen = false;

    // This is the sprite object of the player created from the Sprite module.
    const sprite = Sprite(ctx, x, y);

    // The sprite object is configured for the player sprite here.
    sprite.setSequence(sequence.moveDown)
          .useSheet("assets/sprite.png");

    // This is the moving direction, which can be a number from 0 to 4:
    // - `0` - not moving
    // - `1` - moving to the left
    // - `2` - moving up
    // - `3` - moving to the right
    // - `4` - moving down
    let direction = 0;
    let running = false;

    // This is the moving speed (pixels per second) of the player
    let speed = 150;

    // This function sets the player's moving direction.
    // - `dir` - the moving direction (1: Left, 2: Up, 3: Right, 4: Down)
    const move = function(dirString) {
        const dir = parseInt(dirString);
        if (dir >= 1 && dir <= 4 && dir != direction) {
            switch (dir) {
                case 1: sprite.setSequence(sequence.moveLeft); break;
                case 2: sprite.setSequence(sequence.moveUp); break;
                case 3: sprite.setSequence(sequence.moveRight); break;
                case 4: sprite.setSequence(sequence.moveDown); break;
            }
            running = true;
            direction = dir;
        }
    };

    // This function stops the player from moving.
    // - `dir` - the moving direction when the player is stopped (1: Left, 2: Up, 3: Right, 4: Down)
    const stop = function(dirString) {
        const dir = parseInt(dirString);
        if (direction == dir) {
            switch (dir) {
                case 1: sprite.setSequence(sequence.moveLeft); break;
                case 2: sprite.setSequence(sequence.moveUp); break;
                case 3: sprite.setSequence(sequence.moveRight); break;
                case 4: sprite.setSequence(sequence.moveDown); break;
            }
            running = false;
            direction = 0;
        }
    };
    
    // This function updates the player depending on his movement.
    // - `time` - The timestamp when this function is called
    const update = function(time) {
        // Update the player if the player is moving
        if (direction != 0 && running) {
            let { x, y } = sprite.getXY();
            if(!Playground.collisionCheck(x, y, direction)) {
                // Move the player
                switch (direction) {
                    case 1: x -= speed / 20; break;
                    case 2: y -= speed / 20; break;
                    case 3: x += speed / 20; break;
                    case 4: y += speed / 20; break;
                }
            }

            // update the sprite position
            sprite.setXY(x, y)
                  .update(time);
        }
    };

    const attemptPlaceBomb = function(bombType, ownerID) {

        // no bombs left
        if(bombStats.currentPlaced == bombStats.maxBomb) return;

        if(bombType == 0 || bombType == 1) {

            ++bombStats.currentPlaced;

            bombType == 0 ? ++stats.numBomb : ++stats.numIceTrap;

            const bombData = {
                "bombType" : bombType,
                "bombPower" : bombStats.power,
                "bombOwner" : ownerID
            }

            Socket.postBomb(bombData, sprite.getXY());

        }
    }

    // bombType used for statistic collection
    const bombExploded = function(bombType) {
        bombStats.currentPlaced--;
    }

    const getGridXY = function() {
        const {x, y} = sprite.getXY();
        return {"x" : Math.floor(x / 50), "y" : Math.floor(y / 50)};
    }

    const increaseBombCount = function(num) {
        bombStats.maxBomb += num;
    }

    const increaseBombPower = function(num) {
        bombStats.power += num;
        stats.AttackRadius += num;
    }

    const unlockIceTrap = function() {
        bombStats.iceTrapUnlocked = true;
    }

    const setDead = function(bool) {
        dead = bool;
        if(bool) stats.timeDied = performance.now();
    }

    const setFrozen = function(bool) {
        frozen = bool;
        if(bool) stop(direction);
    }

    const getDead = function() {
        return dead;
    }

    const getFrozen = function() {
        return frozen;
    }

    const getStats = function() {
        return stats;
    }

    // The methods are returned as an object here.
    return {
        move: move,
        stop: stop,
        setXY: sprite.setXY,
        getXY: sprite.getXY,
        draw: sprite.draw,
        getGridXY: getGridXY,
        attemptPlaceBomb: attemptPlaceBomb,
        bombExploded: bombExploded,
        update: update,
        increaseBombCount: increaseBombCount,
        increaseBombPower: increaseBombPower,
        unlockIceTrap: unlockIceTrap,
        setDead: setDead,
        setFrozen: setFrozen,
        getDead: getDead,
        getFrozen: getFrozen,
        getStats: getStats
    };
};
