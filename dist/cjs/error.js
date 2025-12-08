"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotSupportError = exports.ValidationError = void 0;
exports.assertTrue = assertTrue;
function assertTrue(bool, error) {
    if (!bool) {
        throw error;
    }
}
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
//# sourceMappingURL=error.js.map