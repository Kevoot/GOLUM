import { run, stop } from "../app";
import express from "express";
import path from "path";

class Server {
    public express;

    constructor() {
        this.express = express();
        this.mountRoutes();
    }

    private mountRoutes(): void {
        const router = express.Router();
        router.get("/", (req, res) => {
            res.sendFile(path.join(__dirname + "/index.html"));
        });
        router.get("/run", (req, res) => {
            try {
                run();
            }
            catch (ex) {
                console.log(ex);
            }
        });
        router.get("/stop", (req, res) => {
            try {
                stop();
            }
            catch (ex) {
                console.log(ex);
            }
        });
        this.express.use("/", router);
        this.express.use("/run", router);
    }
}

export default new Server().express;