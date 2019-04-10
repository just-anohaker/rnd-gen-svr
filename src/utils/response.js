"use strict";

const { ErrorCodes, getErrorCodeDescription } = require("./exception-code");
const Exception = require("./exception");

class Response {
    static success(ctx, data) {
        ctx.body = {
            success: true,
            data
        };
    }

    static exception(ctx, error) {
        if (!(error instanceof Exception)) {
            error = Exception.ofUnknown(error == null ? null : error.toString());
        }
        ctx.body = {
            success: false,
            error: error.Message,
            errorCode: error.Code
        };
    }

    static failure(ctx, message, code) {
        ctx.body = {
            success: false,
            error: message || getErrorCodeDescription(ErrorCodes.kUnknownError),
            errorCode: code == null ? ErrorCodes.kUnknownError : code
        };
    }
}

module.exports = Response;