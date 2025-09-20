'use strict';
const { expiresIn } = require('./jwt');

exports.setAuthCookie = (res, token) => {

    const toMs = (s) => {
        if (/^\d+$/.test(s)) return Number(s) * 1000;
        const m = String(s).match(/^(\d+)([smhd])$/i);
        const n = m ? Number(m[1]) : 1;
        const unit = m ? m[2].toLowerCase() : 'h';
        const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit];
        return n * mult;
    };


    res.cookie('access_token', token, {
        httpOnly: true,
        maxAge: toMs(expiresIn),
    });
};

exports.clearAuthCookie = (res) => {
    res.clearCookie('access_token', { path: '/' });
};
