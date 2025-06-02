const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');
const Product = require('../models/Products');
const alertMessage = require('../helpers/messenger');
const ensureAuthenticated = require('../helpers/auth');
const moment = require('moment');

router.get('/viewinvStock', ensureAuthenticated, (req, res) => {
    let stkboughttotals = 0;
    let costboughttotals = 0.00;
    let cputotals = 0.00;
    let lastdate;

    Stock.findAll({where: {stkstatus: "Bought"}})
    .then((stkbought) => {
        stkbought.forEach(element => {
            if (element.leftover > 0){
            stkboughttotals+=element.leftover;
            costboughttotals= parseFloat(costboughttotals) + parseFloat(element.stktotalcost);
            }
        });
    }).catch(err => console.log(err));

    Stock.findAll({
        order: [
            ['id', 'DESC']
        ],
        raw: true
    })
    .then((stocks) => {
        Stock.findOne({where: {id: stocks.length}})
        .then((stktest) => {
            if(stktest != null){
                cputotals = parseFloat(costboughttotals/stkboughttotals).toFixed(2);
                res.render('stock/viewinvStock', {
                    stocks: stocks,
                    stkboughttotal: stkboughttotals,
                    costboughttotal: costboughttotals,
                    cputotal: cputotals,
                    lastdate: stktest.stkdate
                });
            } else{
                res.render('stock/viewinvStock', {
                    stocks: stocks
                });
            }
        }).catch(err => console.log(err));
        // pass object to listVideos.handlebar

    }).catch(err => console.log(err));
});

router.get('/rattanReturns/:id', ensureAuthenticated, (req, res) => {
    Stock.findOne({where: {id: req.params.id}})
    .then((stocks) => {
        // pass object to listVideos.handlebar
        res.render('stock/rattanReturns', {
            stocks: stocks
        });
    }).catch(err => console.log(err));
});

router.post('/rattanReturns/:id', ensureAuthenticated, (req, res) => {
     //insert codes here

     let errors = [];

     // Retrieves fields from register page from request body
    let stkstatuses = "Returned";
    let stkamts = req.body.stkamts;
    let leftovers = 0;
    let stkdates = moment(req.body.stkdates, 'DD/MM/YYYY');
    let remaining = 0;
     
     if (stkamts < 0) {
         errors.push({text: ' Amount must be more than 0'});
     }
     if (errors.length > 0) {
         res.render('stock/rattanReturns', {
             errors: errors,
             stkamts
         });
     } else { 
        Stock.findOne({where: {id: req.params.id}})
        .then((stocks) => {
            if (stkamts > stocks.leftover) {
                errors.push({text: ' Amount must be less then remaining'});
            }
            if (errors.length > 0) {
                res.render('stock/rattanReturns', {
                    errors: errors,
                    stkamts
                });
            } else { 
                remaining = stocks.leftover - stkamts;
                Stock.update({stkstatus: stocks.stkstatus, bizname: stocks.bizname, stkamt: stocks.stkamt, stktotalcost: stocks.stktotalcost, stkdate: stocks.stkdate, leftover: remaining}, {where: {id: stocks.id}});
                Stock.create({stkstatus: stkstatuses, bizname: stocks.bizname, stkamt: stkamts, stktotalcost: stocks.stktotalcost, stkdate: stkdates, leftover: leftovers});
                alertMessage(res, 'sucess', stkamts + " units of rattan from " + stocks.bizname + " has been returned", 'fas fa-donate', true);
                res.redirect('/stock/viewinvStock');
            }
        });
    };
});

router.get('/addProdUnit', ensureAuthenticated, (req, res) => {

    Product.findAll()
    .then((prods) => {
        // pass object to listVideos.handlebar
        res.render('stock/addProdUnit', {
            products: prods
        });
    }).catch(err => console.log(err));
});

router.get('/addmoreprodstk/:id', ensureAuthenticated, (req, res) => {
    let leftovers = 0;

    Stock.findAll({where: {stkstatus: "Bought"}})
    .then((stocks) => {
        stocks.forEach(element => {
            if (element.leftover > 0){
                leftovers += element.leftover;
            }
        });
    }).catch(err => console.log(err));

    Product.findOne({where: {id: req.params.id}})
    .then((prods) => {
        // pass object to listVideos.handlebar
        res.render('stock/addmoreProdstk', {
            prods: prods,
            leftover: leftovers
        });
    }).catch(err => console.log(err));
});

router.post('/addmoreprodstk/:id', ensureAuthenticated, (req, res) => {
    let errors = [];
    let leftovers = req.body.leftover;
    let productname = req.body.prodName;
    let supplyCost = req.body.supplyCost;
    let unitmade = req.body.stkQuantity;
    let totalsupplyCost = unitmade * supplyCost;
    let productid = req.params.id;
    let prodqty = req.body.prodQuantity;
    let increaseqty = parseInt(prodqty + unitmade);
    let remaining = 0;

    if (leftovers < totalsupplyCost) {
        errors.push({text: ' Not enough rattan! Please reduce the number of unit created'});
    }
    
    if (errors.length > 0) {
        res.render('stock/addmoreprodstk', {
            errors: errors,
            unitmade
        });
    } else {
        Product.update({prodQuantity: increaseqty}, { where: { id: productid } });
        
        //Reduce rattan stock
        Stock.findAll({where: {stkstatus: "Bought"}})
        .then((stocks) => {
            let unfinished = true;
            stocks.forEach(element => {
                if (unfinished == true){
                    if (element.leftover > 0){
                        if (totalsupplyCost < element.leftover){
                            remaining = element.leftover - totalsupplyCost;
                            Stock.update({leftover: remaining}, {where: {id: element.id}});
                            Stock.create({stkstatus: "Used", bizname: element.bizname, stkamt: totalsupplyCost, stktotalcost: element.stktotalcost, stkdate: element.stkdate, leftover: 0});
                            unfinished = false
                            alertMessage(res, 'sucess', "Used " + totalsupplyCost + " units of rattan to make " + unitmade + " units of " + productname, 'fas fa-donate', true);
                            res.redirect('/stock/viewinvStock');
                        } else {
                            Stock.update({leftover: 0}, {where: {id: element.id}});
                            totalsupplyCost = (totalsupplyCost - element.leftover);
                        }
                    }
                }
            }).catch(err => console.log(err));
        }).catch(err => console.log(err));
    }
});

module.exports = router;