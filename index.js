import { ENV } from './env.js';

import express from 'express';
const app = express();
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { requireAuth } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import dirRoutes from './routes/dir.js';
import downloadRoutes from './routes/download.js';
import thumbRoutes from './routes/thumb.js';

app.use(cors({
	origin: ENV.FRONTEND_ORIGIN,
	credentials: true
}));
app.use(cookieParser());
app.use(express.json());

app.use('/auth', authRoutes);

app.use(requireAuth, express.static(ENV.BASE_PATH_FROM_PROJECT));
app.use('/view', requireAuth, express.static(ENV.BASE_PATH_FROM_PROJECT));

app.use('/dir', dirRoutes);
app.use('/download', downloadRoutes);
app.use('/thumb', thumbRoutes);

const server = app.listen(2000, () => {
	console.log(`Server running at ${ENV.BASE_URL}...`);
});

app.get('/stop-server', (req, res) => {
    server.close(() => {
        console.log('Server stopped');
    });

    res.status(200).json({
        success: true,
        message: 'Server stopped'
    });
});
