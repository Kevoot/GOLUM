import { getArduinoPort } from "../util/utils";
import { ArduinoStatus, config, ArduinoCommands } from "../config/config";
import { mainGoL } from "../app";

const SerialPort = require("serialport");

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

    public write = (data: string): void => {
        this.port.write(data);
    }

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

    public sendCalibrateCommand = (): void => {
        if (!this.isCalibrated()) {
            this.write(ArduinoCommands.CALIBRATE);
        }
    }

    public isCalibrated = (): boolean => {
        if (this.status === ArduinoStatus.NOT_CALIBRATED) {
            return false;
        }
        else {
            return false;
        }
    }
}