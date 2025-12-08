export function assertTrue(bool, error) {
    if (!bool) {
        throw error;
    }
}
export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}
export class NotSupportError extends Error {
    constructor(message) {
        super(message);
        this.name = "NotSupportError";
    }
}
//# sourceMappingURL=error.js.map