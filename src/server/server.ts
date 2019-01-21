import express from "express";
import path from "path";
import { spawn, SpawnOptions, ChildProcess } from "child_process";
import psTree = require("ps-tree");

export function kill (pid, signal?, callback?) {
    signal   = signal || "SIGKILL";
    callback = callback || function () {};
    const killTree = true;
    if (killTree) {
        psTree(pid, function (err, children) {
            [pid].concat(
                children.map(function (p) {
                    return p.PID;
                })
            ).forEach(function (tpid) {
                try { process.kill(tpid, signal); }
                catch (ex) { }
            });
            callback();
        });
    } else {
        try { process.kill(pid, signal); }
        catch (ex) { }
        callback();
    }
}

class Server {
    public express;
    public appInstance: ChildProcess;

    constructor() {
        this.express = express();
        this.mountRoutes();
        this.appInstance = spawn("node", ["../app.js"]);
    }

    private mountRoutes(): void {
        const router = express.Router();
        router.get("/", (req, res) => {
            res.sendFile(path.join(__dirname + "/public/index.html"));
        });
        /*router.get("/running.html", (req, res) => {
            try {
                res.sendFile(path.join(__dirname + "/public/running.html"));
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
        });*/
        this.express.post("/randomize", (req, res) => {
            try {
                console.log("***Randomizing***");
                kill(this.appInstance.pid);
                this.appInstance = spawn("node", ["../app.js"]);
            }
            catch (ex) {
                console.log(ex);
            }
        });
        this.express.use("/", router);
        this.express.use("/randomize", router);
        this.express.use(express.static(__dirname + "/public"));
    }
}

export default new Server().express;