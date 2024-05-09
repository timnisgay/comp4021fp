const FrontPage = (function() {
    // This function initializes the UI
    const initialize = function() {        
        // Hide
        $("#front-page").hide();
        $("#register-form").hide();

        // Submit event for the signin form
        $("#signin-form").on("submit", (e) => {
            // Do not submit the form
            e.preventDefault();

            // Get the input fields
            const username = $("#signin-username").val().trim();
            const password = $("#signin-password").val().trim();

            // Send a signin request
            Authentication.signin(username, password,
                () => {
                    hide();
                    LobbyPage.show();

                    Socket.connect();
                },
                (error) => { $("#signin-message").text(error); }
            );
        });

        // Submit event for the register form
        $("#register-form").on("submit", (e) => {
            // Do not submit the form
            e.preventDefault();

            // Get the input fields
            const username = $("#register-username").val().trim();
            const password = $("#register-password").val().trim();
            const confirmPassword = $("#register-confirm").val().trim();

            // Password and confirmation does not match
            if (password != confirmPassword) {
                $("#register-message").text("Passwords do not match.");
                return;
            }

            // Send a register request
            Registration.register(username, password,
                () => {
                    $("#register-form").get(0).reset();
                    $("#register-message").text("You can sign in now.");
                },
                (error) => { $("#register-message").text(error); }
            );
        });

        // Click event for "New User" button in signin form
        $("#signin-new-user").on("click", (e) => {
            $("#signin-form").hide();
            $("#register-form").show();
        });

        // Click event for "Cancel" button in register form
        $("#register-cancel").on("click", (e) => {
            $("#register-form").hide();
            $("#signin-form").show();
        });

        // Click event for instruction button
        $("#button-to-instruction").on("click", (e) => {
            InstructionPage.show();
        });
    };

    // This function shows the form
    const show = function() {
        $("#front-page").show();
    };

    // This function hides the form
    const hide = function() {
        $("#signin-form").get(0).reset();
        $("#signin-message").text("");
        $("#register-message").text("");
        $("#front-page").hide();
    };

    return { initialize, show, hide };
})();

const InstructionPage = (function() {
    // This function initializes the UI
    const initialize = function() {        
        // Hide
        hide();

        // Click event for instruction-home button
        $("#instruction-home").on("click", (e) => {
            hide();
            FrontPage.show();
        });
    };

    // This function shows the form
    const show = function() {
        $("#instruction-page").show();
    };

    // This function hides the form
    const hide = function() {
        $("#instruction-page").hide();
    };

    return { initialize, show, hide };
})();

const LobbyPage = (function() {
    // This function initializes the UI
    const initialize = function() {
        // Hide it
        update([-1, -1, -1, -1]);
        $("#lobby-page").hide();

        // Click event for the signout button
        $("#lobby-logout").on("click", () => {
            // Send a signout request
            Authentication.signout(
                () => {
                    Socket.disconnect();

                    hide();
                    FrontPage.show();
                }
            );
        });

        $("#lobby-join-game").on("click", () => {
            Socket.getMap();
        });
    };

    // This function shows the form with the user
    const show = function() {
        $("#lobby-page").show();
    };

    // This function hides the form
    const hide = function() {
        $("#lobby-page").hide();
    };

    // This function updates the players area
    const update = function(players) {
        const playerArrayArea = $("#lobby-players-list");

        playerArrayArea.empty();
        console.log(players);

        for (let i = 0; i < players.length; i++) {
            if (players[i] != -1) {
                playerArrayArea.append(
                    $("<div id='player-" + players[i] + "'></div>")
                    .append(players[i])
                );
            } else {
                playerArrayArea.append(
                    $("<div id='player-" + i + "'>waiting for new players...</div>")
                );
            }
        }
    };

    // This function updates the best stats area
    const updateBestStats = function(stats) {
        const lobbySelfStats = $("#lobby-self-stats");

        lobbySelfStats.empty();
        console.log(stats);

        for (const stat in stats) {
            if (stats[stat] != null) {
                if (stat == "bestGameTime") {
                    const minutes = Math.floor(stats[stat] / 60000);
                    const seconds = Math.floor((stats[stat] % 60000) / 1000);
                    const milliseconds = Math.floor(stats[stat] % 1000);

                    const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(milliseconds).padStart(3, '0')}`;

                    console.log(formattedTime);

                    lobbySelfStats.append(
                        $("<div id='lobby-stats-" + stat + "' class='row lobby-stats-box'></div>")
                            .append($("<div id='lobby-stats-title'>"+ stat +"</div>"))
                            .append($("<div id='lobby-stats-content'>"+ formattedTime +"</div>"))
                    );
                } else {
                    lobbySelfStats.append(
                        $("<div id='lobby-stats-" + stat + "' class='row lobby-stats-box'></div>")
                            .append($("<div id='lobby-stats-title'>"+ stat +"</div>"))
                            .append($("<div id='lobby-stats-content'>"+ stats[stat] +"</div>"))
                    );
                }
                
            } else {
                lobbySelfStats.append(
                    $("<div id='lobby-stats-" + stat + "' class='row lobby-stats-box'></div>")
                        .append($("<div id='lobby-stats-title'>"+ stat +"</div>"))
                        .append($("<div id='lobby-stats-content'>--</div>"))
                );
            }
        }
    };

    return { initialize, show, hide, update, updateBestStats };
})();

const GamePlayPage = (function() {
    // This function initializes the UI
    const initialize = function() {
        // Hide it
        $("#game-play-page").hide();
        // didnt use jquery here because couldnt make it work, if can change then change
        document.getElementById("main-playground").addEventListener("keydown", function(e) {
            Playground.keyDownHandler(e);
        })
        document.getElementById("main-playground").addEventListener("keyup", function(e) {
            Playground.keyUpHandler(e);
        })
    };

    // This function shows the form with the user
    const show = function() {
        $("#game-play-page").show();
    };

    // This function hides the form
    const hide = function() {
        $("#game-play-page").hide();
    };

    // This function updates the user stats
    // not used now and seperated in player.js
    const updatePlayerStats = function(userStats) {
        console.log(userStats);

        $("#player-num-bomb").text("1");
        $("#player-num-ice-trap").text("1");
        $("#player-attack-radius").text("1");
    };

    // This function update the player info in right panel
    const updatePlayerInfo = function(user) {
        console.log(user);

        $("#player-info").html("<p>" + user.username + "</p>");
    };

    // This function updates the game duration
    // it should be called every 1 second
    const updateGameTime = function(time) {
        //change the format of time from seconds to mm:ss
        let minute = Math.floor(time / 60);
        let second = Math.floor(time % 60).toString().padStart(2, '0');

        console.log(minute +" : "+ second);
        $("#game-play-time").html("<p>" + minute + " : " + second + "</p>");
    };

    return { initialize, show, hide, updatePlayerStats, updatePlayerInfo, updateGameTime };
})();

const GameEndPage = (function() {
    // This function initializes the UI
    const initialize = function() {
        // Hide it
        $("#game-end-page").hide();

        // Click event for the return to lobby button
        $("#return-to-lobby").on("click", () => {
            Socket.getBestGameStats();
            Socket.getPlayers();
            Sound.stopGameoverSound();
            hide();
            LobbyPage.show();
        });

        // Click event for the logout button
        $("#game-end-logout").on("click", () => {
            // Send a signout request
            Authentication.signout(
                () => {
                    Socket.disconnect();
                    Sound.stopGameoverSound();
                    hide();
                    FrontPage.show();
                }
            );
        });
    };

    // This function shows the form with the user
    const show = function() {
        $("#game-end-page").show();
    };

    // This function hides the form
    const hide = function() {
        $("#game-end-page").hide();
    };

    // update the player stats
    const update = function(playerStats) {
        const sortedPlayerStats = Object.fromEntries(
            Object.entries(playerStats).sort((a, b) => {
                if (a[1].timeDied === null && b[1].timeDied === null) {
                    return 0; // No change in order when both timeDied are null
                  } else if (a[1].timeDied === null) {
                    return 1; // b comes first when a.timeDied is null
                  } else if (b[1].timeDied === null) {
                    return -1; // a comes first when b.timeDied is null
                  } else {
                    return b[1].timeDied - a[1].timeDied; // Sort by timeDied in descending order
                  }
            })
        );
        console.log(sortedPlayerStats);

        const currentGameStats = $("#current-game-stats");
        currentGameStats.empty();

        let counter = 0;
        for (const player in sortedPlayerStats) {
            if (sortedPlayerStats.hasOwnProperty(player)) {
                const playerData = sortedPlayerStats[player];
    
                const statsBox = $("<div id='current-game-stats-" + player + "' class='game-stats-box'></div>");
                const statsBoxContent = $("<div class='col current-game-stats-box'></div>");
                
                let rankingPhrase;
                switch(counter) {
                    case 0: rankingPhrase = "Winner"; break;
                    case 1: rankingPhrase = "1st runner up"; break;
                    case 2: rankingPhrase = "2nd runner up"; break;
                    case 3: rankingPhrase = "4th place"; break;
                    default: rankingPhrase = ""; break;
                }

                statsBoxContent.append(
                    $("<div class='current-game-stats-title'>" + rankingPhrase + "</div><br>")
                ).append(
                    $("<span style='font-weight: bold;'>Player " + (playerData["playerID"] + 1) + ": "+ player +"</span><br>")
                );

                if(playerData["message"] === "disconnected") {
                    statsBoxContent.append(
                        $("<span style='font-weight: bold;'>Player " + 
                        (playerData["playerID"] + 1) + 
                        " is disconnected in the middle of the game.<br>Will not show game statistics.</span><br>")
                    );
                } else {
                    for (const key in playerData) {
                        if (playerData.hasOwnProperty(key)) {
                            const value = playerData[key];
                            console.log(value);
                            switch (key) {
                                case "timeDied":
                                    const minutes = Math.floor(value / 60000);
                                    const seconds = Math.floor((value % 60000) / 1000);
                                    const milliseconds = Math.floor(value % 1000);
    
                                    const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(milliseconds).padStart(3, '0')}`;
    
                                    console.log(formattedTime);
                                    const timeElement = $("<span class='game-stats-line'></span>").text("Survival Time: " + formattedTime);
                                    statsBoxContent.append(timeElement).append($("<br>"));
                                    break;
                                case "numBomb":
                                    const numBombElement = $("<span class='game-stats-line'></span>").text("No. of Bomb Placed: " + value);
                                    statsBoxContent.append(numBombElement).append($("<br>"));
                                    break;
                                case "numIceTrap":
                                    const numIceTrapElement = $("<span class='game-stats-line'></span>").text("No. of Ice Trap Placed: " + value);
                                    statsBoxContent.append(numIceTrapElement).append($("<br>"));
                                    break;
                                case "maxBomb":
                                    const maxBombElement = $("<span class='game-stats-line'></span>").text("Max Placeable Bomb: " + value);
                                    statsBoxContent.append(maxBombElement).append($("<br>"));
                                    break;
                                case "maxIce":
                                    const maxIceElement = $("<span class='game-stats-line'></span>").text("Max Placeable Ice Trap: " + value);
                                    statsBoxContent.append(maxIceElement).append($("<br>"));
                                    break;
                                case "attackRadius":
                                    const attackRadiusElement = $("<span class='game-stats-line'></span>").text("Attack Radius Level: " + value);
                                    statsBoxContent.append(attackRadiusElement);
                                    break;
                                case "playerID":
                                default:
                                    // const keyValueElement = $("<span></span><br>").text(key + ": " + value);
                                    // statsBoxContent.append(keyValueElement);
                                    break;
                            }
                            
                        }
                    }
                }
    
                statsBox.append(statsBoxContent);
                currentGameStats.append(statsBox);
                counter++;
            }
        }
    };

    return { initialize, show, hide, update };
})();

const UI = (function() {
    // This function gets the user display
    const getUserDisplay = function(user) {
        return $("<div class='field-content row shadow'></div>")
            .append($("<span class='user-name'>" + user.name + "</span>"));
    };

    // The components of the UI are put here
    const components = [FrontPage, InstructionPage, LobbyPage, GamePlayPage, GameEndPage];

    // This function initializes the UI
    const initialize = function() {
        // Initialize the components
        for (const component of components) {
            component.initialize();
        }
    };

    return { getUserDisplay, initialize };
})();
