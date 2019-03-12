"use strict";

const _ = require("lodash");

const appContext = require("../../app-context");
const BaseModule = require("../../base-module");
const Blockchain = require("./blockchain");
const Generator = require("./generator");
const RandomDB = require("./random-db");

class Controller extends BaseModule {
    constructor() {
        super();

        this._blockchainInst = new Blockchain();
        this._generatorInst = new Generator();

        // setTimeout handler
        this._intervalId = null;

        /// generate params
        this._hashesCount = 40;
        this._iter = 40;
        this._sha256Iter = 100000;
        this._interval = 60 * 1000;

        // wait for init 
        this._dataDir = null;
        this._randomDB = null;

        process.once("app-ready", () => {
            this.start();
        });

        process.once("app-cleanup", () => {
            this.stop();
        });
    }

    async init(opts) {
        super.init();

        this.HashCount = opts.hashCount;
        this.Iter = opts.iter;
        this.Sha256Iter = opts.sha256Iter;
        this.Interval = opts.generateInterval;

        // init 
        this._dataDir = opts.dataDir;
        this._randomDB = new RandomDB(this._dataDir);
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

    async start() {
        const self = this;
        if (this._intervalId != null) return;

        await this._blockchainInst.init();
        function tick() {
            (async () => {
                const rnd = await self._generate();
                return rnd;
            })()
                .then(rnd => {
                    self.notifySocketIOClients(rnd);
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
        if (hashes == null) throw new Error("No enough hashes");
        const rnd = await this._generatorInst.rnd(hashes, this.Iter, this.Sha256Iter);
        const index = await this._randomDB.getCount();
        await this._randomDB.append({ random: rnd, index, hashes, iter: this.Iter, sha256iter: this.Sha256Iter });
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
        return await this._randomDB.getInfoByRandom(random);
    }

    async getInformationByIndex(idx) {
        if (!_.isInteger(idx)) return null;
        return await this._randomDB.getInfoByIndex(idx);
    }

    async getRandoms(offset = 0, limit = 100) {
        if (!_.isInteger(offset) && offset <= 0) offset = 0;
        if (!_.isInteger(limit) && limit <= 0) limit = 100;
        return await this._randomDB.getRandoms(offset, limit);
    }

    async getCount() {
        return await this._randomDB.getCount();
    }

    notifySocketIOClients(rnd) {
        console.log(`[NewRandom] ${rnd.random}`);
        appContext.SocketIO && appContext.SocketIO.emit("newrandom", rnd);
    }
}

module.exports = Controller;