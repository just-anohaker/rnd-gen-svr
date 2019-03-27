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
        /// 初始化cursor 和 currentHeight
        const currentHeight = await this._getHeight();
        this._priv.currentHeight = currentHeight;
        this._priv.cursorHeight = latestBlockHeight || 1;

        /// for socketio client, listening for new block height notification
        this._socketio = SocketIOClient(kNodeServer);
        this._socketio.on("blocks/change", ({ height }) => {
            console.log(`[Blockchain] NewHeight: ${height}`);
            this._priv.currentHeight = height;
        });

        /// 启动scheduler更新链上块信息
        setImmediate(this._loopTick);
    }

    async getHashes(hashCount) {
        const blockCount = this._priv.blockCaches.length;
        let newHashes = null;
        if (blockCount >= hashCount) {
            newHashes = this._priv.blockCaches.slice(0, hashCount);
            this._priv.blockCaches.shift();
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
}

module.exports = Blockchain;