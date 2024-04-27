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
            if (stats[stat] != -1) {
                lobbySelfStats.append(
                    $("<div id='lobby-stats-" + stat + "' class='row lobby-stats-box'></div>")
                        .append($("<div id='lobby-stats-title'>"+ stat +"</div>"))
                        .append($("<div id='lobby-stats-content'>"+ stats[stat] +"</div>"))
                );
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
    const update = function(user) {
        //TODO
    };

    return { initialize, show, hide, update };
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
            hide();
            LobbyPage.show();
        });

        // Click event for the logout button
        $("#game-end-logout").on("click", () => {
            // Send a signout request
            Authentication.signout(
                () => {
                    Socket.disconnect();

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

    return { initialize, show, hide };
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
