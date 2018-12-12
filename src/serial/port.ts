import { getArduinoPort } from "../util/utils";
import { ArduinoStatus, config, ArduinoCommands } from "../config/config";
import { mainGoL } from "../app";

import SerialPort from "serialport";

/**
 * A layer on top of the node serialport library, used for formatting and sending data
 * to the arduino and setting up callbacks
 */
export class ArduinoPort {
    public number: number;
    public port;
    public status: string;
    public connected: boolean;

    constructor(number: number) {
        this.number = number;
        this.connected = false;

        this.port = new SerialPort(getArduinoPort(number), {
            baudRate: 9600
        });

        if (config.debug) {
            console.log("Connecting Arduino " + number + " on port " + getArduinoPort(number));
        }

        this.port.on("data", this.handleData);

        this.port.on("open", () => {
            if (config.debug) {
                console.log("Arduino #" + this.number + " on port " + getArduinoPort(number) + " connected.");
            }
            this.connected = true;
        });

        this.port.on("close", () => {
            if (config.debug) {
                console.log("Arduino #" + this.number + " on port " + this.port + " disconnected.");
            }
            this.connected = false;
        });
    }

    /**
     * Write string out to arduino
     */
    public write = (data: string): void => {
        this.port.write(data);
    }

    /**
     * When data is received, update our status and yield control to the main app to decide
     * what to do next
     */
    public handleData = (data: string): void => {
        if (config.debug) {
            console.log("Received Data: " + data);
        }
        let newStatus = this.status;
        switch (data.toString()) {
            case "N": {
                newStatus = ArduinoStatus.NOT_CALIBRATED;
                break;
            }
            case "R": {
                newStatus = ArduinoStatus.READY;
                break;
            }
            case "D": {
                newStatus = ArduinoStatus.DONE;
                break;
            }
            case "W": {
                newStatus = ArduinoStatus.WORKING;
                break;
            }
            case "U": {
                newStatus = ArduinoStatus.UNKNOWN;
                break;
            }
            case "S": {
                newStatus = ArduinoStatus.STARTED;
                break;
            }
        }
        this.status = newStatus;
        mainGoL.portUpdated(this, this.status);
    }

    /**
     * Sends the calibrate command if uncalibrated, arduino will send back "D" when done.
     */
    public sendCalibrateCommand = (): void => {
        if (this.status === ArduinoStatus.NOT_CALIBRATED) {
            this.write(ArduinoCommands.CALIBRATE);
        }
    }
}