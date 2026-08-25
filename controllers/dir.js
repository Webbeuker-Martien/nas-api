import fs from 'fs/promises';
import { getAllChildren, getChildren } from '../functions.js';
import { listPage } from '../services/listing.js';
import { ENV } from '../env.js';
import path from 'path';

const parsePageParams = (query) => {
	const offset = Number.parseInt(query.offset, 10);
	const limit = Number.parseInt(query.limit, 10);
	const order = query.order === 'desc' ? 'desc' : 'asc';

	return {
		offset: Number.isFinite(offset) && offset >= 0 ? offset : 0,
		limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 1000) : 200,
		order
	};
};

export const getAll = async (req, res) => {
	const deepest = req.query.deepest;

	try {
		let basePath = ENV.BASE_PATH;

		if (deepest === false || deepest === 'false') {
			const page = await listPage(basePath, parsePageParams(req.query));

			return res.status(200).json({
				success: true,
				count: page.body.length,
				total: page.total,
				offset: page.offset,
				limit: page.limit,
				hasMore: page.hasMore,
				body: page.body
			});
		}

		const data = await getAllChildren(basePath);

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

export const get = async (req, res) => {
	let dir = req.params[0];

	const deepest = req.query.deepest;

	try {
		let basePath = path.join(ENV.BASE_PATH, dir);

		if (deepest === false || deepest === 'false') {
			const page = await listPage(basePath, parsePageParams(req.query));

			return res.status(200).json({
				success: true,
				count: page.body.length,
				total: page.total,
				offset: page.offset,
				limit: page.limit,
				hasMore: page.hasMore,
				body: page.body
			});
		}

		const data = await getAllChildren(basePath);

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
		let basePath = path.join(ENV.BASE_PATH, dir);
		if (withSlashes === false) {
			basePath = path.join(ENV.BASE_PATH, dir.replaceAll('.', '/'));
		}

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
					if (err.code === 'ENOENT') {
						// Add file
						file.mv(path.join(basePath, file.name), (err) => {
							if (err) {
								console.error(err);

								return res.status(400).json({
									success: false,
									message: 'Failed to upload file'
								});
							}
						});

						return res.status(200).json({
							success: true,
							message: 'File uploaded succesfully'
						});
					}

					console.error(err);
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

export const moveOrCopy = async (req, res, next, action) => {
	let dir = req.params[0];
	let dest = req.query.dest;

	if (!dest) {
		return res.status(400).json({
			success: false,
			message: 'No destionation passed'
		});
	}

	try {
		let basePath = path.join(ENV.BASE_PATH, dir);

		if (dest) {
			dest = path.join(ENV.BASE_PATH, dest);
		}

		const directory = await fs.stat(basePath, { withFileTypes: true });

		if (!directory.isDirectory()) {
			return res.status(400).json({
				success: false,
				message: 'Not a directory'
			});
		}

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
				let fileExists = null;

				try {
					fileExists = await fs.stat(path.join(basePath, file.name));

					if (fileExists.isFile()) {
						let fileInDestExists = null;
						
						try {
							fileInDestExists = await fs.stat(path.join(dest, file.name));

							if (fileInDestExists.isFile()) {
								// Ask user to overwrite or not
								return res.status(400).json({
									success: false,
									message: 'File already exists (if you want to override, pass param)'
								});
							}
						} catch (err) {
							if (err.code === 'ENOENT') {
								// Add file to dest
								file.mv(path.join(dest, file.name), async (err) => {
									if (err) {
										console.error(err);

										return res.status(400).json({
											success: false,
											message: `Failed to ${action} file`
										});
									}

									if (action === 'move') {
										// Remove file from basePath
										await fs.unlink(path.join(basePath, file.name));
									}
								});

								return res.status(200).json({
									success: true,
									message: `File ${action === 'move' ? 'moved' : action === 'copy' ? 'copied' : 'handled'} succesfully`
								});
							}

							console.error(err);
							return res.status(500).json({
								success: false,
								message: 'Internal server error'
							});
						}
					} else {
						return res.status(404).json({
							success: false,
							message: 'File not found'
						})
					}
				} catch (err) {
					console.error(err);

					if (err.code === 'ENOENT') {
						return res.status(404).json({
							success: false,
							message: 'No such file or directory'
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

export const deleteFileOrDir = async (req, res, next, withSlashes = false) => {
	let dir = req.params.dir;
	if (withSlashes === true) {
		dir = req.params[0];
	}

	try {
		let basePath = path.join(ENV.BASE_PATH, dir);
		if (withSlashes === false) {
			basePath = path.join(ENV.BASE_PATH, dir.replaceAll('.', '/'));
		}

		let exists = null;
		let response = null;
		try {
			exists = await fs.stat(basePath);
			response = await fs.rmdir(basePath, {
				recursive: true, 
			});

			return res.status(200).json({
				success: true,
				message: 'Directory deleted succesfully'
			});
		} catch (err) {
			if (err.code === 'ENOTDIR') {
				exists = await fs.stat(basePath);
				response = await fs.unlink(basePath);
	
				return res.status(200).json({
					success: true,
					message: 'File deleted succesfully'
				});
			} else if (err.code === 'ENOENT') {
				return res.status(404).json({
					success: false,
					message: 'No such file or directory'
				});
			}

			console.error(err);
			return res.status(500).json({
				success: false,
				message: 'Internal server error'
			});
		}
	} catch (err) {
		console.error(err);

		if (err.code === 'ENOENT') {
			return res.status(404).json({
				success: false,
				message: 'No such file or directory'
			});
		}

		return res.status(500).json({
			success: false,
			message: 'Internal server error'
		});
	}
};

export default {
	getAll,
	get,
	post,
	moveOrCopy,
	deleteFileOrDir
};
