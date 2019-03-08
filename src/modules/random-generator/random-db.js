"use strict";

const fs = require("fs");
const path = require("path");
const level = require("level");

class RandomDB {
    constructor() {
        const dataDir = path.resolve(__dirname, "data");
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }

        this._rnd_db = level(path.resolve(dataDir, "rnd.db"));
        this._rnd_index_db = level(path.resolve(dataDir, "rnd_index.db"));
    }

    async append(rndinfo) {
        void rndinfo;
        // TODO
        this._rnd_db.set(rndinfo.random, rndinfo, { valueEncoding: "json" });
        this._rnd_index_db.set(rndinfo.index.toString(), rndinfo.random);
    }

    async getCount() {
        // TODO
    }

    async getInfoByIndex(index) {
        void index;
        // TODO
    }

    async getInfoByRandom(rndHash) {
        void rndHash;
        // TODO
    }

    async getRandoms(offset, limit) {
        void offset;
        void limit;
        // TODO
    }
}

module.exports = RandomDB;