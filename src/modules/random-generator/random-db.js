"use strict";

const path = require("path");
const level = require("level");
const lexint = require("lexicographic-integer-encoding")("hex");

class RandomDB {
    constructor(dataDir) {
        /// db name for save random informations
        this._rndDBPath = path.resolve(dataDir, "rnd.leveldb");
        /// leveldb instance for save random informations
        this._rndDB = level(this._rndDBPath);

        /// db name for save random indexed informations
        this._rndIndexDBPath = path.resolve(dataDir, "rnd_index.leveldb");
        /// leveldb instance for save random indexed informations
        this._rndIndexDB = level(this._rndIndexDBPath, { keyEncoding: lexint });

        /// the _count for mark the total count of random
        this._count = null;
    }

    async append(rndinfo) {
        await this._rndDB.put(rndinfo.random, rndinfo, { valueEncoding: "json" });
        await this._rndIndexDB.put(rndinfo.index, rndinfo.random);
        this._count = rndinfo.index + 1;
    }

    async getCount() {
        if (this._count == null) {
            try {
                this._count = await new Promise((resolve, reject) => {
                    let result = 0;
                    this._rndIndexDB.createKeyStream({ reverse: true, limit: 1 })
                        .on("data", key => {
                            result = key + 1;
                        })
                        .on("end", () => {
                            return resolve(result);
                        })
                        .on("error", error => {
                            console.log(error);
                            return reject(error);
                        });
                });
            } catch (error) {
                void error;
            }
        }
        return this._count;
    }

    async getInfoByIndex(index) {
        let info;
        try {
            const rndHash = await this._rndIndexDB.get(index);
            info = await this.getInfoByRandom(rndHash);
        } catch (error) {
            console.log("[RandomDB] getInfoByIndex error:", error);
        }
        return info;
    }

    async getInfoByRandom(rndHash) {
        let info;
        try {
            info = await this._rndDB.get(rndHash, { valueEncoding: "json" });
        } catch (error) {
            console.log("[RandomDB] getInfoByRandom error:", error);
        }
        return info;
    }

    async getRandoms(offset, limit, reverse = false) {
        const randoms = [];
        try {
            const rnds = await new Promise((resolve, reject) => {
                const results = [];
                this._rndIndexDB.createReadStream({ gte: offset, limit, reverse })
                    .on("data", pair => {
                        results.push(pair.value);
                    })
                    .on("end", () => {
                        return resolve(results);
                    })
                    .on("error", error => {
                        return reject(error);
                    });
            });
            randoms.push(...rnds);
        } catch (error) {
            void error;
        }
        return randoms;
    }

    async getLatestBlockHeight() {
        try {
            let count = await this.getCount();
            if (count == null || count <= 0) {
                return 1;
            }

            const info = await this.getInfoByIndex(count - 1);
            if (info == null) {
                return 1;
            }

            console.log(`[RandomDB] latestBlockHeight: ${info.hashes[0].height}`);
            return info.hashes[0].height;
        } catch (error) {
            console.log("[RandomDB] getLatestBlockHeight:", error);
        }
        return 1;
    }
}

module.exports = RandomDB;