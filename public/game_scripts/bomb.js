// this is the bomb/iceTrap module
// it works similar to Gem module in lab 4

// This function defines the Bomb/IceTrap module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the bomb
// - `y` - The initial y position of the bomb
const Bomb = function(ctx, x, y) {

    // This is the sprite sequences of the normal 
    const sequences = {
        normal:  { x: 192, y:  0, width: 16, height: 16, count: 4, timing: 200, loop: true },
        ice:    { x: 192, y: 16, width: 16, height: 16, count: 4, timing: 200, loop: true },
    };

    // This is the sprite object of the bomb created from the Sprite module.
    const sprite = Sprite(ctx, x, y);

    // The sprite object is configured for the gem sprite here.
    sprite.setSequence(sequences[color])
          .setScale(2)
          .setShadowScale({ x: 0.75, y: 0.2 })
          .useSheet("sprites.png");

    // This is the birth time of the gem for finding its age.
    let birthTime = performance.now();

    // This function gets the age (in millisecond) of the gem.
    // - `now` - The current timestamp
    const getAge = function(now) {
        return now - birthTime;
    };

    // This function randomizes the gem colour and position.
    // - `area` - The area that the gem should be located in.
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
        getBoundingBox: sprite.getBoundingBox,
        randomize: randomize,
        draw: sprite.draw,
        update: sprite.update
    };
};