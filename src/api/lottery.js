"use strict";

const KoaRouter = require("koa-router");
const BigNumber = require("bignumber.js");

const Permutations = require("../utils/permutations");
let permutations = new Permutations();

// const a = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33"];
// const b = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16"];

const getLottery = async ctx => {
    // let query = ctx.query;
    let query = ctx.body;
    let data = query.data;
    let hash = query.hash;

    // TODO:参数校验
    if (!data instanceof Array) {
        ctx.body = {
            success: false,
            error: "Error input format by data !",
            errorCode: -3
        };
        return;
    }

    try {
        console.time('permute');
        let lottery = null;
        let number = new BigNumber(hash, 16);
        let size = permutations.calcPermute(data);
        let index = number.mod(size).toNumber();
        lottery = permutations.getMiningIndex(data, index);

        console.log(size, index, lottery)
        console.timeEnd('permute');

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

    router.get("/lottery/get", getLottery);

    app.use(router.routes());
};