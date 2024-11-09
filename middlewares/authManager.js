const jwt = require('jsonwebtoken');

require('dotenv').config();
const CODE = process.env.JSON_KEY;

function authManager (req, res, next) {
    const managerToken = req.cookies.managerToken;

    if (!managerToken) {
        return res.redirect('/manager/');
    }

    try {
        // verify and decode the token
        const manager = jwt.verify(managerToken, CODE);
        req.manager = manager;
        next();
        
    } catch (error) {
        res.clearCookie('managerToken');
        return res.redirect('/manager/');
    }
}

module.exports = authManager;