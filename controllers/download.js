import fs from 'fs/promises';

export const getAll = async (req, res) => {
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
};

export default {
	getAll
};
