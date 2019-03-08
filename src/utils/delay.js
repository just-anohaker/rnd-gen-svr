"use strict";

const delay = async expiredTime => {
    return new Promise((resolve, reject) => {
        void reject;
        setTimeout(() => {
            resolve();
        }, expiredTime);
    });
};

module.exports = delay;