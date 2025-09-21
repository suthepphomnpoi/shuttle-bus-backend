'use strict';

const express = require('express');
const { body } = require('express-validator');
const employeeAuthController = require('../controllers/employeeAuth.controller');
const validate = require('../middlewares/validate');
const { authenticateEmployee } = require('../middlewares/auth');

const router = express.Router();

router.post(
    '/login',
    [
        body('email')
            .trim()
            .notEmpty().withMessage('กรุณากรอกอีเมล')
            .isEmail().withMessage('รูปแบบอีเมลไม่ถูกต้อง'),
        body('password')
            .notEmpty().withMessage('กรุณากรอกรหัสผ่าน'),
    ],
    validate,
    employeeAuthController.login
);

router.post(
    '/register',
    [
        body('first_name')
            .trim()
            .notEmpty().withMessage('กรุณากรอกชื่อ')
            .isLength({ max: 100 }).withMessage('ชื่อต้องไม่เกิน 50 ตัวอักษร'),
        body('last_name')
            .trim()
            .notEmpty().withMessage('กรุณากรอกนามสกุล')
            .isLength({ max: 100 }).withMessage('นามสกุลต้องไม่เกิน 50 ตัวอักษร'),
        body('gender')
            .trim()
            .notEmpty().withMessage('กรุณาเลือกเพศ')
            .isIn(['M', 'F']).withMessage('เพศต้องเป็น M หรือ F'),
        body('dept_id')
            .notEmpty().withMessage('กรุณาเลือกแผนก')
            .isInt({ min: 1 }).withMessage('dept_id ต้องเป็นตัวเลขมากกว่าศูนย์'),
        body('position_id')
            .notEmpty().withMessage('กรุณาเลือกตำแหน่ง')
            .isInt({ min: 1 }).withMessage('position_id ต้องเป็นตัวเลขมากกว่าศูนย์'),
        body('email')
            .trim()
            .notEmpty().withMessage('กรุณากรอกอีเมล')
            .isEmail().withMessage('รูปแบบอีเมลไม่ถูกต้อง'),
        body('password')
            .notEmpty().withMessage('กรุณากรอกรหัสผ่าน')
            .isLength({ min: 8 }).withMessage('รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร'),
    ],
    validate,
    employeeAuthController.register
);

router.get('/me', authenticateEmployee, employeeAuthController.me);

module.exports = router;
