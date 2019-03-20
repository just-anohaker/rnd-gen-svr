"use strict";

const assert = require("assert");
const crypto = require("crypto");

const _ = require("lodash");
const BigNumber = require("bignumber.js");

const chaos = require("../../utils/chaos");

class Generator {
    async rnd(hashes, iterCnt, sha256IterCnt) {
        assert(_.isArray(hashes) && hashes.length > 0
            , "hashes must be an array with more then one element");
        assert(_.isInteger(iterCnt) && iterCnt > 1
            , "iterCnt must be integer and must big than zero");
        assert(_.isInteger(sha256IterCnt) && sha256IterCnt > 0
            , "sha256IterCnt must be integer and must big than zero");

        const Qs = [];
        let h = hashes[0].id;
        let slot = hashes[0].height;
        for (let i = 0; i < iterCnt; i++) {
            const sha256Result = await this._sha256Iter(h, sha256IterCnt);
            if (i > 0) {
                Qs.push(sha256Result);
            }
            const nextIndex = await this._nextIndex(sha256Result, slot, hashes.length);
            const h1 = hashes[nextIndex].id;
            slot = hashes[nextIndex].height;
            h = this._plus(h, h1);
        }

        let sumQ = Qs[0];
        for (let i = 1; i < Qs.length; i++) {
            sumQ = this._plus(sumQ, Qs[i]);
        }
        return sumQ;
    }

    async _sha256Iter(src, cnt) {
        const asyncSha256 = async src => {
            return new Promise((resolve, reject) => {
                void reject;
                setImmediate(() => {
                    const hashResult = crypto.createHash("sha256").update(src).digest("hex");
                    return resolve(hashResult);
                });
            });
        };

        let sha256Src = src;
        for (let i = 0; i < cnt; i++) {
            // sha256Src = crypto.createHash("sha256").update(sha256Src).digest("hex");
            sha256Src = await asyncSha256(sha256Src);
        }
        return sha256Src;
    }

    async _nextIndex(hash, slot, limit) {
        const idx = chaos(hash, slot, limit);
        return idx;
    }

    _plus(op1, op2) {
        const n1 = new BigNumber(op1, 16);
        const n2 = new BigNumber(op2, 16);
        const sum = n1.plus(n2);
        return sum.toString(16);
    }
}

module.exports = Generator;