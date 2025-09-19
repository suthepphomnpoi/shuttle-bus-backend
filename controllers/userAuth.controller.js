'use strict';

const bcrypt = require('bcryptjs');
const db = require('../database/connection');
const { signAccessToken } = require('../utils/jwt');
const { setAuthCookie } = require('../utils/cookie');


exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const result = await db.execute(
            `SELECT 
                user_id AS "userId",
                email AS "email",
                password_hash AS "passwordHash"
             FROM mp_users WHERE email = :email`,
            { email }
        );

        const user = result?.rows?.[0];
        console.log(user);
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

exports.register = async (req, res, next) => {
    const { email, password, first_name, last_name, gender } = req.body;
    try {

        const dup = await db.execute(
            `SELECT 1 FROM mp_users WHERE LOWER(email)=LOWER(:email)`,
            { email }
        );
        if (dup.rows?.length) {
            return res.status(409).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });
        }

        const hash = await bcrypt.hash(password, 10);
        await db.execute(
            `INSERT INTO mp_users (user_id, email, password_hash, first_name, last_name, gender, created_at)
                VALUES (seq_mp_users.NEXTVAL, :email, :hash, :first_name, :last_name, :gender ,SYSDATE)`,
            { email, hash, first_name, last_name, gender }
        );

        const rs = await db.execute(
            `SELECT user_id FROM mp_users WHERE email = :email`,
            { email }
        );

        const newUserId = rs.rows[0].USER_ID;

        res.status(201).json({
            message: 'Register successful',
            user: { userId: newUserId, email }
        });
    } catch (err) {
        next({ status: 500, message: 'Register failed: ' + err.message });
    }
};



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


