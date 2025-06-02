const express = require('express');
const router = express.Router();
const InvDelivery = require('../models/InvDelivery');
const moment = require('moment');
const alertMessage = require('../helpers/messenger');
const ensureAuthenticated = require('../helpers/auth');

router.get('/viewinvdelivery', ensureAuthenticated, (req, res) => {
    InvDelivery.findAll({
        order: [
            ['id', 'ASC']
        ],
        raw: true
    })
    .then((invdeliveries) => {
        // pass object to listVideos.handlebar
        res.render('invdelivery/viewinvdelivery', {
            invdeliveries: invdeliveries
        });
    })
    
    .catch(err => console.log(err));
});

router.get('/addinvdelivery', ensureAuthenticated, (req, res) => {
    InvDelivery.findAll()
    .then((deliveries) => {
    // pass object to listVideos.handlebar
    res.render('invdelivery/addinvdelivery', {
        deliveries: deliveries
    });
    })
    .catch(err => console.log(err));
});

router.post('/addinvdelivery', ensureAuthenticated, (req, res) => {

    // Retrieves fields from register page from request body
    let {deliveryid, deliverystatus} = req.body;

    // Create new user record
    InvDelivery.update({DeliveryStatus: deliverystatus}, { where: { id: deliveryid } })
    alertMessage(res, 'success', 'Delivey has been updated.', 'fas fa-sign-in-alt', true);
    res.redirect('/invdelivery/viewinvdelivery');
});

module.exports = router;