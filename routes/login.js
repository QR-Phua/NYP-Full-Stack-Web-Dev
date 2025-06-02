const express = require('express');
const { username } = require('../config/db');
const router = express.Router();

router.get('/showAfterlogin', (req, res) => {
    res.render('user/cushome', { // pass object to listVideos.handlebar
        username: username
    });
});

module.exports = router;