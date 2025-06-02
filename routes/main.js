const express = require('express');
const router = express.Router();
const alertMessage = require('../helpers/messenger');
const Products = require('../models/Products');
const Featureds = require('../models/Featureds');
const sortArray = require('sort-array')
const ensureAuthenticated = require('../helpers/auth');
const User = require('../models/User');
const { Op } = require("sequelize");

router.get('/', (req, res) => {
	const title = 'Chun Mee Lee';
	res.render('index', {title: title}) // renders views/index.handlebars
});

// Admin
router.get('/admin', (req, res) => {
	const title = 'Chun Mee Lee';
	Products.findAll({})
    .then((products) => {
        res.render('products/allProducts',{    // renders views/allProducts.handlebars
			products: products,
			title: title
        });
    })
    .catch(err => console.log(err));
	
});

router.get('/fadmin', (req, res) => {
	const title = 'Chun Mee Lee';
	Featureds.findAll({})
    .then((featured) => {
        res.render('featureds/featuredProducts',{    // renders views/allProducts.handlebars
			featured: featured,
			title: title
        });
    })
    .catch(err => console.log(err));
	
});

// Add Inventory Quantity
router.get('/staff/showaddInventory', (req, res) => {
	res.render('staff/addInventory');
});

// Add New Inventory
router.get('/staff/newInventory', (req, res) => {
	res.render('staff/newInventory');
});

// Remove Inventory
router.get('/staff/rmvInventory', (req, res) => {
	res.render('staff/rmvInventory');
});

// Add Rattan Supplier
router.get('/supplier/addSupplier', (req, res) => {
	res.render('supplier/addSupplier');
});

router.get('/supplier/addSupplier', (req, res) => {
	res.render('supplier/addSupplier');
});

router.get('/invstklvl/viewinvstklvl', (req, res) => {
	res.render('invstklvl/viewinvstklvl');
});

router.get('/supplierextra/viewsupplierextra', (req, res) => {
	res.render('supplierextra/viewsupplierextra');
});

router.get('/products/sort/latest', (req, res) => {
	Products.findAll({ order: [['id', 'DESC']] })
		.then(function (products) {
			console.log(products);
			res.render('products/viewProducts', {
				products
			})
		})
});

router.get('/products/sort/earliest', (req, res) => {
	Products.findAll({ order: [['id', 'ASC']] })
		.then(function (products) {
			console.log(products);
			res.render('products/viewProducts', {
				products
			})
		})
});

router.get('/products/sort/name', (req, res) => {
	Products.findAll({ order: [['prodName', 'ASC']] })
		.then(function (products) {
			console.log(products);
			res.render('products/viewProducts', {
				products
			})
		})
});

router.get('/products/sort/price', (req, res) => {
	Products.findAll({ order: [['prodPrice', 'ASC']] })
		.then(function (products) {
			console.log(products);
			res.render('products/viewProducts', {
				products
			})
		})
});

router.get('/products/sort1/id', (req, res) => {
	Products.findAll({ order: [['id', 'ASC']] })
		.then(function (products) {
			console.log(products);
			res.render('products/allProducts', {
				products
			})
		})
});

router.get('/products/sort1/name', (req, res) => {
	Products.findAll({ order: [['prodName', 'ASC']] })
		.then(function (products) {
			console.log(products);
			res.render('products/allProducts', {
				products
			})
		})
});

router.get('/products/sort1/price', (req, res) => {
	Products.findAll({ order: [['prodPrice', 'ASC']] })
		.then(function (products) {
			console.log(products);
			res.render('products/allProducts', {
				products
			})
		})
});

router.get('/products/sort1/supplyCost', (req, res) => {
	Products.findAll({ order: [['supplyCost', 'ASC']] })
		.then(function (products) {
			console.log(products);
			res.render('products/allProducts', {
				products
			})
		})
});

router.get('/products/sort1/quantity', (req, res) => {
	Products.findAll({ order: [['prodQuantity', 'ASC']] })
		.then(function (products) {
			console.log(products);
			res.render('products/allProducts', {
				products
			})
		})
});

router.get('/featureds/sort2/id', (req, res) => {
	Featureds.findAll({ order: [['id', 'ASC']] })
		.then(function (featureds) {
			console.log(featureds);
			res.render('featureds/featuredProducts', {
				featureds
			})
		})
});

router.get('/featureds/sort2/name', (req, res) => {
	Featureds.findAll({ order: [['fName', 'ASC']] })
		.then(function (featureds) {
			console.log(featureds);
			res.render('featureds/featuredProducts', {
				featureds
			})
		})
});

router.get('/featureds/sort2/price', (req, res) => {
	Featureds.findAll({ order: [['fPrice', 'ASC']] })
		.then(function (featureds) {
			console.log(featureds);
			res.render('featureds/featuredProducts', {
				featureds
			})
		})
});

router.get('/products/viewProducts', (req, res) => {

	const perPage = 10;
	const page = req.query.page || 1;
	Products.findAll({
		skip: ((perPage * page) - perPage),
		limit: (perPage)
	}).then(products => {
		Products.count({}).then(productss => {
			console.log(productss)
			res.render('products/viewProducts', {
				products: products,
				current: parseInt(page),
				pagination: Math.ceil(productss / perPage),
			});

		})
	})
		.catch(err => console.log(err));

});

router.get('/products/productsDetail/:id', (req, res) => {
	let errors = [];
	if (req.body.prodquantity <= 0) {
		errors.push({ text: '{{prodName}} is out of sale' });
		res.render('products/productsDetail', { errors });
	} else {
		Products.findOne({
			where: {
				id: req.params.id
			}
		}).then((product) => {
			res.render('products/productsDetail', {
				product
			});
		});
	};
});

router.get('/products/allProducts', (req, res) => {
	res.render('products/allProducts');
});

router.get('/products/addProducts', (req, res) => {
	res.render('products/addProducts');
});

router.get('/products/delete/:id', (req, res) => {
	Products.destroy({
		where: {
			id: req.params.id
		}
	})
		.then((products) => {
			res.redirect('/admin')    // renders views/admin.handlebars
		})
		.catch(err => console.log(err));
});

router.get('/featureds/featuredProducts', (req, res) => {
	res.render('featureds/featuredProducts');
});

router.get('/featureds/addFeaturedProducts', (req, res) => {
	res.render('featureds/addFeaturedProducts');
});

router.get('/featureds/delete/:id', (req, res) => {
	Featureds.destroy({
		where: {
			id: req.params.id
		}
	})
		.then((featured) => {
			res.redirect('/fadmin')    // renders views/admin.handlebars
		})
		.catch(err => console.log(err));
});

router.get('/about', (req,res) => {
	res.render('about');
});

router.get('/showLogin', (req, res) => {
	res.render('user/login');
});

router.get('/showRegister', (req, res) => {
	res.render('user/register');
});

router.get('/showAfterlogin', (req,res) => {
	res.render('user/userlogin');
});

router.get('/showAfterlogin', (req, res) => {
	res.render('user/cushome');
});

router.get('/showProfile', (req, res) => {
	res.render('user/profile');
});

router.get('/showStaffRegister', (req, res) => {
	res.render('user/staffregister');
});

router.get('/showStaffRole', ensureAuthenticated, (req, res) => {
    User.findAll({
        where: {
            id: {[Op.ne]: req.user.id},
            role:{[Op.not]: ['User']}
        }
    }).then((user1) => {
        res.render('user/staffrole', {
            user1:user1
        });
    })
})

// Logout User
router.get('/logout', (req, res) => {
	req.logout();
	res.redirect('/');
});

module.exports = router;
