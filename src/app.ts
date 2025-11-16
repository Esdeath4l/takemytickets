import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import subjectsRouter from './api/subjects';
import reviewsRouter from './api/reviews';
import votesRouter from './api/votes';
import flagsRouter from './api/flags';
import moderationRouter from './api/moderation';
import { authMiddleware } from './middleware/auth';
import { idempotencyMiddleware } from './middleware/idempotency';
import { config } from './config';

const logger = pino({ level: config.LOG_LEVEL });

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health-check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', pid: process.pid, uptime: process.uptime() });
});

// basic swagger
const swaggerSpec = swaggerJSDoc({
  definition: { openapi: '3.0.0', info: { title: 'Reviews API', version: '1.0.0' } },
  apis: []
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// apply auth then idempotency (idempotency only reacts to POST requests)
app.use('/v1', authMiddleware, idempotencyMiddleware);
app.use('/v1', subjectsRouter);
app.use('/v1', reviewsRouter);
app.use('/v1', votesRouter);
app.use('/v1', flagsRouter);
app.use('/v1', moderationRouter);

app.use((err: any, req: any, res: any, next: any) => {
  logger.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message || 'internal', request_id: '' } });
});

export default app;
