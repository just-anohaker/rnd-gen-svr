"use strict";

const fs = require("fs");
const path = require("path");

const Koa = require("koa");
const BodyParser = require("koa-bodyparser");
const cors = require("@koa/cors");
const SocketIO = require("socket.io");
const program = require("commander");

const appContext = require("./src/app-context");

const kAppModules = [
    ["random-generator", "./src/modules/random-generator"]
];

const _initModules = async options => {
    for (let module of kAppModules) {
        try {
            const ClzModule = require(module[1]);
            const inst = new ClzModule();
            inst && await inst.init(options);
            inst && appContext.appendModule(module[0], inst);
            console.log(`[AppINIT] module(${module[0]}) inited`);
        } catch (error) {
            console.log(`[AppINIT] module(${module[0]}) init failure, `, error);
        }
    }
};

const _setup = async options => {
    const app = new Koa();
    appContext.KoaApp = app;

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
    app.use(async (ctx, next) => {
        // koaRouter body assigned.
        ctx.body = ctx.request.body;
        await next();
    });
    // http CORS
    app.use(cors());
    // app.use(async (ctx, next) => {
    //     // http CORS
    //     ctx.response.append("Access-Control-Allow-Origin", "*");
    //     ctx.response.append("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    //     await next();
    // });
    const apiDir = path.resolve(__dirname, "src", "api");
    const APIs = fs.readdirSync(apiDir);
    APIs.forEach(el => {
        if (el.endsWith(".js")) {
            const APIModule = require(path.resolve(apiDir, el));
            APIModule(app, options);
        }
    });

    /// 未定义接口能用处理
    app.use(async ctx => {
        ctx.body = {
            success: false,
            error: "API Endpoint was not found",
            errorCode: -100
        };
    });

    const server = app.listen(options.port, options.hostname, () => {
        console.log(`[Server] Listening on ${options.hostname}:${options.port}.`);
    });
    const socketio = SocketIO(server);
    appContext.SocketIO = socketio;
};

function main() {
    program
        .version("1.0.0")
        .option("--hostname <hostname>", "Config server hostname", "0.0.0.0")
        .option("--port <port>", "Configure server port", 4567)
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
    appContext.AppOptions = options;

    _initModules(appContext.AppOptions)
        .then(() => {
            return _setup(appContext.AppOptions);
        })
        .then(() => {
            process.emit("app-ready");
        })
        .then(() => {
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

                process.emit("app-cleanup");
            });
            process.on("SIGINT", signal => {
                void signal;

                process.emit("app-cleanup");
            });
            process.on("app-cleanup", () => {
                process.exit();
            });
        })
        .catch(error => {
            console.log("[App] start error:", error);
        });
}

main();

