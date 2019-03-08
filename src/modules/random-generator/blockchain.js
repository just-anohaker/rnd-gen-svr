"use strict";

const SocketIOClient = require("socket.io-client");
const shufflefy = require("shufflefy");
const { modules: { Blocks } } = require("entanmo-clientjs");

const delay = require("../../utils/delay");

const kNodeServer = "http://47.102.135.35:6096";

class Blockchain {
    constructor() {
        const self = this;
        this._priv = {};
        this._priv.blockCaches = [];
        this._priv.cursorHeight = 1;
        this._priv.currentHeight = 100;


        this._blocksInst = new Blocks();

        this._socketio = SocketIOClient(kNodeServer);
        this._socketio.on("blocks/change", ({ height }) => {
            console.log("height:", height);
            this._priv.currentHeight = height;
        });


        this._loopTick = function tick() {
            if (self._priv.cursorHeight > self._priv.currentHeight) {
                setTimeout(tick, 100);
                return;
            }

            const reqHeight = self._priv.cursorHeight;
            self._blocksInst.getBlock(kNodeServer, { height: reqHeight })
                .then(result => {
                    if (result.done) {
                        const { block } = result.data;
                        // console.log(`block.height(${block.height}), block.id(${block.id})`);
                        self._priv.blockCaches.push({ id: block.id, height: block.height });
                        self._priv.cursorHeight++;
                    }
                    setTimeout(tick, 100);
                })
                .catch(error => {
                    void error;
                    setTimeout(tick, 100);
                });
        };
        // setImmediate(tick);
    }

    async init() {
        const currentHeight = await this._getHeight();
        this._priv.currentHeight = currentHeight;
        this._priv.cursorHeight = currentHeight + 1;

        const hashes = await this._getHashes(currentHeight - 100, currentHeight);
        this._priv.blockCaches.push(...hashes);

        setImmediate(this._loopTick);
    }

    async getHashes(hashCount) {
        return shufflefy(this._priv.blockCaches.slice(-hashCount));
        // const currentHeight = await this._getHeight();
        // return await this._getHashes(currentHeight - (hashCount - 1), currentHeight);
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