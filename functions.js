import fs from 'fs/promises';
import path from 'path';

import { ENV } from './env.js';
import { getMimeType } from './services/mime.js';

export const getAllChildren = async (basePath) => {
    let data = [];

    return new Promise(async (resolve, reject) => {
        try {
            const files = await fs.readdir(basePath, { withFileTypes: true });

            for (const file of files) {
                delete file.path;

                if (file.isFile()) {
                    file.type = 'file';
                    file.ext = '.' + file.name.split('.').pop();
                    file.mime = getMimeType(file.ext);
                    file.relativePath = encodeURI(path.join(basePath.replace(ENV.BASE_PATH, '/'), file.name)).replaceAll('#', '%23');
                    file.absolutePath = encodeURI(path.join(basePath, file.name)).replaceAll('#', '%23');
                    file.assetPaths = [
                        encodeURI(basePath.replace(ENV.BASE_PATH, ENV.BASE_URL + '/') + '/' + file.name).replaceAll('#', '%23'),
                        encodeURI(basePath.replace(ENV.BASE_PATH, ENV.BASE_URL + '/view/') + '/' + file.name).replaceAll('#', '%23')
                    ];
                    file.downloadPath = encodeURI(ENV.BASE_URL + '/' + path.join('download', basePath, file.name)).replaceAll('#', '%23');

                    data.push(file);
                } else if (file.isDirectory()) {
                    const subData = await getAllChildren(path.join(basePath, file.name));

                    data.push({
                        [file.name]: subData
                    });
                }
            }

            resolve(data);
        } catch (err) {
            reject(err);
        }
    });
};

export const getChildren = async (basePath, includeDirs = false) => {
    let data = [];

    return new Promise(async (resolve, reject) => {
        try {
            const files = await fs.readdir(basePath, { withFileTypes: true });

            for (const file of files) {
                delete file.path;

                if (file.isFile()) {
                    file.type = 'file';
                    file.ext = '.' + file.name.split('.').pop();
                    file.mime = getMimeType(file.ext);
                    file.relativePath = encodeURI(path.join(basePath.replace(ENV.BASE_PATH, '/'), file.name)).replaceAll('#', '%23');
                    file.absolutePath = encodeURI(path.join(basePath, file.name)).replaceAll('#', '%23');
                    file.assetPaths = [
                        encodeURI(basePath.replace(ENV.BASE_PATH, ENV.BASE_URL + '/') + '/' + file.name).replaceAll('#', '%23'),
                        encodeURI(basePath.replace(ENV.BASE_PATH, ENV.BASE_URL + '/view/') + '/' + file.name).replaceAll('#', '%23')
                    ];
                    file.downloadPath = encodeURI(ENV.BASE_URL + '/' + path.join('download', basePath, file.name)).replaceAll('#', '%23');

                    data.push(file);
                } else if (file.isDirectory()) {
                    if (includeDirs) {
                        const children = await fs.readdir(path.join(basePath, file.name), { withFileTypes: true });

                        data.push({
                            ...file,
                            type: 'folder',
                            relativePath: encodeURI(path.join(basePath.replace(ENV.BASE_PATH, '/'), file.name)).replaceAll('#', '%23'),
                            absolutePath: encodeURI(path.join(basePath, file.name)).replaceAll('#', '%23'),
                            children: children.length
                        });
                    }
                }
            }
            
            resolve(data);
        } catch (err) {
            reject(err);
        }
    });
};

