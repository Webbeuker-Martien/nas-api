import fs from 'fs/promises';
import { getAllChildren, getChildren } from '../functions.js';
import { ENV } from '../index.js';
import path from 'path';

export const getAll = async (req, res) => {
	const deepest = req.query.deepest;

	try {
		let basePath = ENV.BASE_PATH;
		let data = [];

		if (deepest === false || deepest === 'false') {
			data = await getChildren(basePath, true);
		} else {
			data = await getAllChildren(basePath);
		}

		res.status(200).json({
			success: true,
			count: data.length,
			body: data
		});
	} catch (err) {
		console.error('Error: ', err);

		return res.status(500).json({
			success: false,
			message: 'Internal server error'
		});
	}
};

export const get = async (req, res, next, withSlashes = false) => {
	let dir = req.params.dir;
	if (withSlashes === true) {
		dir = req.params[0];
	}

	const deepest = req.query.deepest;

	try {
		let basePath = ENV.BASE_PATH + dir;
		if (withSlashes === false) {
			basePath = ENV.BASE_PATH + dir.replaceAll('.', '/');
		}

		let data = [];

		if (deepest === false || deepest === 'false') {
			data = await getChildren(basePath, true);
		} else {
			data = await getAllChildren(basePath);
		}

		res.status(200).json({
			success: true,
			count: data.length,
			body: data
		});
	} catch (err) {
		console.error('Error: ', err);

		if (err.code === 'ENOENT') {
			return res.status(404).json({
				success: false,
				message: 'Directory not found'
			});
		} else if (err.code === 'ENOTDIR') {
			return res.status(400).json({
				success: false,
				message: 'Not a directory'
			});
		} else {
			return res.status(500).json({
				success: false,
				message: 'Internal server error'
			});
		}
	}
};

export const post = async (req, res, next, withSlashes = false) => {
	let dir = req.params.dir;
	if (withSlashes === true) {
		dir = req.params[0];
	}

	try {
		let basePath = ENV.BASE_PATH + dir;
		if (withSlashes === false) {
			basePath = ENV.BASE_PATH + dir.replaceAll('.', '/');
		}

		// const directory = await fs.stat(basePath, { withFileTypes: true });

		// if (!directory.isDirectory()) {
		// 	return res.status(400).json({
		// 		success: false,
		// 		message: 'Not a directory'
		// 	});
		// }

		// File upload
		if (!req.files) {
			return res.status(400).json({
				success: false,
				message: 'No files provided'
			});
		}

		await Promise.all(
            Object.keys(req.files).map(async (key) => {
				let file = req.files[key];
				let exists = null;

				try {
					exists = await fs.stat(path.join(basePath, file.name));

					if (exists.isFile()) {
						// Ask user to overwrite or not
						return res.status(400).json({
							success: false,
							message: 'File already exists (if you want to override, pass param)'
						});
					}
				} catch (err) {
					console.log(err);

					if (err.code === 'ENOENT') {
						// Add file
						file.mv(basePath + '/' + file.name, (err) => {
							if (err) {
								console.log(err);
							}
						});

						return res.status(200).json({
							success: true,
							message: 'File uploaded succesfully'
						});
					}

					return res.status(500).json({
						success: false,
						message: 'Internal server error'
					});
				}
			})
		);
	} catch (err) {
		console.error('Error: ', err);

		if (err.code === 'ENOENT') {
			return res.status(404).json({
				success: false,
				message: 'Directory not found'
			});
		} else if (err.code === 'ENOTDIR') {
			return res.status(400).json({
				success: false,
				message: 'Not a directory'
			});
		} else {
			return res.status(500).json({
				success: false,
				message: 'Internal server error'
			});
		}
	}
};

export default {
	getAll,
	get,
	post
};
