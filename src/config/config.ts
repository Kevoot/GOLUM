export let config = {
    rows: 24,
    columns: 14,
    waitTime: 0,
    generation: 0,
    verticalCellsPerModule: 4,
    ip: "127.0.0.1",
    port: 41234,
    onTime: "0800",
    offTime: "0600",
    arduinos: [
        {
            arduinoPort: "COM3",
            arduinoNumber: 0,
        },
        {
             arduinoPort: "COM8",
             arduinoNumber: 1
        }
    ],
    debug: true,
    NUM_MODULES_PER_ARDUINO: 11,
    NUM_SERIAL_ROWS: 6,
    NUM_SERIAL_COLUMNS: 14,
    MAX_WORKERS: 4
};

export const ArduinoStatus = {
    UNKNOWN: "U",
    NOT_CALIBRATED: "N",
    CALIBRATED: "C",
    READY: "R",
    WORKING: "W",
    DONE: "D",
    STARTED: "S",
    CONNECTING: "C0",
    CONNECTED: "C1",
    IDENTIFY: "I"
};

export const ArduinoCommands = {
    CALIBRATE: "C",
    STOP: "S",
    MOVE: "M"
};

export const ServerModes = {
    INITIALIZING: "I",
    CONNECTING: "C",
    STEPPING: "S",
    AWAITING: "A",
    SHUTTING_DOWN: "SD"
};