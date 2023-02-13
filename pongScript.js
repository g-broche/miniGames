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
    directionY: true //true => downward ; false => upward
};

Ball.reset = function () {
    this.centerX = this.defaultPositionX
    this.centerY = this.defaultPositionY
}
Ball.toggleDirectionX = function () {
    this.directionX = (this.directionX ? false : true);
}

const increment = 1;

const keyPlayer1Up = "KeyW";
const keyPlayer1Down = "KeyS";
const keyPlayer2Up = "ArrowUp";
const keyPlayer2Down = "ArrowDown";

let moveStep = 1;
let isInitialTurn = true;
let gameEnded = false;

let requestAnimationId;

/* ***** BAR MOVEMENT ***** */

document.addEventListener("keydown", function (event) {
    if (event.code == keyPlayer1Up || event.code == keyPlayer1Down || event.code == keyPlayer2Up || event.code == keyPlayer2Down) {
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
            default:
                break;
        }
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


function changeBallCoords() {
    (Ball.directionX ? (Ball.centerX += moveStep) : (Ball.centerX -= moveStep));
    if (isInitialTurn == false) {
        (Ball.directionY ? Ball.centerY += moveStep : Ball.centerY -= moveStep);
    }
}

function moveBall() {
    Ball.elem.style.top = (Ball.centerY - Ball.radius) + "px";
    Ball.elem.style.left = (Ball.centerX - Ball.radius) + "px";
    console.log("ball center X :" + Ball.centerX + "; ball center y :" + Ball.centerY);
}

function hasGameEnded() {
    gameEnded = (((Ball.centerX + Ball.radius <= 0) || (Ball.centerX - Ball.radius >= GameWindow.width)) ? true : false);
}

function hasBallHitRightBar() {

    if ((Ball.elem.offsetLeft + Ball.elem.offsetWidth == RightBar.elem.offsetLeft) && (Ball.elem.offsetTop >= RightBar.elem.offsetTop) && (Ball.elem.offsetTop <= RightBar.elem.offsetTop + RightBar.elem.offsetHeight)) {
        console.log("hit right");
        return true;
    } else {
        return false;
    }
}
function hasBallHitLeftBar() {
    if ((Ball.elem.offsetLeft == LeftBar.elem.offsetLeft + LeftBar.elem.offsetWidth) && (Ball.elem.offsetTop >= LeftBar.elem.offsetTop) && (Ball.elem.offsetTop <= LeftBar.elem.offsetTop + RightBar.elem.offsetHeight)) {
        console.log("hit left");
        return true;
    } else {
        return false;
    }
}
function redirectFromBar(bar) {
    console.log("redirect");
    if (isInitialTurn) {
        isInitialTurn = false;
    }
    Ball.directionY = ((Ball.centerY <= bar.topPosition + bar.height / 2) ? false : true);
    Ball.directionX = (Ball.directionX ? false : true);
}

function handleCollisionWithBar() {
    if (Ball.directionX) {
        if (hasBallHitRightBar()) {
            redirectFromBar(RightBar);
        }
    } else {
        if (hasBallHitLeftBar()) {
            redirectFromBar(LeftBar);
        }
    }
}

function handleWallRedirect() {
    if (Ball.centerY - Ball.radius <= 0) {
        Ball.directionY = true;
    } else if (Ball.centerY + Ball.radius >= GameWindow.height) {
        Ball.directionY = false;
    }
}

function animateBall() {
    changeBallCoords();
    moveBall();
    handleCollisionWithBar();
    handleWallRedirect();
    hasGameEnded();
    if (gameEnded) {
        (Ball.directionX ? Score.update(true) : Score.update(false));
        startRound();
    } else {
        requestAnimationId = window.requestAnimationFrame(animateBall);
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



/* ***** INITIALIZATION ***** */
Score.reset()
startRound()


