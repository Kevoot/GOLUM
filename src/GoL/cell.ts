import { CellState } from "../types/types";

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