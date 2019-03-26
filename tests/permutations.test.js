"use strict";

const _ = require("lodash");
const assert = require("assert");

const Permutations = require("../src/utils/permutations");

const deep_equal = (a, b) => {
    if (a.length != b.length) return false;

    let deepEqual = true;
    const len = a.length;
    for (let i = 0; i < len; i++) {
        if (a[i] != b[i]) {
            deepEqual = false;
            break;
        }
    }
    return deepEqual;
};

class CNode {
    constructor(array, count, index) {
        this.data = array;
        this.dataLen = array.length;
        this.startIndex = index;
        this.cursor = index;
        this.count = count;
        this.next = null;
        this.done = false;
    }

    get Next() {
        return this.next;
    }

    set Next(val) {
        this.next = val;
    }

    async iter(startIndex) {
        if (this.done || this.cursor < startIndex) {
            this.cursor = startIndex;
            this.done = false;
        }

        let values = [this.data[this.cursor]];
        const cursor = this.cursor;
        this.cursor++;
        if (this.Next) {
            const res = await this.Next.iter(cursor + 1);
            values = values.concat(res.values);
            if (!res.done) {
                this.cursor--;
            }
        }

        if (this.cursor >= this.dataLen || this.cursor - this.startIndex > this.dataLen - this.count) {
            this.done = true;
        }

        return {
            done: this.done,
            values
        };
    }

    static async test(array, count, options = { list: false, map: false, compare: false }) {
        assert(_.isArray(array), "array must be array instance.");
        assert(_.isInteger(count), "count must be integer.");
        assert(count <= array.length, "count must less than or equal array.length");

        let rootNode, tmpNode;
        for (let i = 0; i < count; i++) {
            if (rootNode == null) {
                rootNode = new CNode(array, count, i);
                tmpNode = rootNode;
                continue;
            }

            const newNode = new CNode(array, count, i);
            tmpNode.Next = newNode;
            tmpNode = newNode;
        }

        let index = -1;
        while (true) {
            const result = await rootNode.iter(0);
            index++;
            if (options.list) {
                console.log(`[${index}] -`, result.values);
            }
            const results = Permutations.getMixingByIndex(array, count, index);
            if (options.map) {
                console.log(result.values, " -- ", results);
            }
            if (options.compare) {
                const isDeepEqual = deep_equal(result.values, results);
                if (!isDeepEqual) {
                    console.log(`[${index}] ${result.values} - ${results}`);
                }
            }
            if (result.done) {
                break;
            }
        }
    }
}

class ANode {
    constructor(array, count, index) {
        this.data = array;
        this.dataLen = array.length;
        this.startIndex = index;
        this.cursor = null;
        this.count = count;
        this.next = null;
        this.done = true;
    }

    get Next() {
        return this.next;
    }

    set Next(val) {
        this.next = val;
    }

    getNextCursor(start, excludes) {
        while (start < this.dataLen) {
            if (excludes.includes(start)) {
                start++;
                continue;
            }
            break;
        }

        return {
            success: start != this.dataLen,
            value: start
        };
    }

    async iter(excludes) {
        if (this.done) {
            const next = this.getNextCursor(0, excludes);
            if (next.success) {
                this.cursor = next.value;
                this.done = false;
            }
        }

        let values = [this.data[this.cursor]];
        const cursors = [this.cursor].concat(excludes);

        let nextDone = true;
        if (this.Next) {
            const res = await this.Next.iter(cursors);
            values = values.concat(res.values);
            if (!res.done) {
                nextDone = false;
            }
        }
        if (nextDone) {
            const next = this.getNextCursor(this.cursor + 1, excludes);
            if (next.success) {
                this.cursor = next.value;
            } else {
                this.done = true;
            }
        }

        return {
            done: this.done,
            values
        };
    }

    static async test(array, count, options = { list: false, map: false, compare: false }) {
        assert(_.isArray(array), "array must be array instance.");
        assert(_.isInteger(count), "count must be integer.");
        assert(count <= array.length, "count must less than or equal array.length");

        let rootNode, tmpNode;
        for (let i = 0; i < count; i++) {
            if (rootNode == null) {
                rootNode = new ANode(array, count, i);
                tmpNode = rootNode;
                continue;
            }

            const newNode = new ANode(array, count, i);
            tmpNode.Next = newNode;
            tmpNode = newNode;
        }

        let index = -1;
        while (true) {
            const result = await rootNode.iter([]);
            index++;
            if (options.list) {
                console.log(`[${index}] -`, result.values);
            }
            const results = Permutations.getMixingByIndex([{ arr: array, size: count, type: 1 }], index);
            if (options.map) {
                console.log(result.values, " -- ", results[0]);
            }
            if (options.compare) {
                const isDeepEqual = deep_equal(result.values, results[0]);
                if (!isDeepEqual) {
                    console.log(`[${index}]`, result.values, "-", results[0]);
                }
            }
            if (result.done) {
                break;
            }
        }
    }
}

class RNode {
    constructor(array, count, index) {
        this.data = array;
        this.dataLen = array.length;
        this.startIndex = index;
        this.cursor = 0;
        this.count = count;
        this.next = null;
        this.done = false;
    }

    get Next() {
        return this.next;
    }

    set Next(val) {
        this.next = val;
    }

    async iter() {
        if (this.done) {
            this.cursor = 0;
            this.done = false;
        }

        let values = [this.data[this.cursor]];
        this.cursor++;
        if (this.Next) {
            const res = await this.Next.iter();
            values = values.concat(res.values);
            if (!res.done) {
                this.cursor--;
            }
        }

        if (this.cursor >= this.dataLen) {
            this.done = true;
        }

        return {
            done: this.done,
            values
        };
    }

    static async test(array, count, options = { list: false, map: false, compare: false }) {
        assert(_.isArray(array), "array must be array instance.");
        assert(_.isInteger(count), "count must be integer.");
        assert(count <= array.length, "count must less than or equal array.length");

        let rootNode, tmpNode;
        for (let i = 0; i < count; i++) {
            if (rootNode == null) {
                rootNode = new RNode(array, count, i);
                tmpNode = rootNode;
                continue;
            }

            const newNode = new RNode(array, count, i);
            tmpNode.Next = newNode;
            tmpNode = newNode;
        }

        let index = -1;
        while (true) {
            const result = await rootNode.iter();
            index++;
            if (options.list) {
                console.log(`[${index}] -`, result.values);
            }
            const results = Permutations.getMixingByIndex([{ arr: array, size: count, type: 0 }], index);
            if (options.map) {
                console.log(result.values, " -- ", results[0]);
            }
            if (options.compare) {
                const isDeepEqual = deep_equal(result.values, results[0]);
                if (!isDeepEqual) {
                    console.log(`[${index}]`, result.values, "-", results[0]);
                }
            }
            if (result.done) {
                break;
            }
        }
    }
}

(async () => {
    ///
    console.log("C algo test >>>");
    {
        const array = [1, 2, 3, 4, 5, 6, 7];
        for (let i = 2; i <= array.length; i++) {
            console.log("[count]:", i);
            await CNode.test(array, i, { compare: true });
        }
    }

    ////
    console.log("A alog test >>>");
    {
        const array = [1, 2, 3, 4, 5, 6, 7];
        for (let i = 1; i <= array.length; i++) {
            console.log("count: ", i);
            await ANode.test(array, i, { compare: true });
        }
    }

    ///
    console.log("R algo test >>>");
    {
        const array = [1, 2, 3, 4, 5, 6, 7];
        for (let i = 2; i <= array.length; i++) {
            console.log("[count]:", i);
            await RNode.test(array, i, { compare: true });
        }
    }
})()
    .catch(error => console.log(error));

