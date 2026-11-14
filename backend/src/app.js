import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import apiRoutes from './routes/apiRoutes.js';
import { CLIENT_ORIGIN } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: CLIENT_ORIGIN.split(',').map((x) => x.trim()), credentials: false }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use('/api', apiRoutes);
app.use(notFound);
app.use(errorHandler);
export default app;
