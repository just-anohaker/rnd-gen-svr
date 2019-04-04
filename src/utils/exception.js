"use strict";

const { ErrorCodes, getErrorCodeDescription } = require("./exception-code");

class Exception extends Error {
    constructor(message, code) {
        super(message);

        this.code = code;
    }

    static of(message, code) {
        return new Exception(message, code);
    }

    static ofUnknown(message) {
        const defaultMsg = getErrorCodeDescription(ErrorCodes.kUnknownError);
        return new Exception(message || defaultMsg, ErrorCodes.kUnknownError);
    }

    static ofAPIEndpointNotExist(message) {
        const defaultMsg = getErrorCodeDescription(ErrorCodes.kAPIEndpointNotExist);
        return new Exception(message || defaultMsg, ErrorCodes.kAPIEndpointNotExist);
    }

    static ofUnvalidateParameter(message) {
        const defaultMsg = getErrorCodeDescription(ErrorCodes.kUnvalidateParameter);
        return new Exception(message || defaultMsg, ErrorCodes.kUnvalidateParameter);
    }

    static ofUnvalidableParameter(message) {
        const defaultMsg = getErrorCodeDescription(ErrorCodes.kUnvalidableParamter);
        return new Exception(message || defaultMsg, ErrorCodes.kUnvalidableParamter);
    }

    static ofNoMatchedResult(message) {
        const defaultMsg = getErrorCodeDescription(ErrorCodes.kNoMatchedResult);
        return new Exception(message || defaultMsg, ErrorCodes.kNoMatchedResult);
    }

    get Code() {
        return this.code;
    }

    get Message() {
        return this.message;
    }

    get CodeDescription() {
        return getErrorCodeDescription(this.code);
    }
}

module.exports = Exception;