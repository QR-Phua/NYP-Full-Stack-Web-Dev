const express = require('express');
const router = express.Router();
const alertMessage = require('../helpers/messenger');
const Products = require('../models/Products');
const { route } = require('./main');
const fs = require('fs');

router.get('/allProducts', (req, res) => {
    Products.findAll({})
    .then((products) => {
        res.render('products/allProducts', {
            products: products
        });
    })

    .catch(err => console.log(err));
});

router.get('/showAddProducts', (req,res) => {
    Products.findAll({})
    .then((products) => {
        res.render('products/allProducts',{
            products: products
        });
    })
    .catch(err => console.log(err));
   
});

router.post('/addProducts', (req, res) => {
    let productImage1 = req.files.prodImg;
    let prodName = req.body.ProdName;
    let supplyCost = req.body.supplyCost;
    let prodPrice = req.body.prodPrice;
    let prodQuantity = req.body.prodQuantity;
    let prodDesc = req.body.prodDesc;
    let prodDimensions = req.body.prodDime;
    let featuredProducts = req.body.featuredProducts;

    // let productsId = req.products.id;

    if (req.files && req.files.prodImg) {
        let dir = './public/uploads/product/';
        if (!fs.existsSync(dir)) {
         fs.mkdirSync(dir, { recursive: true });
        }

        let productImage = req.files.prodImg;
        let nowDate = Date.now();
        let iconUrl = dir + nowDate / 1000 + "" + productImage.name;

         productImage.mv(iconUrl, async function (err) {
            if (err)
                console.log(err);
        });

        imagePath = iconUrl.substring(9);
          var image1 = imagePath
    }
        let dir = './public/uploads/product/';
        let nowDate = Date.now();
        let iconUrl = dir + nowDate / 1000 + "" + productImage1.name;
        imagePath = iconUrl.substring(9);
        let image = imagePath;

    // Multi-value components return array of strings or undefined
    Products.create({
        image,
        prodName,
        supplyCost,
        prodPrice,
        prodDesc,
        prodQuantity,
        prodDimensions,
        featuredProducts,
        supplyCost
        // productsId
    }).then((product) => {
        res.redirect('/products/showAddProducts');
    })
        .catch(err => console.log(err))
});

// Shows edit Products page
router.get('/edit/:id', (req, res) => {
    Products.findOne({
        where: {
            id: req.params.id
        }
    }).then((product) => {
        
        // call views/video/editVideo.handlebar to render the edit video page
        res.render('products/updateProducts', {
            product // passes video object to handlebar
        });
    }).catch(err => console.log(err)); // To catch no video ID
});

// Shows edited Products
router.post('/edit/:id', (req, res) => {
    let productImage1 = req.files.image;
    let prodName = req.body.prodName;
    let supplyCost = req.body.supplyCost;
    let prodPrice = req.body.prodPrice;
    let prodQuantity = req.body.prodQuantity;
    let prodDesc = req.body.prodDesc;
    let prodDimen = req.body.prodDimen;
    let featuredProducts = req.body.featuredProducts;
    let id = req.params.id;

    if (req.files && req.files.image) {
        let dir = './public/uploads/product/';
        if (!fs.existsSync(dir)) {
         fs.mkdirSync(dir, { recursive: true });
        }

        let productImage = req.files.image;
        let nowDate = Date.now();
        let iconUrl = dir + nowDate / 1000 + "" + productImage.name;

         productImage.mv(iconUrl, async function (err) {
            if (err)
                console.log(err);
        });

        imagePath = iconUrl.substring(9);
          var image1 = imagePath
    }

        let dir = './public/uploads/product/';
        let nowDate = Date.now();
        let iconUrl = dir + nowDate / 1000 + "" + productImage1.name;
        imagePath = iconUrl.substring(9);
        let image = imagePath;

    Products.update({
        image,
        prodName,
        supplyCost,
        prodPrice,
        prodDesc,
        prodQuantity,
        prodDimen,
        featuredProducts,
        id,
        supplyCost
    }, {
        where: {
            id: req.params.id
        }
    }).then((product) => {
        res.redirect('/admin');
    }).catch(err => console.log(err))
});

module.exports = router;