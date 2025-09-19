'use strict';
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'change-me'; 
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'; 

exports.sign = (payload) => jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
exports.verify = (token) => jwt.verify(token, SECRET); 
exports.expiresIn = EXPIRES_IN;
