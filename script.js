"use strict";
const placeholderButton = document.getElementsByClassName("placeholder");

function underConstruction() {
    alert("cette page n'existe pas à l'heure actuelle")
}

for (let index = 0; index < placeholderButton.length; index++) {
    placeholderButton[index].addEventListener("click", underConstruction)
}

console.log(placeholderButton)