"use strict"

/* ***** global objects and variables ***** */

// area on which the pong game is displayed
const GameWindow = {
    elem: document.getElementById("pongGameWindow"),
    width: document.getElementById("pongGameWindow").offsetWidth,
    height: document.getElementById("pongGameWindow").offsetHeight,
};

// vertical movement of bars
const barMoveIncrementPercent = 1;
let barMovementValue = GameWindow.height / 100 * barMoveIncrementPercent;

//keymapping (CURRENTLY NOT IMPLEMENTED)
const keyPlayer1Up = "KeyW";
const keyPlayer1Down = "KeyS";
const keyPlayer2Up = "ArrowUp";
const keyPlayer2Down = "ArrowDown";
const pause = "Space";

//bar default parameters
const defaultBarHeight = 100;
const minBarHeight = 20;
const defaultBarWidth = 20;

//game booleans
let isInitialTurn = true;
let gameEnded = false;
let isPaused = false;

//id of current animation frame
let requestAnimationId;

/* ***** Creating object score handling the score of each player and the related methods ***** */

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

//reset score (CURRENTLY NOT IMPLEMENTED)
Score.reset = function () {
    this.player1Points = 0;
    this.player2Points = 0;
    this.display();
};

/* ***** Creating both bars ***** */

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

    fullReset() { //Not implemented currently
        this.height = defaultBarHeight;
        this.width = defaultBarWidth;
        this.defaultPositionY = (GameWindow.height / 2) - (defaultBarHeight / 2);
        this.topPosition = this.defaultPositionY;
        this.elem.style.top = this.defaultPositionY + "px";
    },

    increaseHeight(value) {
        this.height = (this.height + (this.height / 100 * value) < defaultBarHeight ? this.height + (this.height / 100 * value) : defaultBarHeight);
        this.elem.style.height = this.height + "px";
    },

    reduceHeight(value) {
        this.height = (this.height - (this.height / 100 * value) > minBarHeight ? this.height - (this.height / 100 * value) : minBarHeight);
        this.elem.style.height = this.height + "px";
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
};

//creating the left and right bar using the methods of Bar object
const LeftBar = Object.create(Bar);
LeftBar.setInitialValues({
    elem: document.getElementById("leftBar"),
    width: defaultBarWidth,
    height: defaultBarHeight,
    defaultPositionY: (GameWindow.height / 2) - (defaultBarHeight / 2),
    topPosition: (GameWindow.height / 2) - (defaultBarHeight / 2),
});

const RightBar = Object.create(Bar);
RightBar.setInitialValues({
    elem: document.getElementById("rightBar"),
    width: defaultBarWidth,
    height: defaultBarHeight,
    defaultPositionY: (GameWindow.height / 2) - (defaultBarHeight / 2),
    topPosition: (GameWindow.height / 2) - (defaultBarHeight / 2),
});


/* ***** Ball object and its related methods ***** */
const Ball = {
    elem: document.querySelector("i"),
    defaultPositionY: (GameWindow.height / 2),
    defaultPositionX: (GameWindow.width / 2),
    centerY: (GameWindow.height / 2),
    centerX: (GameWindow.width / 2),
    radius: document.querySelector("i").offsetWidth / 2,
    directionX: false,
    directionY: true,
    velocity: 5
};

Ball.reset = function () {
    this.centerX = this.defaultPositionX
    this.centerY = this.defaultPositionY
};
Ball.toggleDirectionX = function () {
    this.directionX = (this.directionX ? false : true);
};

Ball.toggleDirectionY = function () {
    this.directionY = (this.directionY ? false : true);
};

/* ***** HANDLING OF PLAYER INPUTS ***** */

//object containing the player controls, their states and the events to trigger if their pressed state is true
const actionLog = {
    "KeyW": { pressed: false, func: () => { LeftBar.moveUp() } },
    "KeyS": { pressed: false, func: () => { LeftBar.moveDown() } },
    "ArrowUp": { pressed: false, func: () => { RightBar.moveUp() } },
    "ArrowDown": { pressed: false, func: () => { RightBar.moveDown() } },
    "Space": { pressed: false, func: pauseGame },
}

//event listener for keydown, will first check if the game has to be resume and if not will update the action to execute at each frame cycle based on key triggers
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



/* ***** Functions related to Ball movement ***** */

//updates coords properties of the ball
function changeBallCoords(moveValue) {
    (Ball.directionX ? (Ball.centerX += moveValue) : (Ball.centerX -= moveValue));
    if (isInitialTurn == false) {
        (Ball.directionY ? (Ball.centerY += moveValue) : (Ball.centerY -= moveValue));
    }
}

//moves the ball around based on its coordinate variables
function displayBallMovement() {
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

//changes the ball direction depending on which half of the bar's height is hit by the ball
function redirectFromBar(bar) {
    if (isInitialTurn) {
        isInitialTurn = false;
    }
    Ball.directionY = ((Ball.centerY <= bar.topPosition + bar.height / 2) ? false : true);
    Ball.toggleDirectionX();
}

//get the ball into the point of direct contact to the nearest bar (to smooth redirection), returns the distance that was necessary to close in
function closeDistanceToBar() {
    let distanceToReach = 0;
    if (Ball.directionX) {
        distanceToReach = RightBar.elem.offsetLeft - (Ball.centerX + Ball.radius);
    } else {
        distanceToReach = (Ball.centerX - Ball.radius) - (LeftBar.elem.offsetLeft + LeftBar.width);
    }
    changeBallCoords(distanceToReach)
    displayBallMovement();
    return distanceToReach;

}

//checks if the ball will hit either the top or bottom part of gameWindow returns true if yes and no otherwise
function willBallHitAnyWall(moveValueY) {
    return ((Ball.centerY + Ball.radius + moveValueY >= GameWindow.height) || (Ball.centerY - Ball.radius + moveValueY <= 0));
}

//get the ball into the point of direct contact to the nearest wall (to smooth redirection), returns the distance that was necessary to close in
function closeDistanceToWall() {
    let distanceToReach = 0;
    if (Ball.directionY) {
        distanceToReach = GameWindow.height - (Ball.centerY + Ball.radius);
    } else {
        distanceToReach = (Ball.centerY - Ball.radius)
    }
    changeBallCoords(distanceToReach)
    displayBallMovement();
    return distanceToReach;

}

//function handling everything related to ball movement and calculations
function moveBall() {
    let ballTravel = Ball.velocity; //stores the amout of movement necessary to travel during the frame animation cycle

    //for as long as there is movement to do :
    while (ballTravel > 0) {
        let moveX = (Ball.directionX ? ballTravel : -ballTravel);   //sets value of movement to do based of movement direction
        let moveY = (Ball.directionY ? ballTravel : -ballTravel);
        if (willBallHitAnyBar(moveX, moveY)) {                                          //if during this move the ball will hit a bar
            ballTravel -= closeDistanceToBar();                                         //close the distance to the bar and reduce the movement left to do during this animation cycle
            (Ball.directionX ? redirectFromBar(RightBar) : redirectFromBar(LeftBar))    //apply change of direction according to side hit and which part of the bar was hit
        } else if (willBallHitAnyWall(moveY) && (Ball.centerY - Ball.radius != 0)) {        //else, check if ball will hit any wall during this move
            ballTravel -= closeDistanceToWall();                                            //close the distance to the wall and reduce the movement left to do during this animation cycle
            Ball.toggleDirectionY();                                                        //change vertical movement direction
        } else {
            changeBallCoords(ballTravel);   //if neither previous case happened in this loop, use the totality of allocated movement to move the ball
            displayBallMovement();
            ballTravel = 0;
        }
    }
}

/* ***** function related to game pacing and winning event ***** */

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
    gameEnded = false;
    animateBall();
}

//win condition
function hasGameEnded() {
    gameEnded = (((Ball.centerX + Ball.radius <= 0) || (Ball.centerX - Ball.radius >= GameWindow.width)) ? true : false);
}

//change bar properties for each player depending of if winning or losing based on a boolean arcgument (will use ballDirectionX to deternine who won)
function increaseDifficulty(player2Won) {
    if (player2Won) {
        LeftBar.reduceHeight(20);
        RightBar.increaseHeight(10);

    } else {
        RightBar.reduceHeight(20);
        LeftBar.increaseHeight(10);
    }
}

//function that will run the whole game logic, will do a recursion at the end by calling itself into a requestAnimationFrame thus causing a frame cycle
function animateBall() {
    executeInputs();
    moveBall();
    hasGameEnded();
    if (gameEnded) {
        Score.update(Ball.directionX);
        increaseDifficulty(Ball.directionX);
        startRound();
    } else if (!isPaused) {
        requestAnimationId = window.requestAnimationFrame(animateBall);
    }
}

/* ***** INITIALIZATION ***** */
Score.reset()
LeftBar.fullReset()
RightBar.fullReset()
startRound()


