
const { validationResult } = require('express-validator');


function validate(req, res, next) {
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    const formatted = {};
    errors.array().forEach(e => {

        if (!formatted[e.path]) formatted[e.path] = e.msg;
    });

    return res.status(422).json({
        error: 'Validation failed',
        details: formatted
    });
}

module.exports = validate;