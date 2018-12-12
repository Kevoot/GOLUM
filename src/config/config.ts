export let config = {
    rows: 24,
    columns: 24,
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
        } // ,
        // {
        //     arduinoPort: "COM4",
        //     arduinoNumber: 1
        // }
    ],
    debug: true,
    NUM_SERIAL_ROWS: 6,
    NUM_SERIAL_COLUMNS: 24,
    MAX_WORKERS: 1
};

export const ArduinoStatus = {
    UNKNOWN: "U",
    NOT_CALIBRATED: "N",
    READY: "R",
    WORKING: "W",
    DONE: "D",
    STARTED: "S",
    CONNECTING: "C0",
    CONNECTED: "C1"
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