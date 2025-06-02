const mySQLDB = require('./DBConfig');
const inventory = require('../models/Inventory');
const user = require('../models/User');
const products = require('../models/Products');
const suppliers = require('../models/Supplier');
const order = require('../models/Order');
const order_Item = require('../models/Order_Item');
const shopping_Cart = require('../models/Shopping_Cart');
const cart_Item = require('../models/Cart_Item')
const { response } = require('express');

// If drop is true, all existing tables are dropped and recreated
const setUpDB = (drop) => {
    mySQLDB.authenticate()
        .then(() => {
            console.log('Inventory database connected');
        })
        .then(() => {
            console.log('User database connected');
        })
        .then(() => {
        
        mySQLDB.sync({ // Creates table if none exists
            force: drop
        }).then(() => {
            console.log('Create tables if none exists')
        }).catch(err => console.log(err))
    })
    .catch(err => console.log('Error: ' + err));
};

module.exports = { setUpDB };