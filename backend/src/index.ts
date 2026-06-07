import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { APP_NAME } from './constants/brand';
import { config } from './config/env';
import geocodeRoutes from './routes/geocode.routes';
import authRoutes from './routes/auth.routes';
import ordersRoutes from './routes/orders.routes';
import packagesRoutes from './routes/packages.routes';
import deliveriesRoutes from './routes/deliveries.routes';
import chatRoutes from './routes/chat.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();

const app = express();

const origins = config.corsOrigin.split(',').map((o) => o.trim()).filter(Boolean);

app.use(
  cors({
    origin: origins.length > 1 ? origins : origins[0] || true,
    credentials: true,
  })
);
app.use(express.json({ limit: '6mb' }));

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: `${APP_NAME} API`,
      version: '1.0.0',
      description: 'API REST — Plateforme logistique multi-acteurs',
    },
    servers: [{ url: `http://localhost:${config.port}/api` }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: `${APP_NAME} API` });
});

app.use('/api/auth', authRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/packages', packagesRoutes);
app.use('/api/deliveries', deliveriesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route introuvable', code: 'NOT_FOUND' });
});

app.listen(config.port, () => {
  console.log(`${APP_NAME} API → http://localhost:${config.port}`);
  console.log(`Swagger     → http://localhost:${config.port}/api-docs`);
});
