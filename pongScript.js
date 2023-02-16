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

//keymapping (CURRENTLY NOT IMPLEMENTED)
const keyPlayer1Up = "KeyW";
const keyPlayer1Down = "KeyS";
const keyPlayer2Up = "ArrowUp";
const keyPlayer2Down = "ArrowDown";
const pause = "Space";

//default parameters
const barMoveIncrementPercent = 1;
let barMovementValue = GameWindow.height / 100 * barMoveIncrementPercent;
let defaultBarHeight = GameWindow.height / 10;
let minBarHeight = GameWindow.height / 40;
let defaultBarWidth = GameWindow.width / 50;
let speedRatio = 200;

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
    velocity: (GameWindow.width / speedRatio)
};

Ball.fullReset = function () {
    this.defaultPositionY = (GameWindow.height / 2);
    this.defaultPositionX = (GameWindow.width / 2);
    this.centerY = (GameWindow.height / 2);
    this.centerX = (GameWindow.width / 2);
    this.radius = (GameWindow.width / 100);
    this.velocity = (GameWindow.width / speedRatio);
    this.elem.style.height = (this.radius * 2) + "px";
    this.elem.style.width = (this.radius * 2) + "px";
    displayBall();
};

Ball.reset = function () {
    this.centerX = this.defaultPositionX;
    this.centerY = this.defaultPositionY;
    displayBall();
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

/* ***** MOVING RIGHT BAR WITH MOUSE ***** */

function useMouseToMoveBar(mouseEvent) {
    let posY = mouseEvent.clientY;
    RightBar.moveWithMouse(posY)
}

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
    changeBallCoords(distanceToReachY * 2, distanceToReachY)
    displayBall();
    return distanceToReachY;

}

//function handling everything related to ball movement and calculations
function moveBall() {
    let ballTravelX = Ball.velocity * 2; //stores the amout of movement necessary to travel during the frame animation cycle
    let ballTravelY = Ball.velocity;

    //for as long as there is movement to do :
    while (ballTravelX > 0 && ballTravelY > 0) {
        let moveX = (Ball.directionX ? ballTravelX : -ballTravelX);   //sets value of movement to do based of movement direction
        let moveY = (Ball.directionY ? ballTravelY : -ballTravelY);
        if (willBallHitAnyBar(moveX, moveY)) {
            let distanceTravelledX = closeDistanceToBar()                              //if during this move the ball will hit a bar
            ballTravelX -= distanceTravelledX;
            ballTravelY -= distanceTravelledX / 2;                                   //close the distance to the bar and reduce the movement left to do during this animation cycle
            (Ball.directionX ? redirectFromBar(RightBar) : redirectFromBar(LeftBar))    //apply change of direction according to side hit and which part of the bar was hit
        } else if (willBallHitAnyWall(moveY) && (Ball.centerY - Ball.radius != 0)) {        //else, check if ball will hit any wall during this move
            let distanceTravelledY = closeDistanceToWall();                                  //close the distance to the wall and reduce the movement left to do during this cycle 
            ballTravelX -= distanceTravelledY * 2;
            ballTravelY -= distanceTravelledY;

            Ball.toggleDirectionY();                                                        //change vertical movement direction
        } else {
            changeBallCoords(moveX, moveY);   //if neither previous case happened in this loop, use the totality of allocated movement to move the ball
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
    pauseGame()
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
    gameEnded = false;
    pauseGame();
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
//GameWindow.resize();
initializeAllElements();
startRound();


