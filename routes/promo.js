const e = require('connect-flash');
const express = require('express');
const { parse } = require('handlebars');
const db = require('../config/db');
const Promo = require('../models/Promo');
const router = express.Router();
const alertMessage = require('../helpers/messenger');

const { v4: uuidv4 } = require('uuid');
const querystring = require('querystring');

const ensureAuthenticated = require('../helpers/auth');

const { QueryTypes, where, BOOLEAN } = require('sequelize');
const sequelize = require('../config/DBConfig');
const User = require('../models/User');
require('dotenv').config({ path: '../.env' });
const path = require('path');
const fs = require('fs');
const { username } = require('../config/db');
const { Router } = require('express');

router.get('/all_Promos', (req, res) => {

    sequelize.query("SELECT * FROM promos", {
        type: QueryTypes.SELECT
    }).then((promo_Retrieved) => {
        console.log(promo_Retrieved);
        res.render('promo/all_Promos', {
            promos: promo_Retrieved
        });
    }).catch((err) => {
        console.error(err);
    });
});

router.get('/new_Entry', (req, res) => {
    res.render('promo/new_Entry', {
    });
});

router.get('/update_Promo/:promo_ID', (req, res) => {

    Promo.findOne({ where: { id: req.params.promo_ID } })
        .then((result) => {
            var active;
            if (result.status == "Not Active"){
                active = false
            } else {
                active = true;
            }

            sequelize.query("SELECT count(*) as uses FROM orders where discount_Code = :discount_Code group by discount_Code;", {
                replacements: { discount_Code: result.code },
                type: QueryTypes.SELECT
            }).then((use_Count) => {
                console.log(use_Count[0]);
                res.render('promo/update_Promo', {
                    result: result,
                    active: active,
                    use_Count: use_Count[0] == undefined ? 0 : use_Count[0]['uses']
                });
            }).catch((err) => {
                console.error(err);
            });

            
        }).catch((err) => console.error(err));

});

router.post('/new_Entry', (req, res) => {
    Promo.create({
        code: (req.body.discountCode).toUpperCase(),
        status: 'Active',
        discount: req.body.discountPercentage,
        target: req.body.target_Users,
        description: req.body.description
    }).then(() => {
        alertMessage(res, 'success', 'Promotional Code successfully added', '', true);
        res.redirect("/promo/all_Promos");
    })
});

router.post('/validateEntry', (req, res) => {
    var code = req.body.code;

    Promo.findAll({ where: { code: code } })
        .then((query_Results) => {
            var unique;
            if (query_Results.length > 0) {
                unique = false;
            } else {
                unique = true;
            }

            res.status(200).json({ "unique": unique });

        }).catch((err) => console.error(err));
});

router.post('/update_Promo_Details', (req, res) => {

    if (req.body.action == 'deactivate') {
        sequelize.query("UPDATE promos SET status = 'Not Active' WHERE id = :id", {
            replacements: { id: req.body.number },
            type: QueryTypes.UPDATE
        }).then(() => {
            alertMessage(res, 'success', 'Promotional Code deactivated!', '', true);
            res.redirect(200, '/promo/update_Promo/' + req.body.number);
        }).catch((err) =>{
            console.error(err);
            alertMessage(res, 'danger', 'Promotional Code could not be deactivated', 'fas fa-exclamation-circle', true);
            res.redirect(200, '/promo/update_Promo/' + req.body.number);
        });

    } else if (req.body.action == 'delete') {
        sequelize.query("DELETE FROM promos WHERE id = :id ", {
            replacements: { id: req.body.number },
            type: QueryTypes.DELETE
        }).then(() => {
            alertMessage(res, 'success', 'Promotional Code deleted!', '', true);
            res.redirect(200, '/promo/all_Promos');
        }).catch((err) => {
            console.error(err);
            alertMessage(res, 'danger', 'Promotional Code could not be deleted', 'fas fa-exclamation-circle', true);
            res.redirect(200, '/promo/all_Promos');
        });

    } else if (req.body.action == 'activate'){
        sequelize.query("UPDATE promos SET status = 'Active' WHERE id = :id", {
            replacements: { id: req.body.number },
            type: QueryTypes.UPDATE
        }).then(() => {
            alertMessage(res, 'success', 'Promotional Code activated!', '', true);
            res.redirect(200, '/promo/update_Promo/' + req.body.number);
        }).catch((err) =>{
            console.error(err);
            alertMessage(res, 'danger', 'Promotional Code could not be activated', 'fas fa-exclamation-circle', true);
            res.redirect(200, '/promo/update_Promo/' + req.body.number);
        });

    } else if (req.body.action == 'update_Description'){
        sequelize.query("UPDATE promos SET description = :description WHERE id = :id", {
            replacements: { description: req.body.description, id: req.body.number },
            type: QueryTypes.UPDATE
        }).then(() => {
            res.sendStatus(200);
        }).catch((err) =>{
            console.error(err);
        });
    }

});

router.get('/viewPromos', (req, res) => {
    sequelize.query("SELECT * FROM promos WHERE status = 'Active' AND (target='All' OR target='New')", {
        type: QueryTypes.SELECT
    }).then((promo_Retrieved) => {
        console.log(promo_Retrieved);
        res.render('promo/viewPromos', {
            promos: promo_Retrieved
        });
    }).catch((err) => {
        console.error(err);
    });
});

module.exports = router;