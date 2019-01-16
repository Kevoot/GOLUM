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
    public calibrated: boolean;

    constructor(number: number) {
        this.number = number;
        this.connected = false;
        this.calibrated = false;
        this.status = ArduinoStatus.UNKNOWN;

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
        switch (data.toString()) {
            case "N": {
                this.status = ArduinoStatus.NOT_CALIBRATED;
                this.calibrated = false;
                break;
            }
            case "C": {
                this.status = ArduinoStatus.READY;
                this.calibrated = true;
                break;
            }
            case "D": {
                this.status = ArduinoStatus.READY;
                break;
            }
            case "W": {
                this.status = ArduinoStatus.WORKING;
                break;
            }
            case "U": {
                this.status = ArduinoStatus.UNKNOWN;
                break;
            }
            case "S": {
                this.status = ArduinoStatus.STARTED;
                break;
            }
        }
        mainGoL.portUpdated(this);
    }

    /**
     * Sends the calibrate command if uncalibrated, arduino will send back "D" when done.
     */
    public sendCalibrateCommand = (): void => {
        if (this.status === ArduinoStatus.NOT_CALIBRATED) {
            this.write(ArduinoCommands.CALIBRATE);
        }
    }

    public quit = (): void => {
        this.port.on("data", this.sendQuitSignal);
        this.sendQuitSignal();
    }

    private sendQuitSignal = (): void => {
        this.port.write(ArduinoCommands.STOP);
    }
}