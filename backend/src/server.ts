import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/index.js';
import { initializeDatabase } from './database/schema.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// CORS configuration
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-demo-role', 'x-user-id']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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
app.use('/api', apiRouter);

// Central error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message || 'An unexpected error occurred'
  });
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🏥 AROHA+ Backend API Server is running!`);
      console.log(`🚀 Port: ${PORT}`);
      console.log(`🔗 Local URL: http://localhost:${PORT}`);
      console.log(`🔗 Health:    http://localhost:${PORT}/health`);
      console.log(`🔗 API Base:  http://localhost:${PORT}/api`);
      console.log(`=======================================================`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to initialize database schema:', err);
    process.exit(1);
  });

export default app;
