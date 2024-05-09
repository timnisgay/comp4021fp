const Sound = (function() {

    // object for sound source
    const sounds = {
        background: new Audio("assets/background.mp3"),
        collect: new Audio("assets/collect.mp3"),
        gameover: new Audio("assets/gameover.mp3"),
        explosion: new Audio("assets/explosion.mp3"),
        ice: new Audio("assets/iceEffect.mp3")
    };

    // start bgm, this will stop and replay any ongoing bgm (if there are any)
    const startBgm = function(){
        sounds.background.currentTime = 0;
        sounds.background.loop = true;
        sounds.background.play();
    }

    // stop bgm, this is not pause, the bgm will play from beginning again if .play() is called
    const stopBgm = function(){
        sounds.background.currentTime = 0;
        sounds.background.pause();
    }

    // stops any ongoing collect audio, and start playing a new one
    const collectPowerUpSound = function(){
        sounds.collect.currentTime = 0;
        sounds.collect.play();
    }

    // explosionType: 0 - Bomb, 1 - Ice
    const explosionSound = function(explosionType){
        if(explosionType == 0) {
            sounds.explosion.currentTime = 0;
            sounds.explosion.play();
        }
        else if (explosionType == 1){
            sounds.ice.currentTime = 0;
            sounds.ice.play();
        }
    }

    // stops all other sound tracks, start playing the gameover sound
    const gameoverSound = function(){

        // pausing all other soundtracks, when new audio are added, add the lines here too to pause them
        sounds.background.pause();
        sounds.collect.pause();
        sounds.explosion.pause();
        sounds.ice.pause();

        // starts playing the gameover sound track
        sounds.gameover.currentTime = 0;
        sounds.gameover.play();
    }

    // stops any ongoing gameover audio, and start playing a new one
    const stopGameoverSound = function(){
        sounds.gameover.currentTime = 0;
        sounds.gameover.pause();
    }
    
    return {startBgm, stopBgm, collectPowerUpSound, gameoverSound, stopGameoverSound, explosionSound};
})();
