// This function defines the Player module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the player
// - `y` - The initial y position of the player
// - `gameArea` - The bounding box of the game area
const Player = function(ctx, x, y, sequence) {

    //player stats
    let stats = {
        numBomb: 1, //highest limit is
        numIceTrap: 1, //highest limit is 
        AttackRadius: 1, //bomb and ice trap share same level, bombradius 1 means is 5*5 cross, icetrap is 3*3 rectangle
    };

    // This is the sprite object of the player created from the Sprite module.
    const sprite = Sprite(ctx, x, y);

    // The sprite object is configured for the player sprite here.
    sprite.setSequence(sequence.moveDown)
          .setShadowScale({ x: 0.75, y: 0.20 })
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

    /*
    // This function speeds up the player.
    const speedUp = function() {
        speed = 250;
    };

    // This function slows down the player.
    const slowDown = function() {
        speed = 150;
    };*/

    // This function updates the player depending on his movement.
    // - `time` - The timestamp when this function is called
    const update = function(time) {
        // Update the player if the player is moving
        if (direction != 0) {
            let { x, y } = sprite.getXY();

            // Move the player
            switch (direction) {
                case 1: x -= speed / 20; break;
                case 2: y -= speed / 20; break;
                case 3: x += speed / 20; break;
                case 4: y += speed / 20; break;
            }

            if (running) 
            {
                sprite.setXY(x, y)
                      .update(time);
            }
        }
    };

    // The methods are returned as an object here.
    return {
        move: move,
        stop: stop,
        //speedUp: speedUp,
        //slowDown: slowDown,
        //getBoundingBox: sprite.getBoundingBox,
        draw: sprite.draw,
        update: update
    };
};
