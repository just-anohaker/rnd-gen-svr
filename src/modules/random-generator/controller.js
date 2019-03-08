"use strict";

const _ = require("lodash");

const Blockchain = require("./blockchain");
const Generator = require("./generator");
const RandomDB = require("./random-db");

class Controller {
    constructor() {
        this._blockchainInst = new Blockchain();
        this._generatorInst = new Generator();
        this._randomDB = new RandomDB();

        // setTimeout handler
        this._intervalId = null;

        /// generate params
        this._hashesCount = 40;
        this._iter = 40;
        this._sha256Iter = 100000;
        this._interval = 60 * 1000;

        // databases
        this._dataDir = null;
        this._rndIndexesDB = [];
        this._rndDB = new Map();
    }

    async setup(config) {
        void config;
        this._dataDir = config.dataDir;

        this.HashCount = config.hashCount;
        this.Iter = config.iter;
        this.Sha256Iter = config.sha256Iter;
        this.Interval = config.generateInterval;

        await this.__init();
    }

    async __init() {
        // init database instances
        // console.log(`__init datadir: ${this._dataDir}`);
    }

    get Iter() {
        return this._iter;
    }

    set Iter(val) {
        if (!_.isInteger(val)) return;
        if (val <= 0) return;

        this._iter = val;
    }

    get Sha256Iter() {
        return this._sha256Iter;
    }

    set Sha256Iter(val) {
        if (!_.isInteger(val)) return;
        if (val <= 0) return;

        this._sha256Iter = val;
    }

    get HashCount() {
        return this._hashesCount;
    }

    set HashCount(val) {
        if (!_.isInteger(val)) return;
        if (val <= 0) return;

        this._hashesCount = val;
    }

    get Interval() {
        return this._interval;
    }

    set Interval(val) {
        if (!_.isInteger(val)) return;
        if (val <= 0) return;

        this._interval = val;
    }

    async start(tickcallback) {
        if (this._intervalId != null) {
            return;
        }

        await this._blockchainInst.init();

        const self = this;

        function tick() {
            (async () => {
                const rnd = await self._generate();
                return rnd;
            })()
                .then(rnd => {
                    tickcallback && tickcallback(rnd);
                    self._intervalId = setTimeout(tick, self.Interval);
                })
                .catch(error => {
                    void error;
                    console.log("generate error:", error);
                    self._intervalId = setTimeout(tick, self.Interval);
                });
        }

        this._intervalId = setTimeout(tick, 0);
    }

    async isstarted() {
        if (this._intervalId == null) {
            return false;
        }

        return true;
    }

    async stop() {
        if (this._intervalId != null) {
            clearTimeout(this._intervalId);
            this._intervalId = null;
        }
    }

    async _generate() {
        const hashes = await this._blockchainInst.getHashes(this.HashCount);
        const rnd = await this._generatorInst.rnd(hashes, this.Iter, this.Sha256Iter);
        const index = this._rndIndexesDB.length;
        this._randomDB.append({ random: rnd, index, hashes, iter: this.Iter, sha256iter: this.Sha256Iter });
        this._rndDB.set(rnd, { random: rnd, index, hashes, iter: this.Iter, sha256iter: this.Sha256Iter });
        this._rndIndexesDB.push(rnd);
        return {
            random: rnd,
            index,
            hashes,
            iter: this.Iter,
            sha256iter: this.Sha256Iter
        };
    }

    async getInformationByRandom(random) {
        if (!_.isString(random)) return null;
        if (!this._rndDB.has(random)) return null;

        // await this._randomDB.getInfoByRandom(random);
        return this._rndDB.get(random);
    }

    async getInformationByIndex(idx) {
        if (!_.isInteger(idx)) return null;
        if (idx < 0 || idx >= this._rndIndexesDB.length) return null;

        // await this._randomDB.getInfoByIndex(idx);
        return await this.getInformationByRandom(this._rndIndexesDB[idx]);
    }

    async getRandoms(offset = 0, limit = 100) {
        if (!_.isInteger(offset) && offset <= 0) offset = 0;
        if (!_.isInteger(limit) && limit <= 0) limit = 100;

        // await this._randomDB.getRandoms(offset, offset + limit);
        return this._rndIndexesDB.slice(offset, offset + limit);
    }

    async getCount() {
        // await this._randomDB.getCount();
        return this._rndIndexesDB.length;
    }
}

module.exports = Controller;