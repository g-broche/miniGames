"use strict"

/* ***** global objects and variables ***** */


/* ***** area on which the pong game is displayed and its related methods ***** */
const GameWindow = {
    elem: document.getElementById("pongGameWindow"),
    width: document.getElementById("pongGameWindow").offsetWidth,
    height: document.getElementById("pongGameWindow").offsetHeight,
};


GameWindow.calculateNewArenaSize = function () {
    this.width = this.elem.offsetWidth;
    this.height = this.elem.offsetHeight;
};

window.addEventListener("resize", initializeAllElements);

/* ***** Global variables ***** */
const pointsToWin = 5;
const barMoveIncrementPercent = 2;
let barMovementValue = GameWindow.height / 300 * barMoveIncrementPercent;
let defaultBarHeight = GameWindow.height / 8;
let minBarHeight = GameWindow.height / 15;
let defaultBarWidth = GameWindow.width / 50;
let speedRatio = 400;

//game booleans
let isInitialTurn = true;
let roundEnded = false;
let isPaused = false;
let gameEnded = false;

//id of current animation frame
let requestAnimationId;


/* ***** Modal window and overlay use to end the match and show the winner and their related methods ***** */

const ModalMenu = {
    window: document.getElementById("modalWrapper"),
    buttonClose: document.getElementById("closeWindow"),
    buttonRestart: document.getElementById("buttonStartNewMatch"),
    title: document.getElementById("winnerTitle"),
    msg: document.getElementById("MatchEndMsg")
};

//display or hide modal window and its content
ModalMenu.toggleVisibility = function (mustDisplay) {
    if (mustDisplay) {
        this.window.classList.add("flex");
        this.window.classList.remove("hide");
    } else {
        this.window.classList.add("hide");
        this.window.classList.remove("flex");
    }
}

//fill the title and span featured of the modal window based on winner and score
ModalMenu.fillWinnerFields = function (isPlayer1Winner) {
    ;
    this.title.textContent = (isPlayer1Winner ? "Player 1 has won the match!" : "Player 2 has won the match!")
    let msgContent = (isPlayer1Winner ? ("The final score is " + Score.player1Points + " to " + Score.player2Points + " in favor of player 1") : ("the final score is " + Score.player2Points + " to " + Score.player1Points + " in favor of player 2"));
    this.msg.textContent = msgContent;
}

//display or hide the modal background blur overlay
const ModalOverlay = document.getElementById("modalOverlay");
ModalOverlay.toggleVisibility = function (mustDisplay) {
    (mustDisplay ? this.classList.remove("hide") : this.classList.add("hide"));
}

//event listeners to close the modal overlay and restart a match
ModalMenu.buttonRestart.addEventListener("click", restart);
ModalMenu.buttonClose.addEventListener("click", restart);
ModalOverlay.addEventListener("click", restart);

/* ***** Creating object Score which handles the score of each player and the related methods ***** */
const Score = {
    player1Field: document.getElementById("scorePlayer1"),
    player1Points: 0,
    player2Field: document.getElementById("scorePlayer2"),
    player2Points: 0,
};

//display the current score in the corresponding element
Score.display = function () {
    this.player1Field.textContent = this.player1Points;
    this.player2Field.textContent = this.player2Points;
};

// add point to score based on boolean, if true player one has won, else player 2 has won
Score.update = function (winnerBool) {
    (winnerBool ? this.player1Points++ : this.player2Points++);
    this.display();
};

//reset score
Score.reset = function () {
    this.player1Points = 0;
    this.player2Points = 0;
    this.display();
};

//check if the number of points required to end a match is reached
Score.hasMatchEnded = function () {
    gameEnded = (this.player1Points >= pointsToWin || this.player2Points >= pointsToWin)
}

Score.decideWinner = function () {
    return this.player1Points > this.player2Points
}

//end the match by enabling the modal window and overlay
Score.endMatch = function () {
    ModalMenu.fillWinnerFields(this.decideWinner());
    ModalMenu.toggleVisibility(gameEnded)
    ModalOverlay.toggleVisibility(gameEnded)
}

/* ***** CREATING BOTH BARS ***** */

//object Bar containing the methods which will be inherited by the player bars on each side
const Bar = {
    setInitialValues({ elem, width, height, defaultPositionY, topPosition }) {
        this.elem = elem;
        this.width = width;
        this.height = height;
        this.defaultPositionY = defaultPositionY;
        this.topPosition = topPosition;
    },

    resetPosition() {
        this.defaultPositionY = (GameWindow.height / 2) - (this.height / 2)
        this.topPosition = this.defaultPositionY;
        this.elem.style.top = this.defaultPositionY + "px";
    },

    fullReset() {
        this.width = GameWindow.width / 50;
        this.height = GameWindow.height / 10;
        this.elem.style.height = this.height + "px";
        this.elem.style.width = this.width + "px";
        this.defaultPositionY = (GameWindow.height / 2) - (this.height / 2);
        this.topPosition = this.defaultPositionY;
        this.elem.style.top = this.defaultPositionY + "px";
    },

    increaseHeight(value) {
        this.height = (this.height + (this.height / 100 * value) < defaultBarHeight ? this.height + (this.height / 100 * value) : defaultBarHeight);
        this.elem.style.height = this.height + "px";
        this.elem.style.width = this.width + "px";
    },

    reduceHeight(value) {
        this.height = (this.height - (this.height / 100 * value) > minBarHeight ? this.height - (this.height / 100 * value) : minBarHeight);
        this.elem.style.height = this.height + "px";
        this.elem.style.width = this.width + "px";
    },

    moveUp() {
        if (this.canMoveUp()) {
            this.move(-barMovementValue);
        } else {
            this.moveMaxHeight();
        }
    },

    moveDown() {
        if (this.canMoveDown()) {
            this.move(barMovementValue);
        } else {
            this.moveMinHeight();
        }
    },

    move(value) {
        this.topPosition += Number(value);
        this.elem.style.top = this.topPosition + "px";
    },

    canMoveUp() {
        return (this.topPosition - barMovementValue >= 0 ? true : false);
    },

    canMoveDown() {
        return (this.topPosition + this.height + barMovementValue <= GameWindow.height ? true : false);
    },

    moveMaxHeight() {
        this.topPosition = 0;
        this.elem.style.top = this.topPosition + "px";
    },

    moveMinHeight() {
        this.topPosition = GameWindow.height - this.height;
        this.elem.style.top = this.topPosition + "px";
    },
    moveCenter(positionY) {
        this.topPosition = positionY - this.height / 2;
        this.elem.style.top = this.topPosition + "px";
    },
    moveWithMouse(mouseCoordY) {
        let newY = mouseCoordY - GameWindow.elem.offsetTop;
        if (newY - this.height / 2 <= 0) {
            this.moveMaxHeight();
        } else if (newY - this.height / 2 > 0 && newY + this.height / 2 < GameWindow.height) {
            this.moveCenter(newY);
        } else {
            this.moveMinHeight();
        }
    }
}

//creating the left and right bar using the methods of Bar object
const LeftBar = Object.create(Bar);
LeftBar.setInitialValues({
    elem: document.getElementById("leftBar"),
    width: GameWindow.height / 10,
    height: GameWindow.width / 50,
    defaultPositionY: (GameWindow.height / 2) - (defaultBarHeight / 2),
    topPosition: (GameWindow.height / 2) - (defaultBarHeight / 2),
});

const RightBar = Object.create(Bar);
RightBar.setInitialValues({
    elem: document.getElementById("rightBar"),
    width: GameWindow.height / 10,
    height: GameWindow.width / 50,
    defaultPositionY: (GameWindow.height / 2) - (defaultBarHeight / 2),
    topPosition: (GameWindow.height / 2) - (defaultBarHeight / 2),
});


/* ***** BALL OBJECTS AND ITS RELATED METHODS ***** */

const Ball = {
    elem: document.querySelector("i"),
    defaultPositionY: (GameWindow.height / 2),
    defaultPositionX: (GameWindow.width / 2),
    centerY: (GameWindow.height / 2),
    centerX: (GameWindow.width / 2),
    radius: (GameWindow.width / 50),
    directionX: false,
    directionY: true,
    velocity: (GameWindow.width / speedRatio),
    velocityMultiplierX: 1,
    velocityMultiplierY: 1
};

Ball.fullReset = function () {
    this.defaultPositionY = (GameWindow.height / 2);
    this.defaultPositionX = (GameWindow.width / 2);
    this.centerY = (GameWindow.height / 2);
    this.centerX = (GameWindow.width / 2);
    this.radius = (GameWindow.width / 100);
    this.velocity = (GameWindow.width / speedRatio);
    this.velocityMultiplierX = 2;
    this.velocityMultiplierY = 1;
    this.directionX = false;
    this.elem.style.height = (this.radius * 2) + "px";
    this.elem.style.width = (this.radius * 2) + "px";
    this.elem.style.borderRadius = (this.radius * 2) + "px";
    displayBall();
};

Ball.reset = function () {
    this.centerX = this.defaultPositionX;
    this.centerY = this.defaultPositionY;
    this.velocityMultiplierX = 2;
    this.velocityMultiplierY = 1;
    displayBall();
};
Ball.toggleDirectionX = function () {
    this.directionX = (this.directionX ? false : true);
};

Ball.toggleDirectionY = function () {
    this.directionY = (this.directionY ? false : true);
};

Ball.changeSpeedMupltipliers = function (newValueX, newValueY) {
    this.velocityMultiplierX = newValueX;
    this.velocityMultiplierY = newValueY;

}

/* ***** HANDLING OF PLAYER INPUTS ***** */

//object containing the player controls, their states and the events to trigger if their pressed state is true
const actionLog = {
    "KeyW": { pressed: false, func: () => { LeftBar.moveUp() } },
    "KeyS": { pressed: false, func: () => { LeftBar.moveDown() } },
    "ArrowUp": { pressed: false, func: () => { RightBar.moveUp() } },
    "ArrowDown": { pressed: false, func: () => { RightBar.moveDown() } },
    "Space": { pressed: false, func: pauseGame },
}

//event listener for keydown, will first check if the game has to be resumed and if not will update the action to execute at each frame cycle based on key triggers
document.addEventListener("keydown", function (event) {
    if (event.code == "Space" && isPaused == true) {
        resumeGame()
    }
    else if (actionLog[event.code]) {
        actionLog[event.code].pressed = true;
    }
});

//event listener for keyup, will put the boolean value for the related key to false into the actionLog object to stop firing the corresponding function at each frame cycle 
document.addEventListener("keyup", function (event) {
    if (actionLog[event.code]) {
        actionLog[event.code].pressed = false;
    }
});

//goes through all the keys stored into the actionLog and if a key.pressed state is true will then fire its associated function
function executeInputs() {
    Object.keys(actionLog).forEach(key => {
        actionLog[key].pressed && actionLog[key].func();
    })
};

/* ***** MOVING RIGHT BAR WITH MOUSE ***** */

function useMouseToMoveBar(mouseEvent) {
    if (!isPaused) {
        let posY = mouseEvent.clientY;
        RightBar.moveWithMouse(posY)
    }
}

//reduce callBackFunction firing frequency based on delay
const throttle = (callBackFunction, delay) => {
    let lastTime = 0;
    return (...args) => {
        let now = new Date().getTime();
        if (now - lastTime < delay) return;
        lastTime = now;
        callBackFunction(...args)
    }
}

document.addEventListener("mousemove", throttle(useMouseToMoveBar, 1000 / 60))


/* ***** FUNCTIONS RELATED TO BALL MOVEMENT ***** */

//updates coords properties of the ball
function changeBallCoords(moveValueX, moveValueY) {
    Ball.centerX += moveValueX;
    if (isInitialTurn == false) { Ball.centerY += moveValueY; }
}

//moves the ball around based on its coordinate variables
function displayBall() {
    Ball.elem.style.top = (Ball.centerY - Ball.radius) + "px";
    Ball.elem.style.left = (Ball.centerX - Ball.radius) + "px";
}

//checks if ball will hit the bar on the right side at next movemement, returns true if yes and false otherwise
function willBallHitRightBar(moveValueX, moveValueY) {
    if ((Ball.centerX + Ball.radius + moveValueX >= RightBar.elem.offsetLeft) && (Ball.centerX + Ball.radius + moveValueX <= RightBar.elem.offsetLeft + RightBar.width) && (Ball.centerY + Ball.radius + moveValueY >= RightBar.topPosition) && (Ball.centerY - Ball.radius + moveValueY <= RightBar.topPosition + RightBar.height)) {
        return true;
    } else {
        return false;
    }
}
//checks if ball will hit the bar on the left side at next movemement, returns true if yes and false otherwise
function willBallHitLeftBar(moveValueX, moveValueY) {
    if ((Ball.centerX - Ball.radius + moveValueX <= LeftBar.elem.offsetLeft + LeftBar.width) && (Ball.centerX - Ball.radius + moveValueX >= LeftBar.elem.offsetLeft) && (Ball.centerY + Ball.radius + moveValueY >= LeftBar.topPosition) && (Ball.centerY - Ball.radius + moveValueY <= LeftBar.topPosition + LeftBar.height)) {
        return true;
    } else {
        return false;
    }
}

//checks if either of the bars will be hit by the ball on next move, returns true if that's the case and false otherwise
function willBallHitAnyBar(moveValueX, moveValueY) {
    return willBallHitRightBar(moveValueX, moveValueY) || willBallHitLeftBar(moveValueX, moveValueY);
}

//calculate percent of height of the bar that was hit by the ball
function calculateCollisionBarArea(bar) {
    return ((Ball.centerY - bar.topPosition) / bar.height) * 100;
}

function calculateNewMultipliers(ratio) {

    if ((ratio <= 5) || (ratio >= 95)) {
        Ball.velocityMultiplierX = 2;
        Ball.velocityMultiplierY = 4;
    } else if ((ratio > 5 && ratio <= 20) || (ratio >= 80 && ratio < 95)) {
        Ball.velocityMultiplierX = 3.5;
        Ball.velocityMultiplierY = 2;
    } else if ((ratio > 20 && ratio <= 35) || (ratio >= 65 && ratio < 80)) {
        Ball.velocityMultiplierX = 4;
        Ball.velocityMultiplierY = 1.5;
    } else if ((ratio > 35 && ratio <= 45) || (ratio >= 55 && ratio < 65)) {
        Ball.velocityMultiplierX = 4.5;
        Ball.velocityMultiplierY = 1;
    } else if (ratio > 45 && ratio < 55) {
        Ball.velocityMultiplierX = 5;
        Ball.velocityMultiplierY = 0.75;
    } else {
        alert("invalid speed modifier")// This should not be triggered since a collision is required for this function, left here for debug purpose
    }

}

//changes the ball direction depending on which half of the bar's height is hit by the ball
function redirectFromBar(bar) {
    if (isInitialTurn) {
        isInitialTurn = false;
    }
    let ratio = Number(calculateCollisionBarArea(bar))
    calculateNewMultipliers(ratio);
    Ball.directionY = ((Ball.centerY <= bar.topPosition + bar.height / 2) ? false : true);
    Ball.toggleDirectionX();
}

//get the ball into the point of direct contact to the nearest bar (to smooth redirection), returns the distance that was necessary to close in
function closeDistanceToBar() {
    let distanceToReachX = 0;
    if (Ball.directionX) {
        distanceToReachX = RightBar.elem.offsetLeft - (Ball.centerX + Ball.radius);
    } else {
        distanceToReachX = (Ball.centerX - Ball.radius) - (LeftBar.elem.offsetLeft + LeftBar.width);
    }
    changeBallCoords(distanceToReachX, distanceToReachX / 2)
    displayBall();
    return distanceToReachX;

}

//checks if the ball will hit either the top or bottom part of gameWindow returns true if yes and no otherwise
function willBallHitAnyWall(moveValueY) {
    return ((Ball.centerY + Ball.radius + moveValueY >= GameWindow.height) || (Ball.centerY - Ball.radius + moveValueY <= 0));
}

//get the ball into the point of direct contact to the nearest wall (to smooth redirection), returns the distance that was necessary to close in
function closeDistanceToWall() {
    let distanceToReachY = 0;
    if (Ball.directionY) {
        distanceToReachY = GameWindow.height - (Ball.centerY + Ball.radius);
    } else {
        distanceToReachY = (Ball.centerY - Ball.radius)
    }
    changeBallCoords((distanceToReachY / Ball.velocityMultiplierY * Ball.velocityMultiplierX), distanceToReachY);
    displayBall();
    return distanceToReachY;

}

//function handling everything related to ball movement and calculations
function moveBall() {
    //stores the amout of movement necessary to travel during the frame animation cycle
    let ballTravelX = Ball.velocity * Ball.velocityMultiplierX;
    let ballTravelY = Ball.velocity * Ball.velocityMultiplierY;
    //for as long as there is movement to do :
    while (ballTravelX > 0 && ballTravelY > 0) {
        //sets value of movement to do based of movement direction
        let moveX = (Ball.directionX ? ballTravelX : -ballTravelX);
        let moveY = (Ball.directionY ? ballTravelY : -ballTravelY);
        //if during this move the ball will hit a bar then close the distance to the bar and reduce the movement left to do during this animation cycle
        if (willBallHitAnyBar(moveX, moveY)) {
            let distanceTravelledX = closeDistanceToBar()
            ballTravelX -= distanceTravelledX;
            ballTravelY -= distanceTravelledX / 2;
            //apply change of direction according to side hit and which part of the bar was hit                         
            (Ball.directionX ? redirectFromBar(RightBar) : redirectFromBar(LeftBar))
            //else, check if ball will hit any wall during this move
        } else if (willBallHitAnyWall(moveY) && (Ball.centerY - Ball.radius != 0)) {
            //close the distance to the wall and reduce the movement left to do during this cycle       
            let distanceTravelledY = closeDistanceToWall();
            ballTravelX -= distanceTravelledY * 2;
            ballTravelY -= distanceTravelledY;
            Ball.toggleDirectionY();
            //if neither previous cases happened in this loop, use the totality of allocated movement to move the ball                                                    
        } else {
            changeBallCoords(moveX, moveY);
            displayBall();
            ballTravelX = 0;
            ballTravelY = 0;
        }
    }
}

/* ***** function related to game pacing and winning event ***** */

//reset all global variable subject to change to default value, also apply proportionality of values in case of resizing
function resetGlobalVariables() {
    isInitialTurn = true;
    roundEnded = false;
    gameEnded = false;
    isPaused = false;
    barMovementValue = GameWindow.height / 100 * barMoveIncrementPercent;
    defaultBarHeight = GameWindow.height / 10;
    minBarHeight = GameWindow.height / 40;
    defaultBarWidth = GameWindow.width / 50;
}


//initialize all elements
function initializeAllElements() {
    resetGlobalVariables()
    GameWindow.calculateNewArenaSize()
    LeftBar.fullReset();
    RightBar.fullReset();
    Ball.fullReset();
    Score.reset();
    ModalMenu.toggleVisibility(false);
    ModalOverlay.toggleVisibility(false);
    pauseGame();

}


//pauses the game by cancelling animationframe and turns the pressed state of the pause button to false
function pauseGame() {
    if (!isPaused) {        // if game wasn't paused then
        isPaused = true;    // isPaused becomes true and the animation frame is cancelled based on id
        window.cancelAnimationFrame(requestAnimationId);
        actionLog["Space"].pressed = false;
    }
}

//resumes game by calling the function running the entire game logic and turns the pressed state of the pause button to false
function resumeGame() {
    if (isPaused) {         // if game was paused then
        isPaused = false;   // isPaused boolean becomes false and animateBall starts
        actionLog["Space"].pressed = false;
        animateBall();
    }
}

//reset position of elements and state of game logic booleans on round restart
function startRound() {
    LeftBar.resetPosition();
    RightBar.resetPosition();
    Ball.reset();
    Ball.toggleDirectionX();
    isInitialTurn = true;
    roundEnded = false;
    pauseGame();
}

function restart() {
    initializeAllElements();
    startRound();
}

//win condition
function hasRoundEnded() {
    roundEnded = (((Ball.centerX + Ball.radius <= 0) || (Ball.centerX - Ball.radius >= GameWindow.width)) ? true : false);
}

//change bar properties for each player depending of if winning or losing based on a boolean arcgument (will use ballDirectionX to deternine who won)
function increaseDifficulty(player2Won) {
    if (player2Won) {
        LeftBar.reduceHeight(10);
        RightBar.increaseHeight(5);

    } else {
        RightBar.reduceHeight(10);
        LeftBar.increaseHeight(5);
    }
}

//function that will run the whole game logic, will do a recursion at the end by calling itself into a requestAnimationFrame thus causing a frame cycle
function animateBall() {
    executeInputs();
    moveBall();
    hasRoundEnded();
    if (roundEnded) {
        Score.update(Ball.directionX);
        Score.hasMatchEnded();
        if (gameEnded) {
            pauseGame()
            Score.endMatch()
        } else {
            increaseDifficulty(Ball.directionX);
            startRound();
        }
    } else if (!isPaused) {
        requestAnimationId = window.requestAnimationFrame(animateBall);
    }
}

/* ***** INITIALIZATION ***** */
restart()


