const Sequelize = require('sequelize');
const sequelize = require('../config/DBConfig');
const db = require('../config/DBConfig');

const Products = db.define('products', {
    image: {
        type: Sequelize.STRING
    },
    prodName: {
        type: Sequelize.STRING
    },
    prodPrice: {
        type: Sequelize.DOUBLE
    },
    prodDesc: {
        type: Sequelize.STRING
    },
    prodQuantity: {
        type: Sequelize.INTEGER
    },
    prodDimensions: {
        type: Sequelize.STRING
    },
    supplyCost: {
        type: Sequelize.INTEGER
    }
});

module.exports = Products;