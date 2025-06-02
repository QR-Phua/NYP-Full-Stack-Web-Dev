const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const NormTransact = require('../models/NormTransact');
const moment = require('moment');
const Deal = require('../models/Deal');
const alertMessage = require('../helpers/messenger');
const ensureAuthenticated = require('../helpers/auth');

router.get('/viewDeal', ensureAuthenticated, (req, res) => {
	Deal.findAll({
        order: [
            ['supname', 'ASC']
        ],
        raw: true
    })
    .then((deals) => {
        // pass object to listVideos.handlebar
        res.render('deal/viewDeal', {
            deals: deals
        });
    })
    
    .catch(err => console.log(err));
});

// List videos belonging to current logged in user
router.get('/addDeal', ensureAuthenticated, (req, res) => {
    Supplier.findAll()
    .then((suppliers) => {
    // pass object to listVideos.handlebar
    res.render('deal/addDeal', {
        suppliers: suppliers
    });
    })
    .catch(err => console.log(err));
});

router.post('/addDeal', ensureAuthenticated, (req, res) => {
    //insert codes here

    let errors = [];

    // Retrieves fields from register page from request body
    let {supname, countrydollar, supprice, supamt } = req.body;
    let supdate = moment(req.body.supdate, 'DD/MM/YYYY');
    let sgdprice = 0;
    let sgdtotal = 0;
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
    sgdtotal = (sgdprice * supamt);
    if (errors.length > 0) {
        res.render('deal/addDeal', {
            errors: errors,
            supname,
            countrydollar,
            supprice,
            sgdprice,
            supamt,
            supdate,
            sgdtotal
        });
    } else {     
                // Create new user record
                Deal.create({ supname, countrydollar, supprice, sgdprice, supamt, supdate, sgdtotal})
                .then(deal => {
                    alertMessage(res, 'success', deal.supname + ' added.', 'fas fa-sign-in-alt', true);
                    res.redirect('/deal/viewDeal');
                })
                .catch(err => console.log(err));
            }
});

router.get('/purchase/:id', ensureAuthenticated, (req, res) => {
    Deal.findOne({
        where: {
            id: req.params.id
        }
    }).then((deal) => {
            let dealname = deal.supname;
        //if(req.user.id === deal.userId){
            let dealid = deal.id;
            Deal.destroy({
                where: {
                    id: dealid
                }
            }).then(() => {
                alertMessage(res, 'sucess', dealname + "'s deal has been accepted", 'fas fa-donate', true);
            res.redirect('/deal/viewDeal');
            })
        /*}else{
            alertMessage(res, 'danger', 'Unauthorised access to video', 'fas fa-exclamation-circle', true);
            res.redirect('/logout')
        }*/
    }).catch(err => console.log(err));
})

router.get('/reject/:id', ensureAuthenticated, (req, res) => {
    Deal.findOne({
        where: {
            id: req.params.id
        }
    }).then((deal) => {
            let dealname = deal.supname;
        //if(req.user.id === deal.userId){
            let dealid = deal.id;
            Deal.destroy({
                where: {
                    id: dealid
                }
            }).then(() => {
                alertMessage(res, 'sucess', dealname + "'s deal has been rejected", 'fas fa-ban', true);
                res.redirect('/deal/viewDeal');
            })
        /*}else{
            alertMessage(res, 'danger', 'Unauthorised access to video', 'fas fa-exclamation-circle', true);
            res.redirect('/logout')
        }*/
    }).catch(err => console.log(err));
})
module.exports = router;