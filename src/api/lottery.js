"use strict";

const KoaRouter = require("koa-router");
const BigNumber = require("bignumber.js");
const Ajv = require("ajv");
let ajv = new Ajv();

const schema = require("../schema/ajv-lottery.js");

const Permutations = require("../utils/permutations");

// const a = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33"];
// const b = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16"];

const getLottery = async ctx => {
    // let query = ctx.query;
    let query = ctx.body;

    let valid = ajv.validate(schema.lottery, query);
    if (!valid) {
        ctx.body = {
            success: false,
            error: "Error:" + ajv.errorsText(),
            errorCode: -2
        };
        return;
    }

    let data = query.data;
    let hash = query.hash;

    try {
        // console.time("permute");
        let lottery = null;
        let number = new BigNumber(hash, 16);
        let size = Permutations.calcPermute(data);
        let index = number.mod(size).toNumber();
        lottery = Permutations.getMiningByIndex(data, index);
        // console.log(size, index, lottery);
        // console.timeEnd("permute");

        if (lottery) {
            ctx.body = {
                success: true,
                lottery
            };
            return;
        }
    } catch (error) {
        void error;
    }

    ctx.body = {
        success: false,
        error: "Unknown exception",
        errorCode: -2
    };
};

module.exports = (app, opts) => {
    void opts;
    const router = new KoaRouter();

    router.post("/lottery", getLottery);

    app.use(router.routes());
};