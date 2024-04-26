// this is the wall module
// handles all kinds of walls, including breakable or non breakable
//again, it should be similar to Gem modules in lab4

// This function defines the Items module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the item
// - `y` - The initial y position of the item
const Wall = function(ctx, x, y) {

    // This is the sprite sequences of all types of walls
    const sequences = {
        breakable:      { x: 192, y:  0, width: 16, height: 16, count: 4, timing: 200, loop: true },
        nonBreakable:    { x: 192, y: 16, width: 16, height: 16, count: 4, timing: 200, loop: true },
    };

    // This is the sprite object of the wall created from the Sprite module.
    const sprite = Sprite(ctx, x, y);

    // The sprite object is configured for the wall sprite here.
    sprite.setSequence(sequences[color])
          .setScale(2)
          .setShadowScale({ x: 0.75, y: 0.2 })
          .useSheet("object_sprites.png");

    // This is the birth time of the wall for finding its age.
    let birthTime = performance.now();

    // This function gets the age (in millisecond) of the wall.
    // - `now` - The current timestamp
    const getAge = function(now) {
        return now - birthTime;
    };

    //TODO: should have a function to handle when the breakable wall is destroyed, 
    // it have probability to have an item (item.js)

    // The methods are returned as an object here.
    return {
        getXY: sprite.getXY,
        setXY: sprite.setXY,
        getAge: getAge,
        getBoundingBox: sprite.getBoundingBox,
        draw: sprite.draw,
        update: sprite.update
    };
};