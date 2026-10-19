/**
 * Main Express server application
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import groupRoutes from './routes/groupRoutes';
import contributionRoutes from './routes/contributionRoutes';
import reputationRoutes from './routes/reputationRoutes';
import chatRoutes from './routes/chatRoutes';
import notificationRoutes from './routes/notificationRoutes';

const app: Express = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  });
});

// API version endpoint
app.get('/api/version', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      version: '1.0.0',
      name: 'CircuFi Backend',
      description: 'AI-Powered Trust Infrastructure for Cooperative Savings',
    },
  });
});

// Mount routes
const apiVersion = process.env.API_VERSION || 'v1';
const baseUrl = `/api/${apiVersion}`;

app.use(`${baseUrl}/auth`, authRoutes);
app.use(`${baseUrl}/users`, userRoutes);
app.use(`${baseUrl}/groups`, groupRoutes);
app.use(`${baseUrl}/contributions`, contributionRoutes);
app.use(`${baseUrl}/reputation`, reputationRoutes);
app.use(`${baseUrl}/chat`, chatRoutes);
app.use(`${baseUrl}/notifications`, notificationRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
