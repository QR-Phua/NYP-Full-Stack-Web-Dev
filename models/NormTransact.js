const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
/* Creates a user(s) table in MySQL Database. 
Note that Sequelize automatically pleuralizes the entity name as the table name
*/
const NormTransact = db.define('normTransact', { 
supname: {
    type: Sequelize.STRING
},
countrydollar: {
    type: Sequelize.STRING
},
supprice: {
    type: Sequelize.DECIMAL(10,2)
},
sgdprice: {
    type: Sequelize.DECIMAL(10,2)
},
supdate: {
    type: Sequelize.DATE
},
});
module.exports = NormTransact;