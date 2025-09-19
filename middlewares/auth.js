'use strict';

const bcrypt = require('bcryptjs');
const oracledb = require('oracledb'); // ✅ สำหรับใช้ RETURNING user_id
const db = require('../database/connection');
const { signAccessToken } = require('../utils/jwt');
const { setAuthCookie } = require('../utils/cookie');

/**
 * POST /auth/login
 */
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const result = await db.execute(
            `SELECT user_id AS "userId", email AS "email", password_hash AS "passwordHash"
       FROM mp_users WHERE LOWER(email) = LOWER(:email)`,
            { email }
        );

        const user = result?.rows?.[0];
        if (!user) return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

        const ok = await bcrypt.compare(password, user.passwordHash || '');
        if (!ok) return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

        const token = signAccessToken({ sub: String(user.userId), email: user.email });
        setAuthCookie(res, token);

        res.json({ message: 'Login successful' });
    } catch (err) {
        next({ status: 500, message: 'Login failed: ' + err.message });
    }
};

/**
 * GET /auth/me
 */
exports.me = async (req, res, next) => {
    try {
        const userId = req.user?.sub;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const result = await db.execute(
            `SELECT user_id AS "userId", email AS "email"
       FROM mp_users WHERE user_id = :id`,
            { id: userId }
        );

        const user = result?.rows?.[0];
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({ user });
    } catch (err) {
        next({ status: 500, message: 'Failed to fetch profile: ' + err.message });
    }
};

/**
 * POST /auth/register
 */
exports.register = async (req, res, next) => {
    try {
        const email = String(req.body?.email || '').trim();
        const password = String(req.body?.password || '');

        if (!email || !password) {
            return res.status(422).json({ error: 'กรอกอีเมลและรหัสผ่านให้ครบ' });
        }
        if (password.length < 8) {
            return res.status(422).json({ error: 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร' });
        }

        // 1) เช็คซ้ำอีเมล
        const dup = await db.execute(
            `SELECT 1 FROM mp_users WHERE LOWER(email) = LOWER(:email)`,
            { email }
        );
        if (dup.rows?.length) {
            return res.status(409).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });
        }

        // 2) แฮชรหัสผ่าน
        const hash = await bcrypt.hash(password, 10);

        // 3) INSERT + RETURNING user_id
        const idOut = { dir: oracledb.BIND_OUT, type: oracledb.NUMBER };
        await db.execute(
            `INSERT INTO mp_users (email, password_hash, created_at)
       VALUES (:email, :hash, SYSDATE)
       RETURNING user_id INTO :id`,
            { email, hash, id: idOut }
        );

        const newUserId = idOut.val;

        // 4) ออก token + cookie (auto-login)
        const token = signAccessToken({ sub: String(newUserId), email });
        setAuthCookie(res, token);

        res.status(201).json({
            message: 'Register successful',
            user: { userId: newUserId, email }
        });
    } catch (err) {
        next({ status: 500, message: 'Register failed: ' + err.message });
    }
};
