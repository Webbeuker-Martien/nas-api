import { getAllChildren, getChildren } from '../functions.js';

const ENV = process.env;

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
		console.error('Error', err);

		return res.status(500).json({
			success: false,
			message: "Internal server error"
		});
	}
};

export const get = async (req, res) => {
	const dir = req.params.dir;
	const deepest = req.query.deepest;

	try {
		let basePath = ENV.BASE_PATH + dir.replaceAll('.', '/');
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
		console.error('Error', err);

		if (err.code === '') {
			return res.status(404).json({
				success: false,
				message: 'Directory not found'
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
	get
};
