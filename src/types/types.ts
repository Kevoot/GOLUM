export enum CellState {
    alive = 1,
    dead = 0
}

// Data to be passed to the arduino (not yet in use)
export enum ModuleState {
    s0 = "0",
    s1 = "1",
    s2 = "2",
    s3 = "3",
    s4 = "4",
    s5 = "5",
    s6 = "6",
    s7 = "7",
    s8 = "8",
    s9 = "9",
    s10 = "A",
    s11 = "B",
    s12 = "C",
    s13 = "D",
    s14 = "E",
    s15 = "F"
}

// To create a valid port command, we need a port number, a function
// from the port class, and the arguments
export type PortCommand = {
    portNumber: number,
    fn: Function,
    args: string[]
};