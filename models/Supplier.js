const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
/* Creates a user(s) table in MySQL Database. 
Note that Sequelize automatically pleuralizes the entity name as the table name
*/
const Supplier = db.define('supplier', { 
supname: {
    type: Sequelize.STRING
},
supcontactname: {
    type: Sequelize.STRING
},
supemail: {
    type: Sequelize.STRING
},
supcontactno: {
    type: Sequelize.STRING
},
suplocation: {
    type: Sequelize.STRING
},
supaddress: {
    type: Sequelize.STRING
},
suppostalcode: {
    type: Sequelize.STRING
},
image: {
    type: Sequelize.STRING
},
});
module.exports = Supplier;