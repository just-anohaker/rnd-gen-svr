"use strict";

const SocketIOClient = require("socket.io-client");
const { modules: { Blocks } } = require("entanmo-clientjs");

const delay = require("../../utils/delay");

// const kNodeServer = "http://47.102.135.35:6096";
const kNodeServer = "http://20.188.242.113:4098";

class Blockchain {
    constructor() {
        const self = this;
        this._priv = {};
        this._priv.blockCaches = [];
        this._priv.cursorHeight = 1;
        this._priv.currentHeight = 100;

        this._blocksInst = new Blocks();

        this._loopTick = function tick() {
            (async () => {
                if (self._priv.cursorHeight > self._priv.currentHeight) return;

                const results = await self._blocksInst.getBlocks(kNodeServer, { offset: self._priv.cursorHeight, limit: 100 });
                if (results.done) {
                    const { blocks } = results.data;
                    for (let block of blocks) {
                        self._priv.blockCaches.push({ id: block.id, height: block.height });
                        self._priv.cursorHeight++;
                    }

                    console.log("[Blockchain] NewCursor:", self._priv.cursorHeight);
                }
            })()
                .then(() => setTimeout(tick, 100))
                .catch(error => { void error; setTimeout(tick, 100); });
        };
    }

    async init(latestBlockHeight) {
        const currentHeight = await this._getHeight();
        this._priv.currentHeight = currentHeight;
        this._priv.cursorHeight = latestBlockHeight || 1;

        const hashes = await this._getHashes(this._priv.cursorHeight, this._priv.cursorHeight + 100);
        this._priv.blockCaches.push(...hashes);
        this._priv.cursorHeight += hashes.length;

        /// for socketio client
        this._socketio = SocketIOClient(kNodeServer);
        this._socketio.on("blocks/change", ({ height }) => {
            console.log(`[Blockchain] NewHeight: ${height}`);
            this._priv.currentHeight = height;
        });

        setImmediate(this._loopTick);
    }

    async getHashes(hashCount) {
        const blockCount = this._priv.blockCaches.length;
        let newHashes = null;
        if (blockCount >= hashCount) {
            newHashes = this._priv.blockCaches.slice(0, hashCount);
            this._priv.blockCaches.splice(0, 1);
        }
        return newHashes;
    }

    async _getHeight() {
        let height = 0;
        while (true) {
            try {
                const resp = await this._blocksInst.getHeight(kNodeServer);
                if (resp.done) {
                    height = resp.data.height;
                    break;
                }
            } catch (error) {
                void error;
            }
            delay(500);
        }
        return height;
    }

    async _getHashes(from, to) {
        const blockHashes = [];
        let loadCount = 0;
        while (true) {
            try {
                const resp = await this._blocksInst.getBlocks(kNodeServer, { offset: from + loadCount, limit: 100 });
                if (!resp.done) {
                    continue;
                }
                const { blocks } = resp.data;
                for (let i = 0; i < blocks.length; i++) {
                    const b = blocks[i];
                    blockHashes.push({ id: b.id, height: b.height });
                    loadCount++;
                    if (from + loadCount >= to + 1) {
                        break;
                    }
                }
                if (from + loadCount >= to + 1) {
                    break;
                }
            } catch (error) {
                void error;
            }

            delay(500);
        }
        return blockHashes;
    }
}

module.exports = Blockchain;