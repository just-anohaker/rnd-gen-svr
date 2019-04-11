"use strict";

const KoaRouter = require("koa-router");
const { BigNumber } = require("bignumber.js");

const appContext = require("../app-context");
const schema = require("../schema/ajv-lottery.js");
const Permutations = require("../utils/permutations");
const Exception = require("../utils/exception");
const Response = require("../utils/response");

const getLottery = async ctx => {
    try {
        let lottery = null;

        let query = ctx.body;
        let valid = appContext.Validator.validate(schema.lottery, query);
        if (!valid) {
            throw Exception.ofUnvalidateParameter("ajv validate failure, " + appContext.Validator.errorsText());
        }

        let data = query.data;
        let hash = query.hash;

        let number = new BigNumber(hash.toLowerCase(), 16);
        let size = Permutations.calcPermute(data);
        let index = number.mod(size).toNumber();
        lottery = Permutations.getMixingByIndex(data, index);

        lottery === null
            ? Response.exception(ctx, Exception.ofNoMatchedResult())
            : Response.success(ctx, { index, lottery });
    } catch (error) {
        return Response.exception(ctx, error);
    }
};

const getLotteryPagedata = async ctx => {
    try {
        let lotterys = [];

        let query = ctx.body;
        let valid = appContext.Validator.validate(schema.pagedata, query);
        if (!valid) {
            throw Exception.ofUnvalidateParameter("ajv validate failure, " + appContext.Validator.errorsText());
        }

        let data = query.data;
        let index = 0;
        let limit = query.limit || 20;

        let size = Permutations.calcPermute(data);

        if (query.index || query.index === 0) {
            index = query.index;
            if (index >= size) {
                throw Exception.ofUnvalidableParameter(`The index(${index}) is out of size(${size})`);
            }
        } else {
            let number = new BigNumber(query.hash.toLowerCase(), 16);

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
        lotterys.length === 0
            ? Response.exception(ctx, Exception.ofNoMatchedResult())
            : Response.success(ctx, { lotterys });
    } catch (error) {
        return Response.exception(ctx, error);
    }
};

module.exports = (app, opts) => {
    void opts;
    const router = new KoaRouter();

    router.post("/lottery", getLottery);
    router.post("/lottery/pagedata", getLotteryPagedata);

    app.use(router.routes());
};