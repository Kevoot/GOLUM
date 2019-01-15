import { config } from "../config/config";

/**
 *
 * @param arduino_num Number of arduino we want the port number of
 * @returns string containing the port name used in a serialport constructor
 */
export function getArduinoPort(arduino_num: number): string {
    return config.arduinos[arduino_num].arduinoPort;
}