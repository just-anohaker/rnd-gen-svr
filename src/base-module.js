"use strict";

const { EventEmitter } = require("events");

class BaseModule extends EventEmitter {
    constructor() {
        super();
    }

    async init() {

    }
}

module.exports = BaseModule;