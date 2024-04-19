// This function defines a Sprite module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the sprite
// - `y` - The initial y position of the sprite
const Sprite = function(ctx) {

    // This is the image object for the sprite sheet.
    const sheet = new Image();

    // This is an object containing the sprite sequence information used by the sprite containing:
    // - `x` - The starting x position of the sprite sequence in the sprite sheet
    // - `y` - The starting y position of the sprite sequence in the sprite sheet
    // - `width` - The width of each sprite image
    // - `height` - The height of each sprite image
    // - `count` - The total number of sprite images in the sequence
    // - `timing` - The timing for each sprite image
    // - `loop` - `true` if the sprite sequence is looped
    let sequence = {width: 16, height: 16, count: 1, timing: 0, loop: true };
    var spriteCoord = [0, 0];
    var canvasCoord = [0, 0];

    // This is the index indicating the current sprite image used in the sprite sequence.
    let index = 0;

    // This is the scaling factor to determine the size of the shadow, relative to the scaled sprite image size.
    // - `x` - The x scaling factor
    // - `y` - The y scaling factor
    let shadowScale = { x: 1, y: 0.25 };

    // This function uses a new sprite sheet in the image object.
    // - `spriteSheet` - The source of the sprite sheet (URL)
    const useSheet = function(spriteSheet) {
        sheet.src = spriteSheet;
        return this;
    };

    // This function returns the readiness of the sprite sheet image.
    const isReady = function() {
        return sheet.complete && sheet.naturalHeight != 0;
    };

    // This function sets the sprite position in the sprite sheet.
    // - `xvalue` - The new x position
    // - `yvalue` - The new y position
    const setXY = function(xyvalue) {
        spriteCoord = [xyvalue[0], xyvalue[1]];
        return this;
    };

    // This function sets the sprite position on the canvas.
    // - `xvalue` - The new x position
    // - `yvalue` - The new y position
    const setCXY = function(xyvalue) {
        canvasCoord = [xyvalue[0], xyvalue[1]];
        return this;
    };

    // This function sets the sprite sequence.
    // - `newSequence` - The new sprite sequence to be used by the sprite
    const setSequence = function(newSequence) {
        sequence = newSequence;
        index = 0;
        return this;
    };

    const setCount = function(newCount) {
        sequence.count = newCount;
        index = 0;
        return this;
    }

    // This function sets the scaling factor of the sprite.
    // - `value` - The new scaling factor
    const setScale = function(value) {
        scale = value;
        return this;
    };

    // This function sets the scaling factor of the sprite shadow.
    // - `value` - The new scaling factor as an object
    //   - `value.x` - The x scaling factor
    //   - `value.y` - The y scaling factor
    const setShadowScale = function(value) {
        shadowScale = value;
        return this;
    };

    // This function draws shadow underneath the sprite.
    const drawShadow = function() {
        /* Save the settings */
        ctx.save();

        /* Find the scaled width and height of the shadow */
        const shadowWidth  = 50 * shadowScale.x;
        const shadowHeight = 50 * shadowScale.y;

        /* Draw a semi-transparent oval */
        ctx.fillStyle = "black";
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.ellipse(canvasCoord[0] + 25, canvasCoord[1] + 40, shadowWidth / 2, shadowHeight / 2, 0, 0, 2 * Math.PI);
        ctx.fill();

        /* Restore saved settings */
        ctx.restore();
    };

    // This function draws the sprite.
    const drawSprite = function() {
        /* Save the settings */
        ctx.save();

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
            sheet,
            spriteCoord[0] + sequence.width * index, spriteCoord[1],
            sequence.width, sequence.height,
            canvasCoord[0], canvasCoord[1],
            50, 50
        )

        /* Restore saved settings */
        ctx.restore();
    };
     
    // This function draws the shadow and the sprite.
    const draw = function() {
        if (isReady()) {
            drawShadow();
            drawSprite();
        }
        return this;
    };

    // this function is not the same one in lab4
    // update timing will be handled where else
    const update = function() {
        if (++index >= sequence.count) {
            index = (sequence.loop ? 0 : index - 1)
        };
        return this;
    };

    // The methods are returned as an object here.
    return {
        useSheet: useSheet,
        setXY: setXY,
        setCXY: setCXY,
        setCount: setCount,
        setSequence: setSequence,
        setScale: setScale,
        setShadowScale: setShadowScale,
        isReady: isReady,
        draw: draw,
        update: update
    };
};
