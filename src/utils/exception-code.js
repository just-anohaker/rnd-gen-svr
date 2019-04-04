"use strict";

const gErrorCodes = {
    // 负数代表系统错误信息
    kUnknownError: -2,
    kAPIEndpointNotExist: -1,
    // [1, 100]代表参数相关的错误
    kUnvalidateParameter: 1,
    kUnvalidableParamter: 2,
    // [101 - 200]代表结果相关的错误信息
    kNoMatchedResult: 101
};

const gErrorDescs = new Map();
// system errors
gErrorDescs.set(gErrorCodes.kUnknownError, "Unknown error.");
gErrorDescs.set(gErrorCodes.kAPIEndpointNotExist, "APIEndpoint not exist.");

// parameters errors
gErrorDescs.set(gErrorCodes.kUnvalidableParamter, "Parameters validate failure.");
gErrorDescs.set(gErrorCodes.kUnvalidableParamter, "Parameters is unvalidable.");

// response result errors
gErrorDescs.set(gErrorCodes.kNoMatchedResult, "No Result matched to request");

const getErrorCodeDescription = code => {
    if (gErrorDescs.has(code)) {
        return gErrorDescs.get(code);
    }

    return gErrorDescs.get(gErrorCodes.kUnknownError);
};

module.exports = {
    ErrorCodes: gErrorCodes,
    ErrorDesc: gErrorDescs,
    getErrorCodeDescription
};