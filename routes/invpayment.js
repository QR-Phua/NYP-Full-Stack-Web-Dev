const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const NormTransact = require('../models/NormTransact');
const InvPayment = require('../models/InvPayment');
const InvDelivery = require('../models/InvDelivery');
const Stock = require('../models/Stock');
const moment = require('moment');
const Deal = require('../models/Deal');
const alertMessage = require('../helpers/messenger');
const ensureAuthenticated = require('../helpers/auth');

router.get('/viewinvpayment', ensureAuthenticated, (req, res) => {
    InvPayment.findAll({
        order: [
            ['PayType', 'ASC']
        ],
        raw: true
    })
    .then((invpayments) => {
        // pass object to listVideos.handlebar
        res.render('invpayment/viewinvpayment', {
            invpayments: invpayments
        });
    })
    
    .catch(err => console.log(err));
});

router.get('/normaldealamt/:id', ensureAuthenticated, (req, res) => {
    let transactname = "";
    let transactprice = "";
    let transactid = "";
    NormTransact.findOne({ where: {id: req.params.id}})
    .then((Transact) => {
        transactname = Transact.supname;
        //if(req.user.id === deal.userId){
            transactid = Transact.id;
            transactprice = Transact.sgdprice;
            res.render('invpayment/normaldealamt', {
                transactid: transactid,
                transactname: transactname,
                transactprice: transactprice
        }).catch(err => console.log(err));
    }).catch(err => console.log(err));
})

router.post('/normaldealamt/:id', ensureAuthenticated, (req, res) => {
    let transactname = "";
    let transactprice = 0.00;
    let transactaddress = "";
    let transactzipcode = "";
    let transactid = req.params.id;
    let transactunit = req.body.transactunit;
    let transacttotal = 0.00;
    NormTransact.findOne({ where: {id: req.params.id}})
    .then((Transact) => {
        transactname = Transact.supname;
        //if(req.user.id === deal.userId){
            transactid = Transact.id;
            transactprice = Transact.sgdprice;
            transacttotal = transactunit * transactprice
            Supplier.findOne({ where: {supname: transactname}})
            .then((supplier) => {
                transactaddress = supplier.supaddress;
                transactzipcode = supplier.suppostalcode;
                res.render('invpayment/normaldealcart', {
                    transactid: transactid,
                    transactname: transactname,
                    transactunit: transactunit,
                    transactprice: transactprice,
                    transacttotal: transacttotal,
                    transactaddress: transactaddress,
                    transactzipcode: transactzipcode
                });
            }).catch(err => console.log(err));
        }).catch(err => console.log(err));
});

router.post('/normaldealcart/:id', ensureAuthenticated, (req, res) => {
    //insert codes here

    let errors = [];

    // Retrieves fields from register page from request body
    let supdate = moment(req.body.supdate, 'DD/MM/YYYY');
    let PayType = req.body.PayType;
    let ComPayName = req.body.ComPayName;
    let ComPayAddress = req.body.ComPayAddress;
    let ComPayZipcode = req.body.ComPayZipcode;
    let SupPayName = req.body.SupPayName;
    let SupPayAddress = req.body.SupPayAddress;
    let SupPayZipcode = req.body.SupPayZipcode;
    let PayPrice = req.body.PayPrice;
    let PayAmt = req.body.PayAmt;
    let PayTotal = req.body.PayTotal;
    let stkstatus = "Bought";
    let bizname = req.body.SupPayName;
    let stkamt = req.body.PayAmt;
    let stktotalcost = req.body.PayTotal;
    let stkdate = moment(req.body.supdate, 'DD/MM/YYYY');
    let leftover = req.body.PayAmt;
    
    if (supdate.length < 6) {
        errors.push({text: ' Date must be selected'});
    }
    if (ComPayName.length < 1) {
        errors.push({text: ' ComPayName need to be inputted'});
    }
    if (ComPayAddress.length < 1) {
        errors.push({text: ' ComPayAddress need to be inputted'});
    }
    if (ComPayZipcode.length < 1) {
        errors.push({text: ' ComPayZipcode need to be inputted'});
    }
    if (SupPayName.length < 1) {
        errors.push({text: ' SupPayName need to be inputted'});
    }
    if (SupPayAddress.length < 1) {
        errors.push({text: ' SupPayAddress need to be inputted'});
    }
    if (SupPayZipcode.length < 1) {
        errors.push({text: ' SupPayZipcode need to be inputted'});
    }
    if (PayPrice < 0) {
        errors.push({text: ' PayPrice need to be inputted'});
    }
    if (PayAmt < 0) {
        errors.push({text: ' PayAmt need to be inputted'});
    }
    if (PayTotal < 0) {
        errors.push({text: ' PayTotal need to be inputted'});
    }
    if (errors.length > 0) {
        res.render('invpayment/specialdealcart', {
            errors: errors,
            supdate,
            PayType,
            ComPayName,
            ComPayAddress,
            ComPayZipcode,
            SupPayName,
            SupPayAddress,
            SupPayZipcode,
            PayPrice,
            PayAmt,
            PayTotal,
        });
    } else {
        if (PayType == "Invoice"){
            let Status = "Unpaid";
            // Create new stock record
            Stock.create({stkstatus, bizname, stkamt, stktotalcost, stkdate, leftover});

            // Create new Delivery record
            InvDelivery.create({DeliveryDate: stkdate, DeliveryCompany: bizname, DeliveryPrice: PayPrice, DeliveryUnit: PayAmt, DeliveryTotal: PayTotal, DeliveryStatus: "Preparing"});

            // Create new payment record
            InvPayment.create({ 
                supdate, 
                PayType, 
                ComPayName, 
                ComPayAddress, 
                ComPayZipcode, 
                SupPayName, 
                SupPayAddress, 
                SupPayZipcode, 
                PayPrice, 
                PayAmt, 
                PayTotal,
                Status,
            }).then((invpayment) => {
                alertMessage(res, 'success', invpayment.PayType + ' from ' + invpayment.SupPayName + ' added.', 'fas fa-sign-in-alt', true);
                res.redirect('/invpayment/viewinvpayment');
            })
            .catch(err => console.log(err));
        } else {
            let Status = "Paid";
            res.render('invpayment/paymentReceipt', {
                supdate: req.body.supdate,
                PayType: PayType,
                ComPayName: ComPayName,
                ComPayAddress: ComPayAddress,
                ComPayZipcode: ComPayZipcode,
                SupPayName: SupPayName,
                SupPayAddress: SupPayAddress,
                SupPayZipcode: SupPayZipcode,
                PayPrice: PayPrice,
                PayAmt: PayAmt,
                PayTotal: PayTotal,
                stkstatus: stkstatus,
                bizname: bizname,
                stkamt: stkamt,
                stktotalcost: stktotalcost,
                stkdate: req.body.supdate,
                leftover: leftover,
                Status: Status,
            });
        }
    } 
});

router.get('/specialdealcart/:id', ensureAuthenticated, (req, res) => {
    let dealname = "";
    let dealprice = "";
    let dealamt = "";
    let dealtotal = "";
    let dealaddress = "";
    let dealzipcode = "";
    let dealid = "";
    Deal.findOne({ where: {id: req.params.id}})
    .then((deal) => {
            dealname = deal.supname;
            dealid = deal.id;
            dealprice = deal.sgdprice;
            dealamt = deal.supamt;
            dealtotal = deal.sgdtotal;
            Supplier.findOne({ where: {supname: dealname}})
            .then((supplier) => {
                dealaddress = supplier.supaddress;
                dealzipcode = supplier.suppostalcode;
                res.render('invpayment/specialdealcart', {
                    dealid: dealid,
                    dealname: dealname,
                    dealprice: dealprice,
                    dealamt: dealamt,
                    dealtotal: dealtotal,
                    dealaddress: dealaddress,
                    dealzipcode: dealzipcode
                });
            }).catch(err => console.log(err));
        }).catch(err => console.log(err));
})

router.post('/specialdealcart/:id', ensureAuthenticated, (req, res) => {
    //insert codes here

    let errors = [];

    // Retrieves fields from register page from request body
    let supdate = moment(req.body.supdate, 'DD/MM/YYYY');
    let PayType = req.body.PayType;
    let ComPayName = req.body.ComPayName;
    let ComPayAddress = req.body.ComPayAddress;
    let ComPayZipcode = req.body.ComPayZipcode;
    let SupPayName = req.body.SupPayName;
    let SupPayAddress = req.body.SupPayAddress;
    let SupPayZipcode = req.body.SupPayZipcode;
    let PayPrice = req.body.PayPrice;
    let PayAmt = req.body.PayAmt;
    let PayTotal = req.body.PayTotal;
    let stkstatus = "Bought";
    let bizname = req.body.SupPayName;
    let stkamt = req.body.PayAmt;
    let stktotalcost = req.body.PayTotal;
    let stkdate = moment(req.body.supdate, 'DD/MM/YYYY');
    let leftover = req.body.PayAmt;
    
    if (supdate.length < 6) {
        errors.push({text: ' Date must be selected'});
    }
    if (ComPayName.length < 1) {
        errors.push({text: ' ComPayName need to be inputted'});
    }
    if (ComPayAddress.length < 1) {
        errors.push({text: ' ComPayAddress need to be inputted'});
    }
    if (ComPayZipcode.length < 1) {
        errors.push({text: ' ComPayZipcode need to be inputted'});
    }
    if (SupPayName.length < 1) {
        errors.push({text: ' SupPayName need to be inputted'});
    }
    if (SupPayAddress.length < 1) {
        errors.push({text: ' SupPayAddress need to be inputted'});
    }
    if (SupPayZipcode.length < 1) {
        errors.push({text: ' SupPayZipcode need to be inputted'});
    }
    if (PayPrice < 0) {
        errors.push({text: ' PayPrice need to be inputted'});
    }
    if (PayAmt < 0) {
        errors.push({text: ' PayAmt need to be inputted'});
    }
    if (PayTotal < 0) {
        errors.push({text: ' PayTotal need to be inputted'});
    }
    if (errors.length > 0) {
        res.render('invpayment/specialdealcart', {
            errors: errors,
            supdate,
            PayType,
            ComPayName,
            ComPayAddress,
            ComPayZipcode,
            SupPayName,
            SupPayAddress,
            SupPayZipcode,
            PayPrice,
            PayAmt,
            PayTotal,
        });
    } else { 
        Deal.destroy({
            where: {
                id: req.params.id
            }
        })
        if (PayType == "Invoice"){
            let Status = "Unpaid";
            // Create new Stock record
            Stock.create({stkstatus, bizname, stkamt, stktotalcost, stkdate, leftover});

            // Create new Delivery record
            InvDelivery.create({DeliveryDate: stkdate, DeliveryCompany: bizname, DeliveryPrice: PayPrice, DeliveryUnit: PayAmt, DeliveryTotal: PayTotal, DeliveryStatus: "Preparing"});

            // Create new Payment record
            InvPayment.create({ 
                supdate, 
                PayType, 
                ComPayName, 
                ComPayAddress, 
                ComPayZipcode, 
                SupPayName, 
                SupPayAddress, 
                SupPayZipcode, 
                PayPrice, 
                PayAmt, 
                PayTotal,
                Status,
            }).then((invpayment) => {
                alertMessage(res, 'success', invpayment.PayType + ' from ' + invpayment.SupPayName + ' added.', 'fas fa-sign-in-alt', true);
                res.redirect('/invpayment/viewinvpayment');
            })
            .catch(err => console.log(err));
        } else {
            let Status = "Paid";
            res.render('invpayment/paymentReceipt', {
                supdate: req.body.supdate,
                PayType: PayType,
                ComPayName: ComPayName,
                ComPayAddress: ComPayAddress,
                ComPayZipcode: ComPayZipcode,
                SupPayName: SupPayName,
                SupPayAddress: SupPayAddress,
                SupPayZipcode: SupPayZipcode,
                PayPrice: PayPrice,
                PayAmt: PayAmt,
                PayTotal: PayTotal,
                stkstatus: stkstatus,
                bizname: bizname,
                stkamt: stkamt,
                stktotalcost: stktotalcost,
                stkdate: req.body.supdate,
                leftover: leftover,
                Status: Status,
            });
        }
    } 
});

router.get('/paymentReceipt', ensureAuthenticated, (req, res) => {
        res.render('invpayment/paymentReceipt');
});

router.post('/paymentReceipt', ensureAuthenticated, (req, res) => {
    let supdate = moment(req.body.supdate, 'DD/MM/YYYY');
    let PayType = req.body.PayType;
    let ComPayName = req.body.ComPayName;
    let ComPayAddress = req.body.ComPayAddress;
    let ComPayZipcode = req.body.ComPayZipcode;
    let SupPayName = req.body.SupPayName;
    let SupPayAddress = req.body.SupPayAddress;
    let SupPayZipcode = req.body.SupPayZipcode;
    let PayPrice = req.body.PayPrice;
    let PayAmt = req.body.PayAmt;
    let PayTotal = req.body.PayTotal;
    let stkstatus = req.body.stkstatus;
    let bizname = req.body.bizname;
    let stkamt = req.body.stkamt;
    let stktotalcost = req.body.stktotalcost;
    let stkdate = moment(req.body.stkdate, 'DD/MM/YYYY');
    let leftover = req.body.leftover;
    let Status = req.body.Status;
    // Create new Stock record
    Stock.create({stkstatus, bizname, stkamt, stktotalcost, stkdate, leftover});

    // Create new Delivery record
    InvDelivery.create({DeliveryDate: stkdate, DeliveryCompany: bizname, DeliveryPrice: PayPrice, DeliveryUnit: PayAmt, DeliveryTotal: PayTotal, DeliveryStatus: "Preparing"});
    
    // Create new Payment record
    InvPayment.create({ 
        supdate, 
        PayType, 
        ComPayName, 
        ComPayAddress, 
        ComPayZipcode, 
        SupPayName, 
        SupPayAddress, 
        SupPayZipcode, 
        PayPrice, 
        PayAmt, 
        PayTotal,
        Status,
    }).then((invpayment) => {
        alertMessage(res, 'success', invpayment.PayType + ' from ' + invpayment.SupPayName + ' added.', 'fas fa-sign-in-alt', true);
        res.redirect('/invpayment/viewinvpayment');
    })
    .catch(err => console.log(err));
});

router.get('/payingbackReceipt/:id', ensureAuthenticated, (req, res) => {
    res.render('invpayment/payingbackReceipt',{
        id: req.params.id,
    });
});

router.post('/payingbackReceipt/:id', ensureAuthenticated, (req, res) => {
        InvPayment.update({
        Status: "Paid"
        }, {
            where: {
                id: req.params.id
            }
        }). then((payments) => {
            alertMessage(res, 'success',' Payment has been paid successfully.', 'fas fa-edit', true);
            res.redirect('/invpayment/viewinvpayment');
    }).catch(err => console.log(err));
});

module.exports = router;