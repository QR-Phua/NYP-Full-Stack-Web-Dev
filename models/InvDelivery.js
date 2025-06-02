const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
/* Creates a user(s) table in MySQL Database. 
Note that Sequelize automatically pleuralizes the entity name as the table name
*/
const InvDelivery = db.define('invdelivery', { 
DeliveryDate: {
    type: Sequelize.DATE
},
DeliveryCompany: {
    type: Sequelize.STRING
},
DeliveryPrice: {
    type: Sequelize.DECIMAL(10,2)
},
DeliveryUnit: {
    type: Sequelize.INTEGER
},
DeliveryTotal: {
    type: Sequelize.DECIMAL(10,2)
},
DeliveryStatus: {
    type: Sequelize.STRING
},
});
module.exports = InvDelivery;