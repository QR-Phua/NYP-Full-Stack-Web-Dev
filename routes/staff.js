const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const Supplier = require('../models/Supplier');
const Deal = require('../models/Deal');
const Payment = require('../models/InvPayment');
const Transaction = require('../models/NormTransact');
const Stock = require('../models/Stock');
const Product = require('../models/Products');
const alertMessage = require('../helpers/messenger');
const ensureAuthenticated = require('../helpers/auth');

//test

// Inventory Management
router.get('/invManage', ensureAuthenticated, (req, res) => {
    let lastsupname = "";
    let stkboughttotals = 0;
    let lastdeal;
    let totalpayment = 0.00;

    Supplier.findAll({})
    .then((suppliers) => {
        Supplier.findOne({where: {id: suppliers.length}})
        .then((supplies) => {
            if (supplies != null){
                lastsupname = supplies.supname;
            } else{
                lastsupname = "Empty";
            }
            
            Deal.findAll({})
            .then((deals) => {
                Deal.findOne({where: {id: deals.length}})
                .then((dealings) => {
                    Payment.findAll({where: {Status: "Unpaid"}})
                    .then((payments) => {
                        payments.forEach(element => {
                            totalpayment+= parseFloat(element.PayTotal); 
                        });
                    }).catch(err => console.log(err));

                    Stock.findAll({where: {stkstatus: "Bought"}})
                    .then((stkbought) => {
                        stkbought.forEach(element => {
                            if (element.leftover > 0){
                                stkboughttotals+=element.leftover;
                            }
                        });
                    }).catch(err => console.log(err));


                    Product.findAll({
                        order: [
                            ['prodQuantity', 'ASC']
                        ],
                        raw: true
                    }).then((productions) => {
                        res.render('staff/invManage', {
                            lastsupname: lastsupname,
                            lastdeal: dealings,
                            totalpayment: totalpayment,
                            stkboughttotals: stkboughttotals,
                            products: productions
                        });
                    }).catch(err => console.log(err));
                }).catch(err => console.log(err));
            }).catch(err => console.log(err));
        });
    }).catch(err => console.log(err));
});

// User register URL using HTTP post => /user/register
router.post('/addInventory', (req, res) => {
    //insert codes here

    let errors = [];

    // Checks that product quantity is not equal to or less than 0
    if (req.body.invquantity <= 0) {
        errors.push({text: ' Quantity must be more than 0'});
        console.log(req.body.invquantity);
    }
    
    if (req.body.invsupply < 0) {
        errors.push({text: ' Supply used must be not be less than 0'});
    }

    if (errors.length > 0) {
       res.render('staff/addInventory', {
           errors: errors,
           invname: req.body.invname,
           invquantity: req.body.invquantity,
           invsupply: req.body.invsupply
       });
    } else {
       let success_msg = ` Product stocked successfully`;
       res.render('staff/invManage', {
           success_msg: success_msg
       });
    }
});

router.post('/addSupply', (req, res) => {
    //insert codes here

    let errors = [];
    
    if (req.body.supquantity <= 0) {
        errors.push({text: ' Quantity must be more than 0'});
    }

    if (req.body.supdate <= 0) {
        errors.push({text: ' Date must be inputted'});
    }

    if (errors.length > 0) {
        res.render('staff/addSupply', {
            errors: errors,
            supname: req.body.supname,
            supquantity: req.body.supquantity,
            supdate: req.body.supdate
        });
    } else {
        let success_msg = ` Supply added successfully`;
        res.render('staff/invManage', {
            success_msg: success_msg
        });
    }
});
router.post('/newInventory', (req, res) => {
    //insert codes here

    let errors = [];

    let {prodname, proddesc} = req.body;

    let prodqty = 0;

    if (prodname.length  < 2) {
        errors.push({text: ' Product name must be at least 2 characters'});
    }

    if (errors.length > 0) {
        res.render('staff/newInventory', {
            errors,
            prodname,
            proddesc,
            prodqty
        });
    } else {
        Inventory.findOne({ where: {prodname: req.body.prodname} })
            .then(inventory => {
                if(inventory){
                    res.render('staff/newInventory', {
                        error: inventory.prodname + 'already registered',
                        prodname,
                        proddesc,
                        prodqty
                    });
                } else {
                    Inventory.create({ prodname, proddesc, prodqty})
                    .then(inventory => {
                        alertMessage(res, 'success', inventory.prodname + 'added.','fas fa-sign-in-alt', true);
                    })
                    .catch(err => console.log(err));
                }
            });
        }
});

router.post('/rmvInventory', (req, res) => {
    //insert codes here

    let errors = [];
    
    if (errors.length > 0) {
        res.render('staff/rmvInventory', {
            errors: errors,
            invname: req.body.invname
        });
    } else {
        let success_msg = ` Inventory removed successfully`;
        res.render('staff/invManage', {
            success_msg: success_msg
        });
    }
});

module.exports = router;