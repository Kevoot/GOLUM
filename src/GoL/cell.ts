import { CellState } from "../types/types";

/**
 * Simple class representing the current status of any given cell on the GoL grid
 */
export class Cell {
    public state: CellState;

    public adjN: Cell;
    public adjS: Cell;
    public adjE: Cell;
    public adjW: Cell;

    constructor(state) {
        this.state = state;
    }

    public getState = (): CellState => {
        return this.state;
    }

    public setState = (state: CellState) => {
        this.state = state;
    }

    public isAlive = (): number => {
        return this.state;
    }

    public setNeighbors(north?: Cell, south?: Cell, east?: Cell, west?: Cell) {
        this.adjN = north;
        this.adjS = south;
        this.adjE = east;
        this.adjW = west;
    }

    public getAdjacentNorth = (): Cell => {
        return this.adjN;
    }

    public getAdjacentSouth = (): Cell => {
        return this.adjS;
    }

    public getAdjacentEast = (): Cell => {
        return this.adjE;
    }

    public getAdjacentWest = (): Cell => {
        return this.adjW;
    }

    public setAdjacentNorth = (adj: Cell): void => {
        this.adjN = adj;
    }

    public setAdjacentSouth = (adj: Cell): void => {
        this.adjS = adj;
    }

    public setAdjacentEast = (adj: Cell): void => {
        this.adjE = adj;
    }

    public setAdjacentWest = (adj: Cell): void => {
        this.adjW = adj;
    }

    public getAliveNeighbors = (): number => {
        let alive = 0;
        // N
        if (this.adjN !== undefined && this.adjN.isAlive()) {
            alive++;
        }
        if (this.adjS !== undefined && this.adjS.isAlive()) {
            alive++;
        }
        if (this.adjE !== undefined && this.adjE.isAlive()) {
            alive++;
        }
        if (this.adjW !== undefined && this.adjW.isAlive()) {
            alive++;
        }
        return alive;
    }
}