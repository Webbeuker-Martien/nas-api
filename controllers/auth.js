import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { ENV } from '../env.js';

const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const cookieOptions = () => ({
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_MS
});

export const login = async (req, res) => {
    const { password } = req.body || {};

    if (!password) {
        return res.status(400).json({
            success: false,
            message: 'Password is required'
        });
    }

    if (!ENV.AUTH_PASSWORD_HASH) {
        console.error('AUTH_PASSWORD_HASH is not configured');

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }

    try {
        const match = await bcrypt.compare(password, ENV.AUTH_PASSWORD_HASH);

        if (!match) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect password'
            });
        }

        const token = jwt.sign({ auth: true }, ENV.AUTH_JWT_SECRET, { expiresIn: '30d' });

        res.cookie('session', token, cookieOptions());

        return res.status(200).json({
            success: true,
            message: 'Logged in'
        });
    } catch (err) {
        console.error('Error: ', err);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const logout = (req, res) => {
    res.clearCookie('session', cookieOptions());

    return res.status(200).json({
        success: true,
        message: 'Logged out'
    });
};

export const status = (req, res) => {
    return res.status(200).json({
        success: true,
        authenticated: true
    });
};

export default { login, logout, status };
