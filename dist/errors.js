// 400
export class BadRequestsError extends Error {
    constructor(message) {
        super(message);
    }
}
// 401
export class UnauthorizedError extends Error {
    constructor(message) {
        super(message);
    }
}
// 403
export class ForbiddenError extends Error {
    constructor(message) {
        super(message);
    }
}
// 404
export class NotFoundError extends Error {
    constructor(message) {
        super(message);
    }
}
