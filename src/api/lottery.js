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
        ctx.body = {
            success: false,
            error: error.toString(),
            errorCode: -2
        };
        return;
    }

    ctx.body = {
        success: false,
        error: "Unknown exception",
        errorCode: -2
    };
};

const getLotteryPagedata = async ctx => {
    let query = ctx.body;

    let valid = ajv.validate(schema.pagedata, query);
    if (!valid) {
        ctx.body = {
            success: false,
            error: "Error:" + ajv.errorsText(),
            errorCode: -2
        };
        return;
    }

    let data = query.data;
    let index = 0;
    let limit = query.limit || 20;

    try {
        let lotterys = [];
        let size = Permutations.calcPermute(data);

        if (query.index) {
            index = query.index;
        } else {
            let number = new BigNumber(query.hash, 16);

            index = number.mod(size).toNumber();
        }

        let first = index - index % limit;

        limit = limit < size ? limit : size;
        let len = limit;
        if (size < first + limit) {
            len = size - first;
        }
        
        for (let i = 0; i < len; i++) {
            let temp = Permutations.getMixingByIndex(data, first + i);
            if (temp) {
                lotterys.push({
                    isChoosed: (first + i) === index,
                    index: first + i,
                    lottery: temp
                });
            }
        }

        if (lotterys) {
            ctx.body = {
                success: true,
                lotterys
            };
            return;
        }
    } catch (error) {
        ctx.body = {
            success: false,
            error: error.toString(),
            errorCode: -2
        };
        return;
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
    router.post("/lottery/pagedata", getLotteryPagedata);

    app.use(router.routes());
};