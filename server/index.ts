import express from 'express';
import cors from 'cors';
import { auth } from './auth';
import itemsRouter from './routes/items';
import categoriesRouter from './routes/categories';
import locationsRouter from './routes/locations';
import authRouter from './routes/auth';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Better Auth handler
app.use('/api/auth', auth.handler);

// Custom Auth Routes (me, profile, invitations)
app.use('/api/auth', authRouter);

// API Routes
app.use('/api/items', itemsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/locations', locationsRouter);

// Health check
app.get('/api/health', (_req, res) => {
 res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Serve static SPA build in production
if (process.env.NODE_ENV === 'production') {
 app.use(express.static('dist'));
 app.get('*', (_req, res) => {
 res.sendFile('dist/index.html');
 });
}

app.listen(PORT, () => {
 console.log(`iCTRL server running on http://localhost:${PORT}`);
});