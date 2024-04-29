//sorry I dont know how to call this module
//this module handles the increase power tool things
//for example, increase attack radius, increase number of placeable bombs and increase number of placeable ice trap
//again, it works similar to Gems module in lab4


// This function defines the Items module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the item
// - `y` - The initial y position of the item
const Item = function(ctx, x, y) {

    // This is the sprite sequences of all items
    const sequences = {
        increaseAttackRadius:  { x: 192, y:  0, width: 16, height: 16, count: 4, timing: 200, loop: true },
        increaseNumBomb:    { x: 192, y: 16, width: 16, height: 16, count: 4, timing: 200, loop: true },
        increaseNumIceTrap: { x: 192, y: 32, width: 16, height: 16, count: 4, timing: 200, loop: true },
    };

    // This is the sprite object of the item created from the Sprite module.
    const sprite = Sprite(ctx, x, y);

    // The sprite object is configured for the item sprite here.
    sprite.setSequence(sequences[color])
          .setScale(2)
          .setShadowScale({ x: 0.75, y: 0.2 })
          .useSheet("object_sprites.png");

    // This is the birth time of the item for finding its age.
    let birthTime = performance.now();

    // This function gets the age (in millisecond) of the item.
    // - `now` - The current timestamp
    const getAge = function(now) {
        return now - birthTime;
    };

    // This function randomizes the item position?
    // - `area` - The area that the item should be located in.
    const randomize = function(area) {
        /* Randomize the position */
        const {x, y} = area.randomPoint();
        sprite.setXY(x, y);
    };

    // The methods are returned as an object here.
    return {
        getXY: sprite.getXY,
        setXY: sprite.setXY,
        getAge: getAge,
        randomize: randomize,
        draw: sprite.draw,
        update: sprite.update
    };
};
