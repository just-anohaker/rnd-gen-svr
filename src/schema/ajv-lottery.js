module.exports = {
    lottery: {
        properties: {
            data: {
                type: "array",
                minItems: 1,
                items: {
                    type: "object",
                    properties: {
                        arr: {
                            type: "array"
                        },
                        size: {
                            type: "integer"
                        },
                        type: {
                            type: "integer",
                            enum: [0, 1, 2]
                        }
                    },
                    required: ["arr", "size", "type"]
                }
            },
            hash: {
                type: "string"
            }
        },
        required: ["data", "hash"]
    },
    pagedata: {
        properties: {
            data: {
                type: "array",
                minItems: 1,
                items: {
                    type: "object",
                    properties: {
                        arr: {
                            type: "array"
                        },
                        size: {
                            type: "integer"
                        },
                        type: {
                            type: "integer",
                            enum: [0, 1, 2]
                        }
                    },
                    required: ["arr", "size", "type"]
                }
            },
            index: {
                type: "integer"
            },
            hash: {
                type: "string"
            },
            limit: {
                type: "integer"
            }
        },
        oneOf: [{
            required: ["index"]
        }, {
            required: ["hash"]
        }],
        required: ["data"]
    }
};