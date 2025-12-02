"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotSupportError = exports.ValidationError = exports.assertTrue = void 0;
function assertTrue(bool, error) {
    if (!bool) {
        throw error;
    }
}
exports.assertTrue = assertTrue;
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}
exports.ValidationError = ValidationError;
class NotSupportError extends Error {
    constructor(message) {
        super(message);
        this.name = "NotSupportError";
    }
}
exports.NotSupportError = NotSupportError;
