"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = asyncHandler;
// PostgreSQL access is async, unlike the previous synchronous better-sqlite3
// calls. Express 4 does not automatically forward a rejected promise from an
// async handler to the error-handling middleware, so every route handler and
// middleware function is wrapped with this at registration time to preserve
// the same "thrown error -> central error handler" behavior as before.
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
