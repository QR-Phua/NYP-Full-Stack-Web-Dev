const e = require('connect-flash');
const express = require('express');
const { parse } = require('handlebars');
const db = require('../config/db');
const Products = require('../models/Products');
const router = express.Router();
const alertMessage = require('../helpers/messenger');
const Order = require('../models/Order');
const Order_Item = require('../models/Order_Item');
const moment = require('moment');
const { QueryTypes, where } = require('sequelize');

const ensureAuthenticated = require('../helpers/auth');
const sequelize = require('../config/DBConfig');
const pdf = require('pdfkit');
const fs = require('fs');
const path = require('path');

router.get('/custorder_All', ensureAuthenticated, (req, res) => {

    req.session.returnTo == null;
    req.session.save();

    var user_ID = req.user.id;
    sequelize.query("SELECT order_ID FROM orders WHERE user_ID = :user_ID",
        {
            replacements: { user_ID: user_ID },
            type: QueryTypes.SELECT
        })
        .then((orders) => {
            if (orders.length == 0) {
                res.render('order/custorder_All');
            } else {

                var order_List = []
                for (i = 0; i < orders.length; i++) {
                    order_List.push(orders[i]['order_ID']);
                }
                sequelize.query("SELECT *, order_items.id as 'order_items_ID', orders.id as 'order_PK_ID' FROM order_items left join orders ON orders.order_ID = order_items.order_ID WHERE order_items.order_ID IN (:order_ID) ORDER BY order_items.id DESC", {
                    replacements: { order_ID: order_List },
                    type: QueryTypes.SELECT

                }).then((order_Items) => {

                    var items = [];
                    for (i = 0; i < order_Items.length; i++) {
                        if (items.length <= 0) {

                            items.push([order_Items[i]]);

                        } else {
                            var insert = false;
                            for (j = 0; j < items.length; j++) {

                                if (items[j][0]["order_PK_ID"] == order_Items[i]["order_PK_ID"]) {

                                    items[j].push(order_Items[i]);
                                    insert = true;
                                    break
                                }
                            }

                            if (!insert) {
                                items.push([order_Items[i]]);
                            }
                        }
                    }

                    console.log(items);
                    res.render('order/custorder_All', {
                        items: items
                    });
                }).catch(err => console.log(err));
            }


        }).catch(err => console.log(err));
});

router.get('/custorder_Info/payment/:order_ID', ensureAuthenticated, (req, res) => { // add param IDs for order ID and item name
    req.session.returnTo == null;
    req.session.save();

    Order.findOne({
        where: {
            order_ID: req.params.order_ID
        }
    }).then((order) => {
        if (!order) {
            alertMessage(res, 'danger', 'Page was not found', 'fas fa-exclamation-circle', true);
            res.redirect('/');

        } else {
            if (req.user.id == undefined) {
                alertMessage(res, 'danger', 'Page was not found', 'fas fa-exclamation-circle', true);
                res.redirect('/login');
            } else {

                if (order.user_ID != req.user.id) {
                    alertMessage(res, 'danger', 'Page was not found', 'fas fa-exclamation-circle', true);
                    res.redirect('/login');

                } else {
                    Order_Item.findAll({
                        where: {
                            order_ID: req.params.order_ID,

                        }
                    }).then((order_Item) => {
                        if (!order_Item) {
                            alertMessage(res, 'danger', 'Item was not found', 'fas fa-exclamation-circle', true);
                            res.redirect('/');
                        } else {
                            res.render('order/custorder_PaymentInfo', {
                                order: order,
                                order_Item: order_Item
                            });

                        }

                    }).catch(err => console.log(err));
                }
            }

        }
    }).catch(err => console.log(err));

});

router.get('/custorder_Info/:order_ID/:item_Name', (req, res) => { // add param IDs for order ID and item name

    req.session.returnTo == null;
    req.session.save();

    Order.findOne({
        where: {
            order_ID: req.params.order_ID
        }
    }).then((order) => {
        if (!order) {
            alertMessage(res, 'danger', 'Page was not found', 'fas fa-exclamation-circle', true);
            res.redirect('/');

        } else {
            Order_Item.findOne({
                where: {
                    order_ID: req.params.order_ID,
                    product_Name: req.params.item_Name
                }
            }).then((order_Item) => {
                if (!order_Item) {
                    alertMessage(res, 'danger', 'Item was not found', 'fas fa-exclamation-circle', true);
                    res.redirect('/');
                } else {
                    res.render('order/custorder_Info', {
                        order: order,
                        order_Item: order_Item,
                        user: req.user == undefined ? false : true
                    });
                }

            }).catch(err => console.log(err));
        }



    }).catch(err => console.log(err));


});

router.get('/invoice/:order_ID', ensureAuthenticated, (req, res) => { // add param IDs for order ID and item name
    req.session.returnTo == null;
    req.session.save();
    Order.findOne({
        where: {
            id: req.params.order_ID
        }
    }).then((order) => {
        if (!order) {
            console.log("CANNOT FIND");
            alertMessage(res, 'danger', 'Page was not found', 'fas fa-exclamation-circle', true);
            res.redirect('/');

        } else {
            if (req.user.id == undefined) {
                alertMessage(res, 'danger', 'Page was not found', 'fas fa-exclamation-circle', true);
                res.redirect('/login');
            } else {

                if (order.user_ID != req.user.id) {
                    console.log("NOT SAME");
                    alertMessage(res, 'danger', 'Page was not found', 'fas fa-exclamation-circle', true);
                    res.redirect('/login');

                } else {
                    invoice_Item = req.user.id + "_" + order.order_ID + '.pdf';
                    new_Path = (path.resolve(__dirname, '../', 'public/invoices', invoice_Item)).toString();
                    console.log(new_Path);

                    var file = fs.createReadStream(new_Path);
                    var stat = fs.statSync(new_Path);
                    res.setHeader('Content-Length', stat.size);
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', 'inline; filename=invoice.pdf');
                    file.pipe(res);
                }
            }

        }
    }).catch(err => console.log(err));

});



module.exports = router;