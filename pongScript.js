"use strict"

const LeftBar = {
    elem: document.getElementById("leftBar"),
    topPostion: 50,
    heightInVH: (document.getElementById("leftBar").offsetHeight / window.innerHeight * 100),
};
const RightBar = {
    elem: document.getElementById("rightBar"),
    topPostion: 50,
    heightInVH: (document.getElementById("rightBar").offsetHeight / window.innerHeight * 100),
};
const Ball = {
    elem: document.querySelector("i"),
    postionY: document.querySelector("i").style.top + (document.querySelector("i").style.height / 2),
    postionX: document.querySelector("i").style.left + (document.querySelector("i").style.width / 2),
}

const increment = 3;

let keyPlayer1Up = "KeyW";
let keyPlayer1Down = "KeyS";
let keyPlayer2Up = "ArrowUp";
let keyPlayer2Down = "ArrowDown";

/* ***** BAR MOVEMENT ***** */

document.addEventListener("keydown", function (event) {

    switch (event.code) {
        case keyPlayer1Up:
            moveUp(LeftBar, -increment);
            break;
        case keyPlayer1Down:
            console.log("P1 Down");
            moveDown(LeftBar, increment);
            break;
        case keyPlayer2Up:
            moveUp(RightBar, -increment);
            break;
        case keyPlayer2Down:
            console.log("P2 Down");
            moveDown(RightBar, increment);
            break;
        default:
            break;
    }
});

function moveUp(bar, value) {
    if (canBarMoveUp(bar, value)) {
        move(bar, value);
    } else {
        moveMaxHeight(bar)
    }
}

function moveDown(bar, value) {
    if (canBarMoveDown(bar, value)) {
        move(bar, value)
    } else {
        moveMinHeight(bar)
    }
}

function move(bar, value) {
    bar.topPostion += Number(value);
    bar.elem.style.top = bar.topPostion + "vh";
}

function moveMaxHeight(bar) {
    bar.topPostion = 0;
    bar.elem.style.top = bar.topPostion + "vh";
}
function moveMinHeight(bar) {
    bar.topPostion = 100 - bar.heightInVH;
    bar.elem.style.top = (window.innerHeight - bar.elem.offsetHeight) + "px";
}

function canBarMoveUp(bar, value) {

    return (bar.elem.offsetTop + value * window.innerHeight / 100 >= 0 ? true : false);
}
function canBarMoveDown(bar, value) {
    return (bar.elem.offsetTop + bar.elem.offsetHeight + value * window.innerHeight / 100 <= window.innerHeight ? true : false);
}

function updateBarsHeightValue() {
    LeftBar.heightInVH = calculateBarHeightInVH(LeftBar);
    RightBar.heightInVH = calculateBarHeightInVH(RightBar);
}

function calculateBarHeightInVH(bar) {

    return (bar.elem.offsetHeight / window.innerHeight * 100);
}

/* ***** BALL MOVEMENT ***** */


/* ***** INITIALIZATION ***** */

updateBarsHeightValue();


