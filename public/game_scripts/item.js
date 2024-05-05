//sorry I dont know how to call this module
//this module handles the increase power tool things
//for example, increase attack radius, increase number of placeable bombs and increase number of placeable ice trap
//again, it works similar to Gems module in lab4


// This function defines the Items module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the item
// - `y` - The initial y position of the item
const Item = function(ctx, itemInfo, itemCoord) {

    // This is the sprite sequences of all items
    const sequences = {
        bombCount:  { x: 160, y: 208, width: 16, height: 16, count: 1, timing: 200, loop: false },
        bombPower:    { x: 192, y: 208, width: 16, height: 16, count: 1, timing: 200, loop: false },
        iceCount: { x: 176, y: 208, width: 16, height: 16, count: 1, timing: 200, loop: false },
    };

    const {x, y} = itemCoord;
    const {powerUp, itemID} = itemInfo;

    // This is the sprite object of the item created from the Sprite module.
    const sprite = Sprite(ctx, x * 50 + 25, y * 50 + 25);

    sprite.setSequence(sequences[powerUp])
          .useSheet("assets/sprite.png");
        
    const getID = function() {
        return itemID;
    }

    const getCoord = function() {
        return {x, y};
    }

    const getPower = function() {
        return powerUp;
    }

    const getEverything = function() {
        return {itemInfo, itemCoord};
    }
    

    // The methods are returned as an object here.
    return {
        getXY: sprite.getXY,
        setXY: sprite.setXY,
        getID: getID,
        getCoord: getCoord,
        getPower: getPower,
        getEverything: getEverything,
        draw: sprite.draw
    };
};
