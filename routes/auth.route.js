'use strict';

const express = require('express');
const { body } = require('express-validator');
const userAuthController = require('../controllers/userAuth.controller');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { clearAuthCookie } = require('../utils/cookie');

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
    userAuthController.login
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
        body('email')
            .trim()
            .notEmpty().withMessage('กรุณากรอกอีเมล')
            .isEmail().withMessage('รูปแบบอีเมลไม่ถูกต้อง'),
        body('password')
            .notEmpty().withMessage('กรุณากรอกรหัสผ่าน')
            .isLength({ min: 8 }).withMessage('รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร'),
    ],
    validate,
    userAuthController.register
);

router.get('/me', authenticate, userAuthController.me);

// Logout: clear auth cookie and return success
router.post('/logout', (req, res) => {
    clearAuthCookie(res);
    res.json({ success: true, message: 'ออกจากระบบสำเร็จ' });
});

module.exports = router;
