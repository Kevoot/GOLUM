let haveEvents = "ongamepadconnected" in window;
let controllers = {};
let currentSelection = 0;
let currentSection = 0;
let disableInputFlag = false;
let inputTimeout;

const JOY_UP = 1;
const JOY_DOWN = -1;
const JOY_LEFT = 1;
const JOY_RIGHT = -1;

const BTN_SELECT_INDEX = 4;
const BTN_BACK_INDEX = 6;

// gamepad info:
// button 4: select (L1 on pin connection)
// button 6: back (L2 on pin connection)
// joystick:
// up: axes[1] === 1
// down: axes[1] === -1
// left: axes[0] === 1
// right: axes[0] === -1

$(document).ready(function () {
    $("#overlay0").toggleClass("projectSelected");
});

function resumeInput() {
    disableInputFlag = false;
    clearTimeout(inputTimeout);
}

function changeSelection(newSelection) {
    $("#overlay" + currentSelection).toggleClass("projectSelected");
    $("#overlay" + newSelection).toggleClass("projectSelected");
    currentSelection = newSelection;
}

function changeSection(newSection) {
    $("html,body").animate({
        scrollTop: $("#section" + newSection).offset().top
     });
    currentSection = newSection;
}


function connecthandler(e) {
    addgamepad(e.gamepad);
}

function addgamepad(gamepad) {
    controllers[gamepad.index] = gamepad;

    requestAnimationFrame(updateStatus);
}

function disconnecthandler(e) {
    removegamepad(e.gamepad);
}

function removegamepad(gamepad) {
    const d = document.getElementById("controller" + gamepad.index);
    document.body.removeChild(d);
    delete controllers[gamepad.index];
}

function updateStatus() {
    if (!haveEvents) {
        scangamepads();
    }

    let j;

    for (j in controllers) {
        const controller = controllers[j];

        if (controller.buttons) {
            if (controller.buttons[BTN_BACK_INDEX].pressed) {
                history.go(-1);
            }
            else if (controller.buttons[BTN_SELECT_INDEX].pressed && !disableInputFlag) {
                disableInputFlag = true;
                inputTimeout = setTimeout(
                    resumeInput,
                    5000
                );
                if (currentSelection === 0) {
                    $.ajax({
                        type: "POST",
                        url: "http://localhost:3000/randomize"
                    });
                }
                else if (currentSelection === 1) {
                    window.location.href = "./projectinformation.html";
                }
                else if (currentSelection === 2) {
                    window.location.href = "./credits.html";
                }
                else if (currentSelection === 3) {
                    window.location.href = "./softwareinformation.html";
                }
            }
        }

        if (controller.axes && !disableInputFlag) {
            if (controller.axes[0] === JOY_LEFT) {
                move("L");
            }
            else if (controller.axes[0] === JOY_RIGHT) {
                move("R");
            }
            else if (controller.axes[1] === JOY_DOWN) {
                move("D");
            }
            else if (controller.axes[1] === JOY_UP) {
                move("U");
            }
        }
    }

    requestAnimationFrame(updateStatus);
}

function move(direction) {
    disableInputFlag = true;
    inputTimeout = setTimeout(
        resumeInput,
        400
    );

    let newSelection = currentSelection;
    let newSection = currentSection;

    if (direction === "L" && currentSelection > 0) {
        newSelection--;
        changeSelection(newSelection);
    }
    else if (direction === "R" && currentSelection < 3) {
        newSelection++;
        changeSelection(newSelection);
    }
    else if (direction === "U" && currentSelection > 0) {
        newSection--;
        changeSection(newSection);
    }
    else if (direction === "D" && currentSelection > 0) {
        newSection++;
        changeSection(newSection);
    }
}

function scangamepads() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : ((<any>navigator).webkitGetGamepads ? (<any>navigator).webkitGetGamepads() : []);
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
            if (gamepads[i].index in controllers) {
                controllers[gamepads[i].index] = gamepads[i];
            } else {
                addgamepad(gamepads[i]);
            }
        }
    }
}


window.addEventListener("gamepadconnected", connecthandler);
window.addEventListener("gamepaddisconnected", disconnecthandler);

if (!haveEvents) {
    setInterval(scangamepads, 500);
}