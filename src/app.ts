import path from "path";
import { config, ArduinoStatus } from "./config/config";
import { ArduinoPort } from "./serial/port";
import { Board } from "./GoL/board";
import { CellState, ModuleState } from "./types/types";

export let mainGoL: App;

export class App {
  public config;
  public arduinoPorts: ArduinoPort[];
  public commandBuffer;
  public board: Board;
  public numArduinosWorking: number;

  constructor() {
    this.config = config;
    this.arduinoPorts = [];
    this.commandBuffer = [];

    this.board = new Board();
    this.numArduinosWorking = 0;
  }

  public createPortContainer = () => {
    for (let i = 0; i < config.arduinos.length; i++) {
      this.arduinoPorts.push(new ArduinoPort(i));
    }
  }

  public portUpdated = (port: ArduinoPort, status: string) => {
    // If arduinon is already working, don't send any new commands
    if (status === ArduinoStatus.CONNECTING || status === ArduinoStatus.UNKNOWN || status === ArduinoStatus.WORKING) {
      return;
    }

    // If an arduino just completed a command, then send the next one
    if (status === ArduinoStatus.NOT_CALIBRATED) {
      port.sendCalibrateCommand();
    }
    else if (this.commandBuffer.length > 0 && (status === ArduinoStatus.DONE || status === ArduinoStatus.READY )) {
      if (this.canExecute()) {
        const command = this.commandBuffer.pop();
        const fn = command.fn;
        const args = command.args;

        (fn as Function).apply(this.arduinoPorts[command.num], args);
        console.log("fn: " + fn);
        console.log("arg info: " + (args[0] === undefined ? "N/A" : args[0]));
      }
    }
  }

  public beginCalibration = () => {
    for (const port of this.arduinoPorts) {
      this.commandBuffer.push({ num: port.number, fn: port.sendCalibrateCommand, args: undefined });
    }
  }

  public sendModuleData = (port: number, moduleState: ModuleState) => {
    this.commandBuffer.push({ obj: this.arduinoPorts[port], fn: this.arduinoPorts[port].write, args: [ moduleState ] });
  }

  public canExecute = (): boolean => {
    if (this.getWorkingCount() < config.MAX_WORKERS) {
      return true;
    }
    else {
      return false;
    }
  }

  public getWorkingCount = (): number => {
    let workingNum = 0;

    for (const port of this.arduinoPorts) {
      if (port.status === ArduinoStatus.WORKING) {
        workingNum++;
      }
    }

    return workingNum;
  }

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

    /*this.board = new Board();
    // Should be 1
    this.board.setState(0, 0, CellState.alive);
    console.log("Test board 2: \n" + this.board.toString());
    console.log("Sending data to Buffer\n");
    dataArray = this.board.toDataArray();
    this.sendModuleData(0, dataArray[0][0]);

    this.board = new Board();
    // Should be 3
    this.board.setState(0, 0, CellState.alive);
    this.board.setState(0, 1, CellState.alive);
    console.log("Test board 3: \n" + this.board.toString());
    console.log("Sending data to Buffer\n");
    dataArray = this.board.toDataArray();
    this.sendModuleData(0, dataArray[0][0]);*/
  }

}

export function main() {
  if (config.debug) {
    console.log("Starting nodeGoL");
  }

  mainGoL = new App();

  mainGoL.createPortContainer();
  // mainGoL.beginCalibration();

  if (config.debug) {
    console.log("Created port container");
  }

  mainGoL.test();

  setInterval(function() {
    console.log("Testing if able to execute");
    if (mainGoL.canExecute()) {
      console.log("Can execute!");
      console.log("Command Buffer size: " + mainGoL.commandBuffer.length);
      mainGoL.portUpdated(undefined, ArduinoStatus.READY);
    }
  }, 5000);

  return 0;
}

main();