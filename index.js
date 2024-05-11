import express from 'express';
const app = express();
import cors from 'cors';

import dotenv from 'dotenv';
dotenv.config();

import dirRoutes from './routes/dir.js';
import downloadRoutes from './routes/download.js';

export const ENV = process.env;

app.use(cors());

app.use(express.static(ENV.BASE_PATH_FROM_PROJECT));
app.use('/view', express.static(ENV.BASE_PATH_FROM_PROJECT));

app.use('/dir', dirRoutes);
app.use('/download', downloadRoutes);

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
