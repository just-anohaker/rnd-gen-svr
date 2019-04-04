"use strict";

const KoaRouter = require("koa-router");

const appContext = require("../app-context");
const Exception = require("../utils/exception");
const Response = require("../utils/response");

const getinformationhandler = async ctx => {
    try {
        const query = ctx.query;
        let hash = null, idx = null;
        if (query.hash) hash = query.hash;
        if (query.index) {
            Number.isSafeInteger(Number(query.index)) ? idx = Number(query.index) : undefined;
        }
        const generator = appContext.getModule("random-generator");
        if (!generator) {
            throw Exception.ofUnknown("get random generator module instance failure");
        }

        let info = null;
        if (hash != null) {
            info = await generator.getInformationByRandom(hash);
        } else if (idx != null) {
            info = await generator.getInformationByIndex(idx);
        } else {
            throw Exception.ofUnvalidableParameter("Invalid query parameters");
        }

        info == null
            ? Response.exception(ctx, Exception.ofNoMatchedResult())
            : Response.success(ctx, { information: info });
    } catch (error) {
        let exception = error;
        if (!(error instanceof Exception)) {
            exception = Exception.ofUnknown(error.toString());
        }
        return Response.exception(ctx, exception);
    }
};

const getrandomshandler = async ctx => {
    try {
        const query = ctx.query;
        const offset = Number.isSafeInteger(Number(query.offset)) ? Number(query.offset) : 0;
        if (offset < 0) {
            throw Exception.ofUnvalidableParameter("offset must more than or equal zero");
        }
        const limit = Number.isSafeInteger(Number(query.limit)) ? Number(query.limit) : 100;
        if (limit < 0) {
            throw Exception.ofUnvalidableParameter("limit must more than or equal zero");
        }
        const nReverse = Number.isSafeInteger(Number(query.reverse));
        const reverse = (nReverse && Number(query.reverse) == 1) ? true : false;

        const generator = appContext.getModule("random-generator");
        if (!generator) {
            throw Exception.ofUnknown("get random generator module instance failure");
        }

        const count = await generator.getCount();
        let queryOffset = offset, queryLimit = limit;
        if (reverse) {
            queryOffset = count - limit - offset;
            if (queryOffset < 0) queryOffset = 0;
            const validCount = count - queryOffset;
            queryLimit = Math.min(queryLimit, validCount);
        }
        const rnds = await generator.getRandoms(queryOffset, queryLimit);
        return rnds == null
            ? Response.exception(ctx, Exception.ofNoMatchedResult())
            : Response.success(ctx, { randoms: rnds, count });
    } catch (error) {
        let exception = error;
        if (!(error instanceof Exception)) {
            exception = Exception.ofUnknown(error.toString());
        }
        Response.exception(ctx, exception);
    }
};

const getcounthandler = async ctx => {
    try {
        const generator = appContext.getModule("random-generator");
        if (!generator) {
            throw Exception.ofUnknown("get random generator module instance failure");
        }
        const count = await generator.getCount();
        return count == null
            ? Response.exception(ctx, Exception.ofNoMatchedResult())
            : Response.success(ctx, { count });
    } catch (error) {
        let exception = error;
        if (!(error instanceof Exception)) {
            exception = Exception.ofUnknown(error.toString());
        }
        return Response.exception(ctx, exception);
    }
};

module.exports = (app, opts) => {
    void opts;
    const router = new KoaRouter();

    router.get("/random/getInfo", getinformationhandler);
    router.get("/random", getrandomshandler);
    router.get("/random/count", getcounthandler);

    app.use(router.routes());
};