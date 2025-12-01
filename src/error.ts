export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
    }
}

export function assertTrue(bool:any,error:Error){
    if (!bool){
        throw error;
    }
}