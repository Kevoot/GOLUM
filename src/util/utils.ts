import { config } from "../config/config";

export function getArduinoPort(arduino_num: number): string {
    return config.arduinos[0].arduinoPort;
}