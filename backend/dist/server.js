"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const index_js_1 = __importDefault(require("./routes/index.js"));
const schema_js_1 = require("./database/schema.js");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
// Initialize DB schema
(0, schema_js_1.initializeDatabase)();
// CORS configuration
app.use((0, cors_1.default)({
    origin: [FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-demo-role', 'x-user-id']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});
// Health check
app.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        service: 'AROHA+ Public Healthcare Backend API',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
// Mount modular API routes
app.use('/api', index_js_1.default);
// Central error handler
app.use((err, _req, res, _next) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message || 'An unexpected error occurred'
    });
});
app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🏥 AROHA+ Backend API Server is running!`);
    console.log(`🚀 Port: ${PORT}`);
    console.log(`🔗 Local URL: http://localhost:${PORT}`);
    console.log(`🔗 Health:    http://localhost:${PORT}/health`);
    console.log(`🔗 API Base:  http://localhost:${PORT}/api`);
    console.log(`=======================================================`);
});
exports.default = app;
