import path from "path";
import { config, ArduinoStatus, ArduinoCommands } from "./config/config";
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

  public running: boolean;
  public workers;
  public stepWorker: NodeJS.Timer;
  public quitRequested: boolean;

  constructor() {
    this.config = config;
    this.arduinoPorts = [];
    this.commandBuffer = [];
    this.running = false;
    this.workers = [];
    this.quitRequested = false;

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
  public portUpdated = (port: ArduinoPort) => {
    if (port.status === ArduinoStatus.NOT_CALIBRATED) {
      port.sendCalibrateCommand();
    }
    // If the arduino completes calibration or finishes a task, set off an update task.
    else if (port.status === ArduinoStatus.READY) {
      // Since we finished a task, set off a new one.
      if (this.workers.length <= config.MAX_WORKERS) {
        this.submitWorker(config.workerWait);
      }
    }
  }

  public runUpdate = (): void => {
    if (!this.quitRequested) {
      if (this.commandBuffer.length > 0) {
        if (this.canExecute()) {
          const command = this.commandBuffer.shift();
          // If the arduino next in the queue is still working, send it to the back of the queue
          if (this.arduinoPorts[command.portNumber].status !== ArduinoStatus.READY) {
            this.commandBuffer.push(command);
          }
          else {
            command.fn.apply(this.arduinoPorts[command.portNumber], command.args);
          }
          config.debug ? console.log("Size of command buffer: " + this.commandBuffer.length) : undefined;
        }
      }
      else if (this.commandBuffer.length <= 0 && this.getWorkingCount() < 1) {
        if (!this.stepWorker) {
          (function run() {
            mainGoL.board.step();
            mainGoL.sendDataArray(mainGoL.board.toDataArray());
            mainGoL.stepWorker = setTimeout(run, config.stepWait);
          })();
        }
      }
      if (!this.canExecute()) {
        clearInterval(this.workers.pop());
      }
    }
  }


  public submitWorker = (timeout: number): void => {
    this.workers.push(setInterval(function () {
      if (mainGoL.canExecute() && mainGoL.isCalibrationComplete()) {
        if (config.debug) {
          console.log("200ms update");
        }
        mainGoL.runUpdate();
      }
    }, timeout));
  }

  /**
   * Forces a calibration (currently unused)
   */
  public beginCalibration = (): void => {
    for (const port of this.arduinoPorts) {
      this.commandBuffer.push({ portNumber: port.number, fn: port.sendCalibrateCommand, args: undefined });
    }
  }

  /**
   * Pushes a new command into the commandBuffer queue
   */
  public sendModuleData = (port: number, targetState: string): void => {
    if (this.arduinoPorts[port] && !this.quitRequested) {
      this.commandBuffer.push({ portNumber: port, fn: this.arduinoPorts[port].write, args: [targetState] });
    }
  }

  public sendDataArray = (dataArray: ModuleState[][]): void => {
    console.log(this.board.toString());

    let currentArduino = 0;
    let counter = 0;
    let packet = [];

    for (let i = 0; i < (config.rows / config.CELLS_PER_MODULE); i++) {
      for (let j = 0; j < config.columns; j++) {
        packet.push("M" + counter + "S" + dataArray[i][j]);
        counter++;
        if (counter === config.NUM_MODULES_PER_ARDUINO) {
          // Submit each module the arduino is responsible for immediate processing or submission to command buffer
          for (const str of packet) {
            this.sendModuleData(currentArduino, str);
          }
          packet = [];
          counter = 0;
          currentArduino++;
        }
      }
    }

    // Have to send one more time for the leftover data since the last arduino may not
    // have the max number of modules
    if (packet.length > 0) {
      for (const str of packet) {
        this.sendModuleData(currentArduino, str);
      }
    }
  }

  /**
   * Returns if any commands from the commandBuffer can execute
   */
  public canExecute = (): boolean => {
    if (this.getWorkingCount() > 0) {
      const thing = 0;
    }
    if (this.getWorkingCount() < config.MAX_WORKERS) {
      return true;
    }
    else {
      return false;
    }
  }

  public isCalibrationComplete = (): boolean => {
    for (const port of this.arduinoPorts) {
      if (!port.calibrated) {
        return false;
      }
    }
    return true;
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

  public shutDown = (): void => {
    this.quitRequested = true;

    for (const worker of mainGoL.workers) {
      clearInterval(worker);
    }

    clearTimeout(mainGoL.stepWorker);
    for (const port of mainGoL.arduinoPorts) {
        port.quit();
      }
  }
}

export function run() {
  if (config.debug) {
    console.log("Starting nodeGoL");
  }

  mainGoL = new App();

  mainGoL.createPortContainer();

  mainGoL.board.initRandom();
}

export function stop() {
  mainGoL.shutDown();
  mainGoL = undefined;
}