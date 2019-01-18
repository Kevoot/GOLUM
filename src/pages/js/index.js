var haveEvents = 'ongamepadconnected' in window;
var controllers = {};
let currentSelection = 0;
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


function connecthandler(e) {
    addgamepad(e.gamepad);
}

function addgamepad(gamepad) {
    controllers[gamepad.index] = gamepad;

    /*var d = document.createElement("div");
    d.setAttribute("id", "controller" + gamepad.index);

    var t = document.createElement("h1");
    t.appendChild(document.createTextNode("gamepad: " + gamepad.id));
    d.appendChild(t);

    var b = document.createElement("div");
    b.className = "buttons";
    for (var i = 0; i < gamepad.buttons.length; i++) {
        var e = document.createElement("span");
        e.className = "button";
        //e.id = "b" + i;
        e.innerHTML = i;
        b.appendChild(e);
    }

    d.appendChild(b);

    var a = document.createElement("div");
    a.className = "axes";

    for (var i = 0; i < gamepad.axes.length; i++) {
        var p = document.createElement("progress");
        p.className = "axis";
        //p.id = "a" + i;
        p.setAttribute("max", "2");
        p.setAttribute("value", "1");
        p.innerHTML = i;
        a.appendChild(p);
    }

    d.appendChild(a);

    // See https://github.com/luser/gamepadtest/blob/master/index.html
    var start = document.getElementById("start");
    if (start) {
        start.style.display = "none";
    }

    document.body.appendChild(d);
    */
    requestAnimationFrame(updateStatus);
}

function disconnecthandler(e) {
    removegamepad(e.gamepad);
}

function removegamepad(gamepad) {
    var d = document.getElementById("controller" + gamepad.index);
    document.body.removeChild(d);
    delete controllers[gamepad.index];
}

function updateStatus() {
    if (!haveEvents) {
        scangamepads();
    }

    var i = 0;
    var j;

    for (j in controllers) {
        var controller = controllers[j];
        // var d = document.getElementById("controller" + j);
        // var buttons = d.getElementsByClassName("button");
        if (controller.buttons) {
            if (controller.buttons[BTN_BACK_INDEX].pressed) {
                history.go(-1);
            }
            else if (controller.buttons[BTN_SELECT_INDEX].pressed) {
                let link = $("#overlay" + currentSelection).children()[0].href
                if (link !== undefined) {
                    location.href = link;
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
        }

        for (i = 0; i < controller.buttons.length; i++) {
            // var b = buttons[i];
            // var val = controller.buttons[i];
            /*var pressed = val == 1.0;
            if (typeof (val) == "object") {
                pressed = val.pressed;
                val = val.value;
            }

            var pct = Math.round(val * 100) + "%";
            b.style.backgroundSize = pct + " " + pct;

            if (pressed) {
                b.className = "button pressed";
            } else {
                b.className = "button";
            }*/
        }

        /*var axes = d.getElementsByClassName("axis");
        for (i = 0; i < controller.axes.length; i++) {
            var a = axes[i];
            a.innerHTML = i + ": " + controller.axes[i].toFixed(4);
            a.setAttribute("value", controller.axes[i] + 1);
        }*/
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

    if (direction === "L" && currentSelection > 0) {
        newSelection--;
    }
    else if (direction === "R" && currentSelection < 3) {
        newSelection++;
    }

    changeSelection(newSelection);
}

function scangamepads() {
    var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
    for (var i = 0; i < gamepads.length; i++) {
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