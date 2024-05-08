import express from 'express';
const app = express();
import fs from 'fs/promises';
import cors from 'cors';

import dotenv from 'dotenv';
dotenv.config();

import fromDirRoutes from './routes/from-dir.js';

export const ENV = process.env;

app.use(cors());

app.use(express.static(ENV.BASE_PATH_FROM_PROJECT));
app.use('/media', express.static(ENV.BASE_PATH_FROM_PROJECT));

app.use('/from-dir', fromDirRoutes);

app.get('/download/*', async (req, res) => {
    console.log(req.params);

    let path = req.params[0];
    const trailingSlash = req.query.trailingSlash;

    if (path == '') return res.status(404).json({
        success: false,
        message: 'File not found'
    });

    if (trailingSlash === false || trailingSlash === 'false') {
        path = path;
    } else {
        path = '/' + path;
    }

    try {
        fs.readFile(path).then((file) => {
            return res.status(200).send(file);
        }).catch((err) => {
            console.error('Error: ', err);

            if (err.code === 'EISDIR') {
                return res.status(400).json({
                    success: false,
                    message: 'Specified path is a directory'
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'File not found'
                });
            }
        });
    } catch (err) {
        console.error('Error: ', err);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

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
