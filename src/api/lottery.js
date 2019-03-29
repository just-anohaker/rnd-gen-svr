"use strict";

const KoaRouter = require("koa-router");
const BigNumber = require("bignumber.js");
const Ajv = require("ajv");
let ajv = new Ajv();

const schema = require("../schema/ajv-lottery.js");
const Permutations = require("../utils/permutations");

const getLottery = async ctx => {
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
        let lottery = null;
        let number = new BigNumber(hash, 16);
        let size = Permutations.calcPermute(data);
        let index = number.mod(size).toNumber();
        lottery = Permutations.getMixingByIndex(data, index);

        if (lottery) {
            ctx.body = {
                success: true,
                index,
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