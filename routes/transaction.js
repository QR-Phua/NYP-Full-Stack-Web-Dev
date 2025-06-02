const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const Transaction = require('../models/NormTransact');
const alertMessage = require('../helpers/messenger');
const moment = require('moment');
const ensureAuthenticated = require('../helpers/auth');

// Add Rattan Supply
router.get('/addTransaction', ensureAuthenticated, (req, res) => {
    Supplier.findAll()
    .then((suppliers) => {
    // pass object to listVideos.handlebar
    res.render('transaction/addTransaction', {
        suppliers: suppliers
    });
    })
    .catch(err => console.log(err));
});

router.post('/addTransaction', ensureAuthenticated, (req, res) => {
    //insert codes here

    let errors = [];

    // Retrieves fields from register page from request body
    let {supname, countrydollar, supprice } = req.body;
    let supdate = moment(req.body.supdate, 'DD/MM/YYYY');
    let sgdprice = 0;
    if (supdate.length < 6) {
        errors.push({text: ' Date must be selected'});
    }
    if(countrydollar == "SGD"){
        sgdprice = supprice;
    }else if(countrydollar == "MYR"){
        sgdprice = (supprice/3.08);
    }else if(countrydollar == "USD"){
        sgdprice = (supprice/0.73);
    }else{
        sgdprice = supprice;
    }
    if (errors.length > 0) {
        res.render('deal/addDeal', {
            errors: errors,
            supname,
            countrydollar,
            supprice,
            sgdprice,
            supdate,
        });
    } else {     
                // Create new user record
                Transaction.create({ supname, countrydollar, supprice, sgdprice, supdate})
                .then(transaction => {
                    alertMessage(res, 'success', transaction.supname + ' added.', 'fas fa-sign-in-alt', true);
                    res.redirect('/transaction/viewTransaction');
                })
                .catch(err => console.log(err));
            }
});

router.get('/viewTransaction', ensureAuthenticated, (req, res) => {
	Transaction.findAll({
        order: [
            ['supname', 'ASC']
        ],
        raw: true
    })
    .then((transactions) => {
        // pass object to listVideos.handlebar
        res.render('transaction/viewTransaction', {
            transactions: transactions
        });
    })
    
    .catch(err => console.log(err));
});

module.exports = router;