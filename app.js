"use strict";

const fs = require("fs");
const path = require("path");

const Koa = require("koa");
const BodyParser = require("koa-bodyparser");
const SocketIO = require("socket.io");
const program = require("commander");

const { controller: gencontroller } = require("./src/modules/random-generator");

let koaApp = null;
let socketioSvr = null;

function setup(options) {
    void options;

    const app = new Koa();
    koaApp = app;

    app.on("error", (err, ctx) => {
        let reqinfo = null;
        if (ctx != null) {
            reqinfo = `${ctx.method}:${ctx.path}`;
        }
        console.error(`[KoaApp] error: ${err.toString()}${reqinfo == null ? "" : ", " + reqinfo}`);
    });

    app.use(BodyParser());
    app.use(async (ctx, next) => {
        // logger
        console.log(`${ctx.method}:${ctx.path}`);
        await next();
    });
    const apiDir = path.resolve(__dirname, "src", "api");
    const APIs = fs.readdirSync(apiDir);
    APIs.forEach(el => {
        if (el.endsWith(".js")) {
            const APIModule = require(path.resolve(apiDir, el));
            APIModule(koaApp, options);
        }
    });

    const server = app.listen(options.port, options.hostname, () => {
        console.log(`[Server] Listening on ${options.hostname}:${options.port}.`);
    });
    socketioSvr = SocketIO(server);
    gencontroller.start(rndInfo => {
        console.log(`[NewRandom] ${rndInfo.random}.`);
        socketioSvr.sockets.emit("newrandom", { random: rndInfo.random, index: rndInfo.index });
    });
}

function main() {
    program
        .version("1.0.0")
        .option("--hostname <hostname>", "Config server hostname", "0.0.0.0")
        .option("--port <port>", "Configure server port", 3000)
        .option("--dataDir <datadir>", "Configure data directory of data.", path.resolve(__dirname, "data"))
        .option("--hashCount <hashcount>", "Configure hashCount for every generate", 40)
        .option("--iter <iter>", "Configure iter times", 40)
        .option("--sha256Iter <sha256iter>", "Configure sha256 iter times", 100000)
        .option("--generateInterval <generateinterval>", "Configure delay between random generate", 60 * 1000)
        .parse(process.argv);

    const options = {};
    options.dataDir = program.dataDir;
    options.hostname = program.hostname;
    options.port = Number(program.port);
    options.hashCount = Number(program.hashCount);
    options.iter = Number(program.iter);
    options.sha256Iter = Number(program.sha256Iter);
    options.generateInterval = Number(program.generateInterval);
    setup(options);

    process.on("error", error => {
        console.error(`[Application] error: ${error.toString()}`);
    });

    process.on("uncaughtException", error => {
        console.error(`[UncaughtException] ${error.toString()}`);
    });
    process.on("unhandledRejection", (reason, promise) => {
        void promise;
        console.error(`[UnhandledRejection] ${reason}`);
    });
    process.on("rejectionHandled", promise => {
        void promise;
        console.error("[RejectionHandled] happended.");
    });

    process.on("SIGTERM", signal => {
        void signal;

        process.exit();
    });
    process.on("SIGINT", signal => {
        void signal;

        process.exit();
    });
    process.on("exit", code => {
        void code;

        gencontroller.stop();
    });
}

main();

