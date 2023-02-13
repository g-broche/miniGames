"use strict"

const GameWindow = {
    elem: document.getElementById("pongGameWindow"),
    width: document.getElementById("pongGameWindow").offsetWidth,
    height: document.getElementById("pongGameWindow").offsetHeight,
};

const Score = {
    player1Field: document.getElementById("scorePlayer1"),
    player1Points: 0,
    player2Field: document.getElementById("scorePlayer2"),
    player2Points: 0,
};

Score.display = function () {
    this.player1Field.textContent = this.player1Points;
    this.player2Field.textContent = this.player2Points;
}

// add point to score based on boolean, if true player one has won, else player 2 has won
Score.update = function (winnerBool) {
    (winnerBool ? this.player1Points++ : this.player2Points++);
    this.display();
}
Score.reset = function () {
    this.player1Points = 0;
    this.player2Points = 0;
    this.display();
}

const LeftBar = {
    elem: document.getElementById("leftBar"),
    width: document.getElementById("leftBar").offsetWidth,
    height: document.getElementById("leftBar").offsetHeight,
    defaultPositionY: (GameWindow.height / 2) - (document.getElementById("leftBar").offsetHeight / 2),
    topPosition: (GameWindow.height / 2) - (document.getElementById("leftBar").offsetHeight / 2),

};

LeftBar.reset = function () {
    this.topPosition = this.defaultPositionY;
    this.elem.style.top = this.defaultPositionY + "px";
}

const RightBar = {
    elem: document.getElementById("rightBar"),
    width: document.getElementById("rightBar").offsetWidth,
    height: document.getElementById("rightBar").offsetHeight,
    defaultPositionY: (GameWindow.height / 2) - (document.getElementById("rightBar").offsetHeight / 2),
    topPosition: (GameWindow.height / 2) - (document.getElementById("rightBar").offsetHeight / 2),

};

RightBar.reset = function () {
    this.topPosition = this.defaultPositionY;
    this.elem.style.top = this.defaultPositionY + "px";
}

const Ball = {
    elem: document.querySelector("i"),
    defaultPositionY: (GameWindow.height / 2),
    defaultPositionX: (GameWindow.width / 2),
    centerY: (GameWindow.height / 2),
    centerX: (GameWindow.width / 2),
    radius: document.querySelector("i").offsetWidth / 2,
    directionX: false, //true => left to right ; false => right to left
    directionY: true, //true => downward ; false => upward
    velocity: 5
};

Ball.reset = function () {
    this.centerX = this.defaultPositionX
    this.centerY = this.defaultPositionY
}
Ball.toggleDirectionX = function () {
    this.directionX = (this.directionX ? false : true);
}

Ball.toggleDirectionY = function () {
    this.directionY = (this.directionY ? false : true);
}

const increment = 2;

const keyPlayer1Up = "KeyW";
const keyPlayer1Down = "KeyS";
const keyPlayer2Up = "ArrowUp";
const keyPlayer2Down = "ArrowDown";
const pause = "Space";

let isInitialTurn = true;
let gameEnded = false;

let requestAnimationId;
let isPaused = false;

/* ***** BAR MOVEMENT ***** */

document.addEventListener("keydown", function (event) {
    let barMovementValue = GameWindow.height / 100 * increment;

    switch (event.code) {

        case keyPlayer1Up:
            moveUp(LeftBar, -barMovementValue);
            break;
        case keyPlayer1Down:
            moveDown(LeftBar, barMovementValue);
            break;
        case keyPlayer2Up:
            moveUp(RightBar, -barMovementValue);
            break;
        case keyPlayer2Down:
            moveDown(RightBar, barMovementValue);
            break;
        case pause:
            pauseGame();
            break;
        default:
            break;
    }
});

function resetBars() {
    LeftBar.topPosition = LeftBar.defaultPositionY;
    LeftBar.elem.style.top = LeftBar.defaultPositionY + "px";
    RightBar.topPosition = RightBar.defaultPositionY;
    RightBar.elem.style.top = RightBar.defaultPositionY + "px";
}

function moveUp(bar, value) {
    if (canBarMoveUp(bar, value)) {
        moveBar(bar, value);
    } else {
        moveMaxHeight(bar)
    }
}

function moveDown(bar, value) {
    if (canBarMoveDown(bar, value)) {
        moveBar(bar, value)
    } else {
        moveMinHeight(bar)
    }
}

function moveBar(bar, value) {

    bar.topPosition += Number(value);
    bar.elem.style.top = bar.topPosition + "px";
}

function moveMaxHeight(bar) {
    bar.topPosition = 0;
    bar.elem.style.top = bar.topPosition + "px";
}
function moveMinHeight(bar) {
    bar.topPosition = GameWindow.height - bar.height;
    bar.elem.style.top = bar.topPosition + "px";
}

function canBarMoveUp(bar, value) {

    return (bar.topPosition + value >= 0 ? true : false);
}
function canBarMoveDown(bar, value) {
    return (bar.topPosition + bar.height + value <= GameWindow.height ? true : false);
}

/* ***** BALL MOVEMENT ***** */


function changeBallCoords(moveValue) {
    (Ball.directionX ? (Ball.centerX += moveValue) : (Ball.centerX -= moveValue));
    if (isInitialTurn == false) {
        (Ball.directionY ? (Ball.centerY += moveValue) : (Ball.centerY -= moveValue));
    }
}

function displayBallMovement() {
    Ball.elem.style.top = (Ball.centerY - Ball.radius) + "px";
    Ball.elem.style.left = (Ball.centerX - Ball.radius) + "px";
}


function willBallHitRightBar(moveValueX, moveValueY) {
    if ((Ball.centerX + Ball.radius + moveValueX >= RightBar.elem.offsetLeft) && (Ball.centerY + Ball.radius + moveValueY >= RightBar.topPosition) && (Ball.centerY - Ball.radius + moveValueY <= RightBar.topPosition + RightBar.height)) {
        return true;
    } else {
        return false;
    }
}
function willBallHitLeftBar(moveValueX, moveValueY) {
    if ((Ball.centerX - Ball.radius + moveValueX <= LeftBar.elem.offsetLeft + LeftBar.width) && (Ball.centerY + Ball.radius + moveValueY >= LeftBar.topPosition) && (Ball.centerY - Ball.radius + moveValueY <= LeftBar.topPosition + RightBar.height)) {
        return true;
    } else {
        return false;
    }
}

function willBallHitAnyBar(moveValueX, moveValueY) {
    return willBallHitRightBar(moveValueX, moveValueY) || willBallHitLeftBar(moveValueX, moveValueY);
}

function redirectFromBar(bar) {
    if (isInitialTurn) {
        isInitialTurn = false;
    }
    Ball.directionY = ((Ball.centerY <= bar.topPosition + bar.height / 2) ? false : true);
    Ball.toggleDirectionX();
}

function closeDistanceToBar() {
    let distanceToReach = 0;
    if (Ball.directionX) {
        distanceToReach = RightBar.elem.offsetLeft - (Ball.centerX + Ball.radius);
    } else {
        distanceToReach = (Ball.centerX - Ball.radius) - (LeftBar.elem.offsetLeft + LeftBar.width);
    }
    changeBallCoords(distanceToReach)
    displayBallMovement();
    //return distanceToReach;
    return 3;
}

function willBallHitAnyWall(moveValueY) {
    return ((Ball.centerY + Ball.radius + moveValueY >= GameWindow.height) || (Ball.centerY - Ball.radius + moveValueY <= 0));
}

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

function moveBall() {
    //check if during the next move the ball will hit either a bar or a wall
    let ballTravel = Ball.velocity;
    let i = 10;

    while (ballTravel > 0 && i >= 0) {
        let moveX = (Ball.directionX ? ballTravel : -ballTravel);
        let moveY = (Ball.directionY ? ballTravel : -ballTravel);
        if (willBallHitAnyBar(moveX, moveY)) {
            ballTravel -= closeDistanceToBar();
            (Ball.directionX ? redirectFromBar(RightBar) : redirectFromBar(LeftBar))
        } else if (willBallHitAnyWall(moveY) && (Ball.centerY - Ball.radius != 0)) {
            ballTravel -= closeDistanceToWall();
            Ball.toggleDirectionY();
        } else {
            changeBallCoords(ballTravel);
            displayBallMovement();
            ballTravel = 0;
        }
    }
}

function animateBall() {
    moveBall()
    hasGameEnded();
    if (gameEnded) {
        Score.update(Ball.directionX);
        increaseDifficulty(Ball.directionX);
        startRound();
    } else {
        requestAnimationId = window.requestAnimationFrame(animateBall);
    }
}

function pauseGame() {

    if (isPaused) {
        animateBall();
        isPaused = false;
    } else {
        window.cancelAnimationFrame(requestAnimationId);
        isPaused = true;
    }
}

function startRound() {
    LeftBar.reset();
    RightBar.reset();
    Ball.reset();
    Ball.toggleDirectionX();
    isInitialTurn = true;
    gameEnded = false;
    animateBall();
}


function hasGameEnded() {
    gameEnded = (((Ball.centerX + Ball.radius <= 0) || (Ball.centerX - Ball.radius >= GameWindow.width)) ? true : false);
}

function increaseDifficulty(player2Won) {
    if (player2Won) {
        LeftBar.height = LeftBar.height / 100 * 75;
        LeftBar.elem.style.height = LeftBar.height + "px";
    } else {

        RightBar.height = RightBar.height / 100 * 75;
        RightBar.elem.style.height = RightBar.height + "px";
    }
}



/* ***** INITIALIZATION ***** */
Score.reset()
startRound()


