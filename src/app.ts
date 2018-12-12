import path from "path";
import { config, ArduinoStatus } from "./config/config";
import { ArduinoPort } from "./serial/port";
import { Board } from "./GoL/board";
import { CellState, ModuleState, PortCommand } from "./types/types";

export let mainGoL: App;

export class App {
  // from config.ts
  public config;

  // Array of serial comms ports to the arduinos
  public arduinoPorts: ArduinoPort[];

  // Stores an array of commands to be executed in an FIFO order
  // TODO: Extend the array type to ensure safety on this, as using just push/pop would
  // cause an out of order execution.
  public commandBuffer: PortCommand[];

  // The grid for GoL
  public board: Board;

  constructor() {
    this.config = config;
    this.arduinoPorts = [];
    this.commandBuffer = [];

    this.board = new Board();
  }

  /**
   * Creates an array of new ports to the arduinos based on the available config options
   */
  public createPortContainer = () => {
    for (let i = 0; i < config.arduinos.length; i++) {
      this.arduinoPorts.push(new ArduinoPort(i));
    }
  }

  /**
   * Upon an arduino returning a new status, see if we can execute a new command yet
   */
  public portUpdated = (port: ArduinoPort, status: string) => {
    // If arduino is already working, don't send any new commands
    if (status === ArduinoStatus.CONNECTING || status === ArduinoStatus.UNKNOWN || status === ArduinoStatus.WORKING) {
      return;
    }

    // If an arduino just completed a command, then send the next one
    if (status === ArduinoStatus.NOT_CALIBRATED) {
      port.sendCalibrateCommand();
    }
    else if (this.commandBuffer.length > 0 && (status === ArduinoStatus.DONE || status === ArduinoStatus.READY )) {
      if (this.canExecute()) {
        const command = this.commandBuffer.shift();
        command.fn.apply(this.arduinoPorts[command.portNumber], command.args);
      }
    }
  }

  /**
   * Forces a calibration (currently unused)
   */
  public beginCalibration = () => {
    for (const port of this.arduinoPorts) {
      this.commandBuffer.push({ portNumber: port.number, fn: port.sendCalibrateCommand, args: undefined });
    }
  }

  /**
   * Pushes a new command into the commandBuffer queue
   */
  public sendModuleData = (port: number, moduleState: ModuleState) => {
    this.commandBuffer.push({ portNumber: port, fn: this.arduinoPorts[port].write, args: [ moduleState ] });
  }

  /**
   * Returns if any commands from the commandBuffer can execute
   */
  public canExecute = (): boolean => {
    if (this.getWorkingCount() < config.MAX_WORKERS) {
      return true;
    }
    else {
      return false;
    }
  }

  /**
   * Retrieves the number of arduinos currently working
   */
  public getWorkingCount = (): number => {
    let workingNum = 0;

    for (const port of this.arduinoPorts) {
      if (port.status === ArduinoStatus.WORKING) {
        workingNum++;
      }
    }

    return workingNum;
  }

  /**
   * Test by forcing a value of 7 for the first module and writing to arduino
   */
  public test = () => {
    this.board.setState(0, 0, CellState.alive);
    this.board.setState(0, 1, CellState.alive);
    this.board.setState(0, 2, CellState.alive);
    // Should be a value of 7
    console.log("Test board 1: \n" + this.board.toString());
    console.log("Sending data to Buffer\n");

    const dataArray = this.board.toDataArray();
    const str = "M0S" + dataArray[0][0];

    this.sendModuleData(0, (str) as ModuleState );
  }
}

export function main() {
  if (config.debug) {
    console.log("Starting nodeGoL");
  }

  mainGoL = new App();

  mainGoL.createPortContainer();

  // mainGoL.test();

  // Force an update every 5 seconds in case any comms weren't received
  setInterval(function() {
    if (mainGoL.canExecute()) {
      if (config.debug) {
        console.log("Can execute!");
        console.log("Command Buffer size: " + mainGoL.commandBuffer.length);
      }
      mainGoL.portUpdated(undefined, ArduinoStatus.READY);
    }
  }, 5000);

  return 0;
}

main();