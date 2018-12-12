import { CellState } from "../types/types";

/**
 * Simple class representing the current status of any given cell on the GoL grid
 */
export class Cell {
    public state: CellState;
    constructor(state) {
        this.state = state;
    }

    public getState = (): CellState => {
        return this.state;
    }

    public setState = (state: CellState) => {
        this.state = state;
    }
}