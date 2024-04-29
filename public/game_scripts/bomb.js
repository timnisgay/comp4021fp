// this is the bomb/iceTrap module
// it works similar to Gem module in lab 4

// This function defines the Bomb/IceTrap module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the bomb
// - `y` - The initial y position of the bomb
const Bomb = function(ctx, bombInfo, bombCoord) {

    const {bombType, bombPower, bombID, bombOwner} = bombInfo;
    const {x, y} = bombCoord;

    // This is the sprite sequences of the normal 
    const sequences = {
        normal:  { x: 64, y:  288, width: 16, height: 16, count: 6, timing: 400, loop: false },
        ice:    { x: 192, y: 16, width: 16, height: 16, count: 4, timing: 200, loop: true },
    };

    const bombIndexToName = ["normal", "ice"];

    // coord transformed from grid back to canvas
    const sprite = Sprite(ctx, x * 50 + 25, y * 50 + 25);

    // The sprite object is configured for the gem sprite here.
    sprite.setSequence(sequences[bombIndexToName[bombType]])
          .useSheet("assets/sprite.png");

    const getID = function() {
        return bombID;
    }

    const getOwner = function() {
        return bombOwner;
    }

    const getPower = function() {
        return bombPower;
    }

    const getGridXY = function() {
        return {x, y};
    }

    // The methods are returned as an object here.
    return {
        getID: getID,
        getOwner: getOwner,
        getPower: getPower,
        getGridXY: getGridXY,
        getXY: sprite.getXY,
        setXY: sprite.setXY,
        draw: sprite.draw,
        update: sprite.update
    };
};