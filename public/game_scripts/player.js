const playableAreaX = 23;
const playableAreaY = 14;

// when the word "grid" is used, it is referring to the playable area, which is of the size: playableAreaX by playableAreaY

//ctx - context
//cx, cy - the board coord of where the player spawns at (not the canvas coord, nor the sprite coord)
//playerSpriteID - 0, 1, 2 or 3, diff num will use diff sprite
//userID - not yet implemented, reserved for webSocket related stuff
const Player = function(ctx, gridCoord, playerSpriteID, userID) {

    var playerCoord = gridCoord;

    // 0 - up, 1 - left, 2 - down, 3 - right
    // countLookUpArray exist because there are only 3 frames for up and down but 4 for left and right
    var lastDirection = 2;
    const countLookUpArray = [3, 4, 3, 4];

    const spriteCoord = getPlayerSpriteCoord(playerSpriteID, 2);
    const sprite = Sprite(ctx);

    sprite.useSheet("assets/sprite.png");
    sprite.setCount(countLookUpArray[2]);
    sprite.setXY(spriteCoord);
    sprite.setCXY(localToCanvasCoord(gridCoord));
    sprite.draw();

    // this will move the player on the grid coord
    const movePlayer = function(movex, movey) {

        // clamp the final coord back within the playable area
        var newX = Math.min(Math.max(playerCoord[0] + movex, 0), playableAreaX - 1);
        var newY = Math.min(Math.max(playerCoord[1] + movey, 0), playableAreaY - 1);

        playerCoord = [newX, newY];

        // determine where the player is facing after the move
        // it basically explodes if somehow the player is moving diagonally (could it be someone cheating with console :thonk:)
        // when i said explode, it is more like giving back the wrong direction, nothing is exploding today
        var moveDirection;

        if(movex > 0) moveDirection = 3;
        else if(movex < 0) moveDirection = 1;
        else if(movey > 0) moveDirection = 2;
        else moveDirection = 0;

        if(lastDirection == moveDirection) {
            sprite.update();
        }
        else {
            lastDirection = moveDirection;
            sprite.setCount(countLookUpArray[moveDirection]);
            sprite.setXY(getPlayerSpriteCoord(playerSpriteID, moveDirection));
        }

        sprite.setCXY(localToCanvasCoord([newX, newY]));
        sprite.draw();
    }

    // return the player grid coord
    const getPlayerGridPos = function() {
        return playerCoord;
    }

    return {
        movePlayer: movePlayer,
        getPlayerGridPos: getPlayerGridPos
    };

}

// enter the player sprite ID (0 to 3), and direction (0 to 3)
// returns the x and y coord of the respective sprite (in terms of sprite coord of coz)
function getPlayerSpriteCoord(playerSpriteID, direction) {
    // bad naming convention...
    // basically just mapping functions, nothing crazy here
    const playerDirectionToSpriteXY = [7, 10, 0, 3];
    return [playerDirectionToSpriteXY[direction] * 16, (playerSpriteID + 14) * 16];
}

function localToCanvasCoord(localCoord) {
    return [localCoord[0] * 50 + 50, localCoord[1] * 50 + 50];
}