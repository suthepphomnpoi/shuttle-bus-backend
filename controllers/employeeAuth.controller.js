'use strict';

const bcrypt = require('bcryptjs');
const db = require('../database/connection');
const jwtUtil = require('../utils/jwt');
const { setAuthCookie } = require('../utils/cookie');


exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const result = await db.execute(
            `SELECT 
                employee_id AS "employeeId",
                email AS "email",
                password_hash AS "passwordHash"
             FROM mp_employees WHERE email = :email`,
            { email }
        );

        const employee = result?.rows?.[0];
        if (!employee) return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

        const ok = await bcrypt.compare(password, employee.passwordHash || '');
        if (!ok) return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

        const token = jwtUtil.sign({ sub: String(employee.employeeId), email: employee.email, role: 'employee' });
        setAuthCookie(res, token);

        res.json({ message: 'Login successful' });
    } catch (err) {
        next({ status: 500, message: 'Login failed: ' + err.message });
    }
};

exports.register = async (req, res, next) => {
    const { email, password, first_name, last_name, gender, dept_id, position_id } = req.body;
    try {
        const dup = await db.execute(
            `SELECT 1 FROM mp_employees WHERE LOWER(email)=LOWER(:email)`,
            { email }
        );



        const hash = await bcrypt.hash(password, 10);
        await db.execute(
            `INSERT INTO mp_employees (employee_id, email, password_hash, first_name, last_name, gender, dept_id, position_id, created_at)
                VALUES (seq_mp_employees.NEXTVAL, :email, :hash, :first_name, :last_name, :gender, :dept_id, :position_id, SYSDATE)`,
            { email, hash, first_name, last_name, gender, dept_id: Number(dept_id), position_id: Number(position_id) }
        );

        const rs = await db.execute(
            `SELECT employee_id FROM mp_employees WHERE email = :email`,
            { email }
        );

        const newEmployeeId = rs.rows[0].EMPLOYEE_ID;

        res.status(201).json({
            success: true,
            message: 'Register successful',
            employee: { employeeId: newEmployeeId, email }
        });
    } catch (err) {
        next({ success: false, message: 'Register failed: ' + err.message });
    }
};

exports.me = async (req, res, next) => {
    try {
        const employeeId = req.user?.sub;
        if (!employeeId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const result = await db.execute(
            `SELECT employee_id AS "employeeId", email AS "email"
       FROM mp_employees WHERE employee_id = :id`,
            { id: employeeId }
        );

        const employee = result?.rows?.[0];
        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

        res.json({ employee });
    } catch (err) {
        next({ success: false, message: 'Failed to fetch profile: ' + err.message });
    }
};
