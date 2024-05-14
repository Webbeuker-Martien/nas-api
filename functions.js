import fs from 'fs/promises';
import path from 'path';

import { ENV } from './index.js';

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
                        basePath.replace(ENV.BASE_PATH, ENV.BASE_URL + '/') + '/' + file.name,
                        basePath.replace(ENV.BASE_PATH, ENV.BASE_URL + '/view/') + '/' + file.name
                    ];
                    file.downloadPath = ENV.BASE_URL + '/' + path.join('download', basePath, file.name);

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
                        basePath.replace(ENV.BASE_PATH, ENV.BASE_URL + '/') + '/' + file.name,
                        basePath.replace(ENV.BASE_PATH, ENV.BASE_URL + '/view/') + '/' + file.name
                    ];
                    file.downloadPath = ENV.BASE_URL + '/' + path.join('download', basePath, file.name);

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


const getMimeType = (extension = 'txt') => {
    if (extension[0] === '.') {
        extension = extension.substr(1);
    }
    return {
        aac: 'audio/aac',
        abw: 'application/x-abiword',
        arc: 'application/x-freearc',
        avi: 'video/x-msvideo',
        azw: 'application/vnd.amazon.ebook',
        bin: 'application/octet-stream',
        bmp: 'image/bmp',
        bz: 'application/x-bzip',
        bz2: 'application/x-bzip2',
        cda: 'application/x-cdf',
        csh: 'application/x-csh',
        css: 'text/css',
        csv: 'text/csv',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        eot: 'application/vnd.ms-fontobject',
        epub: 'application/epub+zip',
        gz: 'application/gzip',
        gif: 'image/gif',
        htm: 'text/html',
        html: 'text/html',
        ico: 'image/vnd.microsoft.icon',
        ics: 'text/calendar',
        jar: 'application/java-archive',
        jpeg: 'image/jpeg',
        jpg: 'image/jpeg',
        js: 'text/javascript',
        json: 'application/json',
        jsonld: 'application/ld+json',
        mid: 'audio/midi audio/x-midi',
        midi: 'audio/midi audio/x-midi',
        mjs: 'text/javascript',
        mp3: 'audio/mpeg',
        mp4: 'video/mp4',
        mpeg: 'video/mpeg',
        mpkg: 'application/vnd.apple.installer+xml',
        odp: 'application/vnd.oasis.opendocument.presentation',
        ods: 'application/vnd.oasis.opendocument.spreadsheet',
        odt: 'application/vnd.oasis.opendocument.text',
        oga: 'audio/ogg',
        ogv: 'video/ogg',
        ogx: 'application/ogg',
        opus: 'audio/opus',
        otf: 'font/otf',
        png: 'image/png',
        pdf: 'application/pdf',
        php: 'application/x-httpd-php',
        ppt: 'application/vnd.ms-powerpoint',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        rar: 'application/vnd.rar',
        rtf: 'application/rtf',
        sh: 'application/x-sh',
        svg: 'image/svg+xml',
        swf: 'application/x-shockwave-flash',
        tar: 'application/x-tar',
        tif: 'image/tiff',
        tiff: 'image/tiff',
        ts: 'video/mp2t',
        ttf: 'font/ttf',
        txt: 'text/plain',
        vsd: 'application/vnd.visio',
        wav: 'audio/wav',
        weba: 'audio/webm',
        webm: 'video/webm',
        webp: 'image/webp',
        woff: 'font/woff',
        woff2: 'font/woff2',
        xhtml: 'application/xhtml+xml',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        xml: 'application/xml',
        xul: 'application/vnd.mozilla.xul+xml',
        zip: 'application/zip',
        '3gp': 'video/3gpp',
        '3g2': 'video/3gpp2',
        '7z': 'application/x-7z-compressed'
    }[extension] || 'application/octet-stream';
}
