import { Cell } from "./cell";
import { config } from "../config/config";
import { CellState, ModuleState } from "../types/types";

export class Board {
    public board: Cell[][];

    constructor() {
        this.board = [];
        for (let i = 0; i < config.rows; i++) {
            const arr = [];
            for (let j = 0; j < config.columns; j++) {
                arr.push(new Cell(CellState.dead));
            }
            this.board.push(arr);
        }
    }

    public initRandom = () => {
        for (const cellArr of this.board) {
            for (const cell of cellArr) {
                const r = Math.floor((Math.random() * 5) + 1);
                if (r === 1) {
                    cell.setState(CellState.alive);
                }
            }
        }
    }

    public setState = (x: number, y: number, state: CellState) => {
        this.board[x][y].setState(state);
    }

    public getState = (x: number, y: number) => {
        return this.board[x][y].getState();
    }

    public step = () => {
        const future = new Board();

        for (let i = 1; i < config.rows - 1; i++) {
            for (let j = 1; j < config.columns - 1; j++) {
                // finding no Of Neighbours that are alive
                let aliveNeighbors = 0;

                // The cell needs to be subtracted from
                // its neighbours as it was counted before
                for (let m = -1; m <= 1; m++)
                    for (let n = -1; n <= 1; n++) {
                        if (this.board[i + m][j + n].getState() === CellState.alive)
                            aliveNeighbors++;
                    }

                if (this.board[i][j].getState() === CellState.alive) {
                    aliveNeighbors--;
                }

                // Cell is lonely and dies
                if (this.board[i][j].getState() === CellState.alive && (aliveNeighbors < 2)) {
                    future.setState(i, j, CellState.dead);
                }
                // Cell dies due to overpopulation
                else if (this.board[i][j].getState() === CellState.alive && (aliveNeighbors > 3)) {
                    future.setState(i, j, CellState.dead);
                }
                // A new cell is born
                else if (this.board[i][j].getState() === CellState.dead && (aliveNeighbors === 3)) {
                    future.setState(i, j, CellState.alive);
                }
                // Remains the same
                else {
                    future.setState(i, j, this.board[i][j].getState());
                }
            }
        }
        this.board = future.board;
    }

    toString = () => {
        let str = "";
        let j = 0;
        while (j < config.rows) {
            str += "\n";
            for (let i = 0; i < config.columns; i++) {
                str += "|" + (this.board[i][j].getState() === CellState.dead ? " " : "A") + "|";
            }
            j++;
        }
        return str;
    }

    toDataArray = () => {
        console.log("\nEntered toDataArray function call\n");
        const data: ModuleState[][] = [];

        for (let j = 0; j < config.rows; j += config.verticalCellsPerModule) {
            const arr: ModuleState[] = [];
            for (let i = 0; i < this.board.length; i++) {
                let val = 0;
                val += this.board[i][j].getState() << 0;
                val += this.board[i][j + 1].getState() << 1;
                val += this.board[i][j + 2].getState() << 2;
                val += this.board[i][j + 3].getState() << 3;
                arr.push(val.toString(16).toUpperCase() as ModuleState);
            }
            data.push(arr);
        }

        return data;
    }
}