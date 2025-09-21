'use strict';

const jwtUtil = require('../utils/jwt');

/**
 * Authentication middleware that validates JWT token from cookies
 * and adds user information to req.user
 */
exports.authenticate = async (req, res, next) => {
    try {
        // Get token from cookie
        const token = req.cookies?.access_token;

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'กรุณาเข้าสู่ระบบ' 
            });
        }

        // Verify token
        const decoded = jwtUtil.verify(token);
        
        // Add user info to request
        req.user = {
            sub: decoded.sub,
            email: decoded.email,
            ...decoded
        };

        next();
    } catch (err) {
        // Handle invalid or expired tokens
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                message: 'โทเคนไม่ถูกต้อง' 
            });
        }
        
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'โทเคนหมดอายุ กรุณาเข้าสู่ระบบใหม่' 
            });
        }

        return res.status(500).json({ 
            success: false, 
            message: 'เกิดข้อผิดพลาดในการตรวจสอบการเข้าสู่ระบบ' 
        });
    }
};

/**
 * Employee-only authentication middleware
 * - validates JWT from cookie
 * - ensures decoded.role === 'employee'
 */
exports.authenticateEmployee = async (req, res, next) => {
    try {
        const token = req.cookies?.access_token;
        if (!token) {
            return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบ' });
        }

        const decoded = jwtUtil.verify(token);

        if (decoded.role !== 'employee') {
            return res.status(403).json({ success: false, message: 'ต้องเป็นพนักงานเท่านั้น' });
        }

        req.user = { sub: decoded.sub, email: decoded.email, role: decoded.role, ...decoded };
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'โทเคนไม่ถูกต้อง' });
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'โทเคนหมดอายุ กรุณาเข้าสู่ระบบใหม่' });
        }
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบการเข้าสู่ระบบ' });
    }
};

