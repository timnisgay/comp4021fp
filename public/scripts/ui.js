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
            $("#instruction-page").show();
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

        // TODO: actual handle all related sockets
        $("#lobby-join-game").on("click", () => {
            // moved socket.joinGame into playground, so the sprite is always loaded first
            initPlayground();
        });

        $("#debug-join-game").on("click", () => {
            initPlayground();
            $("#lobby-page").hide();
            $("#game-play-page").show();
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

    return { initialize, show, hide, update };
})();

const GamePlayPage = (function() {
    // This function initializes the UI
    const initialize = function() {
        // Hide it
        $("#game-play-page").hide();

        //TODO
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

const UI = (function() {
    // This function gets the user display
    const getUserDisplay = function(user) {
        return $("<div class='field-content row shadow'></div>")
            .append($("<span class='user-name'>" + user.name + "</span>"));
    };

    // The components of the UI are put here
    const components = [FrontPage, LobbyPage, GamePlayPage];

    // This function initializes the UI
    const initialize = function() {
        // Initialize the components
        for (const component of components) {
            component.initialize();
        }
    };

    return { getUserDisplay, initialize };
})();
