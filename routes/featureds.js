const express = require('express');
const router = express.Router();
const alertMessage = require('../helpers/messenger');
const Featureds = require('../models/Featureds');
const { route } = require('./main');
const fs = require('fs');

router.get('/featuredProducts', (req, res) => {
    Featureds.findAll({})
    .then((featureds) => {
        res.render('featureds/featuredProducts', {
            featureds: featureds
        });
    })

    .catch(err => console.log(err));
});

router.get('/showAddFeaturedProducts', (req,res) => {
    Featureds.findAll({})
    .then((featureds) => {
        res.render('featureds/allFeaturedProducts',{
            featureds: featureds
        });
    })
    .catch(err => console.log(err));
   
});

router.post('/addFeaturedProducts', (req, res) => {
    let fImage1 = req.files.fImg;
    let fName = req.body.fName;
    let fPrice = req.body.fPrice;

    if (req.files && req.files.fImg) {
        let dir = './public/uploads/product/';
        if (!fs.existsSync(dir)) {
         fs.mkdirSync(dir, { recursive: true });
        }

        let fImages = req.files.fImg;
        let nowDate = Date.now();
        let iconUrl = dir + nowDate / 1000 + "" + fImages.name;

         fImages.mv(iconUrl, async function (err) {
            if (err)
                console.log(err);
        });

        fimagePath = iconUrl.substring(9);
          var fimage1 = fimagePath
    }
        let dir = './public/uploads/product/';
        let nowDate = Date.now();
        let iconUrl = dir + nowDate / 1000 + "" + fImage1.name;
        fimagePath = iconUrl.substring(9);
        let fImage = fimagePath;

    // Multi-value components return array of strings or undefined
    Featureds.create({
        fImage,
        fName,
        fPrice
    }).then((featured) => {
        res.redirect('/featureds/showAddFeaturedProducts');
    })
        .catch(err => console.log(err))
});

// Shows edit Products page
router.get('/edit/:id', (req, res) => {
    Featureds.findOne({
        where: {
            id: req.params.id
        }
    }).then((featured) => {
        
        // call views/video/editVideo.handlebar to render the edit video page
        res.render('featureds/editProducts', {
            featured // passes video object to handlebar
        });
    }).catch(err => console.log(err)); // To catch no video ID
});

// Shows edited Products
router.post('/edit/:id', (req, res) => {
    let fImage1 = req.files.fIage;
    let fName = req.body.fName;
    let fPrice = req.body.fPrice;
    let id = req.params.id;

    if (req.files && req.files.fImage) {
        let dir = './public/uploads/product/';
        if (!fs.existsSync(dir)) {
         fs.mkdirSync(dir, { recursive: true });
        }

        let fImages = req.files.fImage;
        let nowDate = Date.now();
        let iconUrl = dir + nowDate / 1000 + "" + fImages.name;

         fImages.mv(iconUrl, async function (err) {
            if (err)
                console.log(err);
        });

        fimagePath = iconUrl.substring(9);
          var fimage1 = fimagePath
    }

        let dir = './public/uploads/product/';
        let nowDate = Date.now();
        let iconUrl = dir + nowDate / 1000 + "" + fImage1.name;
        fimagePath = iconUrl.substring(9);
        let fImage = fimagePath;

        Featureds.update({
        fImage,
        fName,
        fPrice,
        id
    }, {
        where: {
            id: req.params.id
        }
    }).then((featured) => {
        res.redirect('/fadmin');
    }).catch(err => console.log(err))
});

module.exports = router;