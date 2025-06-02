const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const alertMessage = require('../helpers/messenger');
const ensureAuthenticated = require('../helpers/auth');

// Add Rattan Supply
router.get('/addSupply', (req, res) => {
	Supplier.findAll()
    .then((suppliers) => {
    // pass object to listVideos.handlebar
    res.render('supplies/addSupply', {
        suppliers: suppliers
    });
    })
    .catch(err => console.log(err));
});

module.exports = router;