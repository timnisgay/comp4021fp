//this is the game module
//it should handle the doFrame thing of the game
// similar to the script in gem_rush.html in lab4
const game = (function() {

    const start = function () {
        //some initialisation
        const totalGameTime = 20;   // Total game time in seconds
        const gemMaxAge = 3000;     // The maximum age of the gems in milliseconds
        let gameStartTime = 0;      // The timestamp when the game starts
        let collectedGems = 0;      // The number of gems collected in the game

        /* Create the game area */
        const gameArea = BoundingBox(context, 165, 60, 420, 800);

        /* Create the sprites in the game */
        const player = Player(context, 427, 240, gameArea); // The player
        const gem = Gem(context, 427, 350, "green");        // The gem
        const corners = gameArea.getPoints();
        const fires = [
            Fire(context, corners.topLeft[0], corners.topLeft[1]),
            Fire(context, corners.topRight[0], corners.topRight[1]),
            Fire(context, corners.bottomLeft[0], corners.bottomLeft[1]),
            Fire(context, corners.bottomRight[0], corners.bottomRight[1]),
        ];

        // do frame
        function doFrame(now) {
            if (gameStartTime == 0) gameStartTime = now;

            /* Update the time remaining */
            const gameTimeSoFar = now - gameStartTime;
            const timeRemaining = Math.ceil((totalGameTime * 1000 - gameTimeSoFar) / 1000);
            $("#time-remaining").text(timeRemaining);

            /* Handle the game over situation here */
            if (timeRemaining <= 0) {
                sounds.background.pause();
                sounds.collect.pause();
                sounds.gameover.play();
                $("#final-gems").text(collectedGems);
                $("#game-over").show();
                return;
            }

            /* Update the sprites */
            gem.update(now);
            player.update(now);
            for (let i = 0; i < fires.length; i++) {
                fires[i].update(now);
            }

            /* Randomize the gem and collect the gem here */
            if(gem.getAge(now) >= gemMaxAge) {
                gem.randomize(gameArea);
            }

            const {x,y} = gem.getXY();
            if (player.getBoundingBox().isPointInBox(x, y)) {
                sounds.collect.pause();
                sounds.collect.currentTime = 0;
                sounds.collect.play();
                collectedGems++;
                gem.randomize(gameArea);
            }

            /* Clear the screen */
            context.clearRect(0, 0, cv.width, cv.height);

            /* Draw the sprites */
            gem.draw();
            player.draw();
            for (let i = 0; i < fires.length; i++) {
                fires[i].draw(now);
            }

            /* Process the next frame */
            requestAnimationFrame(doFrame);
        }

        //handle movement
        $(document).on("keydown", function(event) {
            /* Handle the key down */
            switch (event.keyCode) {
                case 37: player.move(1); break;
                case 38: player.move(2); break;
                case 39: player.move(3); break;
                case 40: player.move(4); break;
                case 32: player.speedUp(); break;
                default: break;
            }

        });

        $(document).on("keyup", function(event) {
            /* Handle the key up */
            switch (event.keyCode) {
                case 37: player.stop(1); break;
                case 38: player.stop(2); break;
                case 39: player.stop(3); break;
                case 40: player.stop(4); break;
                case 32: player.slowDown(); break;
                default: break;
            }

        });


        //start the game
        requestAnimationFrame(doFrame);
    }

    return { start };
})();