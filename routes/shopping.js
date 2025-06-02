const e = require('connect-flash');
const express = require('express');
const { parse } = require('handlebars');
const db = require('../config/db');
const Products = require('../models/Products');
const Promo = require('../models/Promo');
const router = express.Router();
const alertMessage = require('../helpers/messenger');
const Order = require('../models/Order');
const Order_Item = require('../models/Order_Item');
const { v4: uuidv4 } = require('uuid');
const querystring = require('querystring');

const ensureAuthenticated = require('../helpers/auth');
const Shopping_Cart = require('../models/Shopping_Cart');
const Cart_Item = require('../models/Cart_Item');
const { QueryTypes, where, BOOLEAN } = require('sequelize');
const sequelize = require('../config/DBConfig');
const User = require('../models/User');
require('dotenv').config({ path: '../.env' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('paypal-rest-sdk');
const sgMail = require('@sendgrid/mail');
const pdfKit = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { username } = require('../config/db');

paypal.configure({
	'mode': 'sandbox',
	'client_id': process.env.PAYPAL_CLIENT_ID,
	'client_secret': process.env.PAYAPL_CLIENT_SECRET,
});


//Show the cart Page
router.get('/viewCart', (req, res) => {
	var cartLength;
	var subtotal = 0;
	if (req.session.items == null) {
		cartLength = 0;
		req.session.discount = 0;
		req.session.amount_Saved = 0;
		//req.session.cart_Total = req.session.subtotal;
		req.session.promo_Code = "";
		req.session.save();

		res.render('shopping/viewCart', {
			items: req.session.items,
			cartLength: 0
		});

	} else {
		cartLength = req.session.items.length;

		var item_Array = req.session.items;

		for (i = 0; i < cartLength; i++) {
			subtotal += (parseFloat(item_Array[i]['price']) * parseInt(item_Array[i]['quantity']));
		}

		subtotal = Math.round((subtotal + Number.EPSILON) * 100) / 100;

		req.session.subtotal = subtotal;

		if (req.session.discount == null || parseInt(req.session.discount) == 0) {
			console.log("discount null", req.session.discount);
			req.session.cart_Total = subtotal;
			req.session.amount_Saved = 0;

		} else {
			console.log("discount not null", req.session.discount);
			var discount = parseFloat((parseInt(req.session.discount) / 100) * parseFloat(subtotal));
			var cart_Total = Math.round(((subtotal - discount) + Number.EPSILON) * 100) / 100;
			console.log("discount not null", cart_Total);

			req.session.cart_Total = cart_Total;
			req.session.amount_Saved = Math.round(((subtotal - cart_Total) + Number.EPSILON) * 100) / 100;
		}

		var shipping_Free;
		if (parseFloat(req.session.cart_Total) > 1000) {
			req.session.freeShipping = true;
			shipping_Free = true;
			alertMessage(res, 'success', "You qualify for free shipping!");

		} else {
			req.session.freeShipping = false;
			shipping_Free = false;
			alertMessage(res, ' ', "Spend more than $1000, after discount, to get free shipping!");
		}

		req.session.save();
		res.render('shopping/viewCart', {
			items: req.session.items,
			subtotal: req.session.subtotal,
			cart_Total: req.session.cart_Total,
			discount_Amount: req.session.amount_Saved,
			promo_Code: (req.session.promo_Code != undefined) ? req.session.promo_Code : "",
			shipping: shipping_Free
		});
	}

	console.log(req.session.items);


});

router.post('/viewCart', (req, res) => {

	sess_Items = req.session.items;

	if (req.body.action == "remove_Product") {

		var index_Value = (req.body.index_Value).split("_");

		index_Value = parseInt(index_Value[1]);

		var deleted_Item = sess_Items.splice(index_Value, 1);


		req.session.items = sess_Items;

		req.session.save();

		//res.sendStatus(200); //send success response to AJAX request

		sequelize.query("DELETE FROM cart_items WHERE cart_ID = :cart_ID AND product_Name = :product_Name ", {
			replacements: { cart_ID: req.sessionID, product_Name: deleted_Item[0]['name'] },
			type: QueryTypes.DELETE
		}).catch(err => console.log(err));

		alertMessage(res, 'success', 'Item removed from cart!', 'fas fa-trash-alt', true);
		res.redirect(200, '/shopping/viewCart');

	} else if (req.body.action == "add_Product") { // add product from product detail

		var index_Value = (req.body.index_Value).split("_");

		index_Value = parseInt(index_Value[1]);

		var exceeded_Quantity = 0;
		var cart_ID = req.sessionID
		Shopping_Cart.findOne({ where: { cart_ID: cart_ID } })
			.then(shopping_Cart => {
				if (!shopping_Cart) {
					Shopping_Cart.create({
						cart_ID
					}).catch(err => console.log(err));
				}
			});

		Products.findOne({ where: { id: index_Value } }) // get selected product from database
			.then(product => {
				console.log(product);
				if (sess_Items == undefined) { //shopping cart empty, add first item
					var item = {
						"id": product.id,
						"name": product.prodName,
						"price": product.prodPrice,
						"description": product.prodDesc,
						"dimensions": product.prodDimensions,
						"image": product.image,
						"quantity": parseInt(req.body.quantity),
						"item_Total": Math.round(((parseFloat(product.prodPrice) * parseInt(req.body.quantity)) + Number.EPSILON) * 100) / 100
					}

					var items = [item];
					req.session.items = items;
					req.session.save();



					Cart_Item.create({
						cart_ID: req.sessionID,
						product_Name: product.prodName,
						product_Description: product.prodDesc,
						price: product.prodPrice,
						dimensions: product.prodDimensions,
						quantity: parseInt(req.body.quantity),
						image: product.image,

					}).catch(err => console.log(err));

				} else {
					var productInList = false;
					for (i = 0; i < sess_Items.length; i++) {

						if (product.prodName == sess_Items[i]['name']) {
							console.log("item found in shopping cart");
							productInList = true;

							newQuantity = parseInt(sess_Items[i]['quantity']) + parseInt(req.body.quantity);

							if (newQuantity > 4) { //check if item quantity exceeds maximum quantity of 4
								exceeded_Quantity = Math.abs(4 - newQuantity);
								sess_Items[i]['quantity'] = 4;
								sess_Items[i]['item_Total'] = Math.round(((4 * parseFloat(sess_Items[i]['price'])) + Number.EPSILON) * 100) / 100;
								req.session.items = sess_Items;
								req.session.save();

								sequelize.query("UPDATE cart_items SET quantity = :quantity WHERE cart_ID = :cart_ID AND product_Name = :product_Name", {
									replacements: { quantity: 4, cart_ID: req.sessionID, product_Name: product.prodName },
									type: QueryTypes.UPDATE
								}).catch(err => console.log(err));

								break;

							} else {  // less than 4 quantity
								sess_Items[i]['quantity'] = newQuantity;
								sess_Items[i]['item_Total'] = Math.round(((newQuantity * parseFloat(sess_Items[i]['price'])) + Number.EPSILON) * 100) / 100;
								req.session.items = sess_Items;
								req.session.save();

								sequelize.query("UPDATE cart_items SET quantity = :quantity WHERE cart_ID = :cart_ID AND product_Name = :product_Name", {
									replacements: { quantity: newQuantity, cart_ID: req.sessionID, product_Name: product.prodName },
									type: QueryTypes.UPDATE
								}).catch(err => console.log(err));

								break;
							}

						}
					}

					if (!productInList) {
						console.log("item not found in shopping cart");
						var item = {
							"id": product.id,
							"name": product.prodName,
							"price": product.prodPrice,
							"description": product.prodDesc,
							"dimensions": product.prodDimensions,
							"image": product.image,
							"quantity": parseInt(req.body.quantity),
							"item_Total": Math.round(((parseFloat(product.prodPrice) * parseInt(req.body.quantity)) + Number.EPSILON) * 100) / 100
						}
						sess_Items.push(item);
						req.session.items = sess_Items;
						req.session.save();

						Cart_Item.create({
							cart_ID: req.sessionID,
							product_Name: product.prodName,
							product_Description: product.prodDesc,
							price: product.prodPrice,
							dimensions: product.prodDimensions,
							quantity: parseInt(req.body.quantity),
							image: product.image,
						}).catch(err => console.log(err));
					}

					if (exceeded_Quantity > 0) {
						console.log("In path for > 0 exceed quantity");
						res.status(200).json({ "exceeded_Quantity": "true" }); //send success response to AJAX request
					} else {
						console.log("In path where no exceed quantity");
						res.status(200).json({ "exceeded_Quantity": "false" });
					}
				}
			}).catch(err => console.log(err));


	} else if (req.body.action == "update_Quantity") {

		var index_Value = (req.body.index_Value).split("_");

		index_Value = parseInt(index_Value[1]);
		console.log(sess_Items);
		console.log(index_Value);

		if (sess_Items[index_Value]['quantity'] == "1" && req.body.operation == 'minus') {

			var deleted_Item = sess_Items.splice(index_Value, 1);

			req.session.items = sess_Items;

			req.session.save();

			sequelize.query("DELETE FROM cart_items WHERE cart_ID = :cart_ID AND product_Name = :product_Name ", {
				replacements: { cart_ID: req.sessionID, product_Name: deleted_Item[0]['name'] },
				type: QueryTypes.DELETE
			}).catch(err => console.log(err));

			//res.sendStatus(200); //send success response to AJAX request

			alertMessage(res, 'success', ' Item removed from cart!', 'fas fa-trash-alt', true);

			res.status(200).json({ "action": "delete" }); //send success response to AJAX request


		} else {

			if (req.body.operation == 'minus') {
				sess_Items[index_Value]['quantity'] = parseInt(sess_Items[index_Value]['quantity'] - 1);
				sess_Items[index_Value]['item_Total'] = Math.round(((parseInt(sess_Items[index_Value]['quantity']) * parseFloat(sess_Items[index_Value]['price'])) + Number.EPSILON) * 100) / 100;
			} else {
				sess_Items[index_Value]['quantity'] = parseInt(sess_Items[index_Value]['quantity'] + 1);
				sess_Items[index_Value]['item_Total'] = Math.round(((parseInt(sess_Items[index_Value]['quantity']) * parseFloat(sess_Items[index_Value]['price'])) + Number.EPSILON) * 100) / 100;
			}

			sequelize.query("UPDATE cart_items SET quantity = :quantity WHERE cart_ID = :cart_ID AND product_Name = :product_Name", {
				replacements: { quantity: parseInt(sess_Items[index_Value]['quantity']), cart_ID: req.sessionID, product_Name: sess_Items[index_Value]['name'] },
				type: QueryTypes.UPDATE
			}).catch(err => console.log(err));

			req.session.items = sess_Items;

			var subtotal = 0.00;
			for (i = 0; i < sess_Items.length; i++) {
				subtotal += parseFloat(sess_Items[i]['item_Total']);
			}

			req.session.subtotal = Math.round((subtotal + Number.EPSILON) * 100) / 100;

			if (req.session.discount == null || parseInt(req.session.discount) == 0) {
				console.log("discount null");
				req.session.cart_Total = Math.round((subtotal + Number.EPSILON) * 100) / 100;
				req.session.amount_Saved = 0;

			} else {
				console.log("discount not null");
				var discount = parseFloat((parseInt(req.session.discount) / 100) * parseFloat(subtotal));
				var cart_Total = Math.round(((subtotal - discount) + Number.EPSILON) * 100) / 100;
				var amount_Saved = Math.round(((subtotal - cart_Total) + Number.EPSILON) * 100) / 100;
				req.session.cart_Total = cart_Total;
				req.session.amount_Saved = amount_Saved;
			}

			if (parseFloat(req.session.cart_Total) > 1000) {
				req.session.freeShipping = true;

			} else {
				req.session.freeShipping = false;
			}
			req.session.save();

			res.status(200).json({
				"item_Quantity": sess_Items[index_Value]['quantity'], "index_Value": index_Value, "item_Total": sess_Items[index_Value]['item_Total'],
				"cart_Discount": req.session.amount_Saved, "cart_Total": req.session.cart_Total, "cart_Subtotal": req.session.subtotal, "free_Shipping": req.session.freeShipping
			}); //send success response to AJAX request
		}



	} else if (req.body.action == "validate_Promo") {

		var code = req.body.code;

		Promo.findOne({ where: { code: code } })
			.then(result => {
				if (result) {
					if (result.status == "Active") {
						console.log("discount active");

						var require_Login = false;

						if (result.target == 'All') {
							req.session.discount = result.discount;
							var current_Total = parseFloat(req.session.subtotal);
							var discount = parseFloat((parseInt(result.discount) / 100) * current_Total);
							var cart_Total = Math.round(((current_Total - discount) + Number.EPSILON) * 100) / 100;

							req.session.cart_Total = cart_Total;
							req.session.amount_Saved = Math.round(((parseFloat(req.session.subtotal) - cart_Total) + Number.EPSILON) * 100) / 100;
							req.session.promo_Code = code;

						} else if (result.target == 'New') {
							if (req.user != null) {
								Order.findAll({ where: { user_ID: req.user.id } })
									.then(order_Query => {
										if (order_Query.length > 0) {
											req.session.discount = 0;

											var current_Total = parseFloat(req.session.subtotal);

											req.session.cart_Total = current_Total;
											req.session.amount_Saved = 0;
											req.session.promo_Code = "";

										} else {
											req.session.discount = result.discount;
											var current_Total = parseFloat(req.session.subtotal);
											var discount = parseFloat((parseInt(result.discount) / 100) * current_Total);
											var cart_Total = Math.round(((current_Total - discount) + Number.EPSILON) * 100) / 100;

											req.session.cart_Total = cart_Total;
											req.session.amount_Saved = Math.round(((parseFloat(req.session.subtotal) - cart_Total) + Number.EPSILON) * 100) / 100;
											req.session.promo_Code = code;
										}
									}).catch((err) => {
										console.error(err);
									})

							} else {
								require_Login = true;
								req.session.discount = 0;

								var current_Total = parseFloat(req.session.subtotal);

								req.session.cart_Total = current_Total;
								req.session.amount_Saved = 0;
								req.session.promo_Code = "";
							}

						} else {

							if (req.user != null) {
								if (req.user.id == result.target) {
									req.session.discount = result.discount;
									var current_Total = parseFloat(req.session.subtotal);
									var discount = parseFloat((parseInt(result.discount) / 100) * current_Total);
									var cart_Total = Math.round(((current_Total - discount) + Number.EPSILON) * 100) / 100;

									req.session.cart_Total = cart_Total;
									req.session.amount_Saved = Math.round(((parseFloat(req.session.subtotal) - cart_Total) + Number.EPSILON) * 100) / 100;
									req.session.promo_Code = code;
								} else {
									req.session.discount = 0;

									var current_Total = parseFloat(req.session.subtotal);

									req.session.cart_Total = current_Total;
									req.session.amount_Saved = 0;
									req.session.promo_Code = "";
								}

							} else {
								require_Login = true;
								req.session.discount = 0;

								var current_Total = parseFloat(req.session.subtotal);

								req.session.cart_Total = current_Total;
								req.session.amount_Saved = 0;
								req.session.promo_Code = "";
							}

						}

						if (parseFloat(req.session.cart_Total) > 1000) {
							req.session.freeShipping = true;

						} else {
							req.session.freeShipping = false;
						}

						req.session.save();

						res.status(200).json({ "cart_Discount": req.session.amount_Saved, "cart_Total": req.session.cart_Total, "free_Shipping": req.session.freeShipping, "require_Login": require_Login });

					} else {
						req.session.discount = 0;

						var current_Total = parseFloat(req.session.subtotal);

						req.session.cart_Total = current_Total;
						req.session.amount_Saved = 0;
						req.session.promo_Code = "";

						if (parseFloat(req.session.cart_Total) > 1000) {
							req.session.freeShipping = true;

						} else {
							req.session.freeShipping = false;
						}

						req.session.save();

						res.status(200).json({ "cart_Discount": 0, "cart_Total": req.session.cart_Total, "free_Shipping": req.session.freeShipping, "require_Login": false });
					}
				} else {
					req.session.discount = 0;

					var current_Total = parseFloat(req.session.subtotal);

					req.session.cart_Total = current_Total;
					req.session.amount_Saved = 0;
					req.session.promo_Code = "";

					if (parseFloat(req.session.cart_Total) > 1000) {
						req.session.freeShipping = true;

					} else {
						req.session.freeShipping = false;
					}

					req.session.save();

					res.status(200).json({ "cart_Discount": 0, "cart_Total": req.session.cart_Total, "free_Shipping": req.session.freeShipping, "require_Login": false });

				}
			}).catch(err => console.log(err));
	}

})

router.get('/checkOut', ensureAuthenticated, (req, res) => {

	console.log(req.session.items);
	//TODO DIRECT TO USER LOGIN IF NOT LOG IN
	req.session.returnTo == null;
	req.session.save();
	let items = req.session.items;

	var current_Total = parseFloat(req.session.subtotal);
	console.log(current_Total);

	var discount = parseFloat((parseFloat(req.session.discount) / 100) * current_Total);

	if (isNaN(discount)) {
		discount = 0.00;
		req.session.discount = 0.00;
	}

	console.log(discount);

	var cart_Total = Math.round(((current_Total - discount) + Number.EPSILON) * 100) / 100;

	req.session.cart_Total = cart_Total;
	req.session.amount_Saved = Math.round(((parseFloat(req.session.subtotal) - cart_Total) + Number.EPSILON) * 100) / 100;

	let subtotal = req.session.subtotal;


	sequelize.query("SELECT first_Name, last_Name, email, phone, address, apartment, city, country, post_Code FROM orders WHERE user_ID = :user_ID ORDER BY ID DESC LIMIT 1", {
		replacements: { user_ID: req.user.id },
		type: QueryTypes.SELECT
	}).then((result) => {
		if (result.length > 0) {

		}

		req.session.save();
		if (items == undefined || items.length < 1) {// if cart has nothing, redirect to cart page
			res.redirect('/shopping/viewCart');

		} else {
			req.session.returnTo = null;
			req.session.save();
			if (result.length > 0) {
				console.log(result[0]);
				res.render('shopping/checkOut', {
					items: items,
					subtotal: subtotal,
					discount_Code: req.session.promo_Code,
					discount: req.session.amount_Saved,
					query: result[0],
					shipping: Boolean(req.session.freeShipping)
				});
			} else {
				res.render('shopping/checkOut', {
					items: items,
					subtotal: subtotal,
					discount_Code: req.session.promo_Code,
					discount: req.session.amount_Saved,
					shipping: Boolean(req.session.freeShipping)
				});
			}

		}
	}).catch(err => console.log(err));



});

router.get("/publishable-key", (req, res) => {
	res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY })
});

router.post('/create-payment-intent', async (req, res) => {

	// calculate total from session variables

	var customer_Info = req.body.customer_Info.split("&");

	for (i = 0; i < customer_Info.length; i++) {
		customer_Info[i] = customer_Info[i].substring(customer_Info[i].indexOf('=') + 1);
	}

	if (customer_Info.length == 8) {// apartment / suite unfilled
		customer_Info.splice(5, 0, "");
	}

	var shipping_Price = req.body.shipping_Price;
	shipping_Price = parseFloat(shipping_Price.substring(shipping_Price.indexOf('=') + 1));

	if (Boolean(req.session.freeShipping)) {
		shipping_Price = 0.00
	}

	var discount_Amount = parseFloat(req.session.amount_Saved);

	if (isNaN(discount_Amount)) {
		discount_amount == 0.00;
	}
	var order_Subtotal = parseFloat(req.session.subtotal);
	var order_Total = order_Subtotal + shipping_Price - discount_Amount;

	// convert to 2 d.p
	order_Total = Math.round((order_Total + Number.EPSILON) * 100) / 100;
	order_Subtotal = Math.round((order_Subtotal + Number.EPSILON) * 100) / 100;
	discount_Amount = Math.round((discount_Amount + Number.EPSILON) * 100) / 100;
	shipping_Price = Math.round((shipping_Price + Number.EPSILON) * 100) / 100;

	order_Total = parseInt(order_Total * 100);

	var customer;
	var query;
	await sequelize.query("SELECT sid FROM users WHERE id = :user_ID", {
		replacements: { user_ID: req.user.id },
		type: QueryTypes.SELECT
	}).then((result) => {
		query = result;
	}).catch(err => console.log(err));

	if (query[0]["sid"] == null) {
		console.log("IN HEREEEEEE!!!!!!!");
		customer = await stripe.customers.create();

		console.log(customer);
		console.log("––––––––––––––––––––––––");
		console.log(req.session.passport['user']);

		sequelize.query("UPDATE users SET sid = :sid WHERE id = :user_ID", {
			replacements: { sid: customer.id, user_ID: req.user.id },
			type: QueryTypes.UPDATE
		}).catch(err => console.log(err));

	} else {
		console.log("IN THE ELSE AREA");
		customer = await stripe.customers.retrieve(query[0].sid);
		console.log("CUSTOMER OBJECT");

		console.log(customer);
	}

	console.log(customer_Info[2].replaceAll('%40', '@'));

	// Create a PaymentIntent with the order amount and currency
	const paymentIntent = await stripe.paymentIntents.create({
		//customer: customer.id,
		amount: order_Total,
		currency: "sgd",
		automatic_payment_methods: {
			enabled: true,
		},

		payment_method_options: {
			card: {
				setup_future_usage: 'on_session',
			},
		},

		shipping: {
			name: customer_Info[0].replaceAll('%20', ' ') + " " + customer_Info[1].replaceAll('%20', ' '),
			phone: customer_Info[3],
			address: {
				city: customer_Info[6].replaceAll('%20', ' '),
				country: customer_Info[7],
				line1: customer_Info[4].replaceAll('%20', ' '),
				line2: customer_Info[5].replaceAll('%20', ' '),
				postal_code: customer_Info[8],
			},
		},
		metadata: { discount_Amount: discount_Amount, order_Subtotal: order_Subtotal, order_Total: order_Total, discount_Code: req.session.promo_Code },
		receipt_email: customer_Info[2].replaceAll('%40', '@'),

	});

	res.send({
		clientSecret: paymentIntent.client_secret,
	});

	console.log(req.session.items);


});

function createInvoice(customerID, customerInfo_Data, orderInfo_Data) {
	return new Promise((resolve, reject) => {

		//let companyLogo = "./images/companyLogo.png";
		let fileName = './public/invoices/' + customerID + "_" + orderInfo_Data["invoiceNo"] + ".pdf";
		let fontNormal = 'Helvetica';
		let fontBold = 'Helvetica-Bold';

		let sellerInfo = {
			"companyName": "Chun Mee Lee Rattan Furniture",
			"address": "122 Bukit Merah Lane 1, #01-68",
			"city": "Singapore",
			"pincode": "150122",
			"country": "Singapore",
			"contactNo": "+65 6278 2388"
		}

		let customerInfo = customerInfo_Data;

		let orderInfo = orderInfo_Data;

		function createPdf() {
			return new Promise((resolve, reject) => {
				try {

					let pdfDoc = new pdfKit();

					let stream = fs.createWriteStream(fileName);

					pdfDoc.pipe(stream);

					//pdfDoc.image(companyLogo, 25, 20, { width: 50, height: 50 });
					pdfDoc.font(fontBold).text('Chun Mee Lee Rattan Furniture', 7, 50);
					pdfDoc.font(fontNormal).fontSize(14).text('Order Invoice/Bill Receipt', 400, 30, { width: 200 });
					pdfDoc.fontSize(10).text(new Date().toLocaleString('en-GB', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', timeZone: 'UTC' }) + " UTC +0", 400, 46, { width: 200 });

					pdfDoc.font(fontBold).text("Sold by:", 7, 75);
					pdfDoc.font(fontNormal).text(sellerInfo.companyName, 7, 100, { width: 250 });
					pdfDoc.text(sellerInfo.address, 7, 115, { width: 250 });
					pdfDoc.text(sellerInfo.city, 7, 130, { width: 250 });
					pdfDoc.text(sellerInfo.pincode, 7, 145, { width: 250 });
					pdfDoc.text(sellerInfo.country, 7, 160, { width: 250 });

					pdfDoc.font(fontBold).text("Customer details:", 400, 75);
					pdfDoc.font(fontNormal).text(customerInfo.customerName, 400, 100, { width: 250 });
					pdfDoc.text(customerInfo.address + " , " + customerInfo.apartment, 400, 115, { width: 250 });
					pdfDoc.text(customerInfo.city, 400, 130, { width: 250 });
					pdfDoc.text(customerInfo.pincode, 400, 145, { width: 250 });
					pdfDoc.text(customerInfo.country, 400, 160, { width: 250 });

					pdfDoc.text("Order No: " + orderInfo.orderNo, 7, 195, { width: 250 });
					pdfDoc.text("Invoice No: " + orderInfo.invoiceNo, 7, 210, { width: 250 });
					pdfDoc.text("Date: " + orderInfo.invoiceTimeStamp + " UTC +0", 7, 225, { width: 250 });

					pdfDoc.rect(7, 250, 560, 20).fill("#fcba03").stroke("#fcba03");
					pdfDoc.fillColor("#fff").text("Item No.", 20, 256, { width: 90 });
					pdfDoc.text("Product", 110, 256, { width: 190 });
					pdfDoc.text("Qty", 300, 256, { width: 100 });
					pdfDoc.text("Price", 400, 256, { width: 100 });
					pdfDoc.text("Total Price", 500, 256, { width: 100 });

					let productNo = 1;
					console.log("PDF products");
					console.log(orderInfo.products);

					orderInfo.products.forEach(element => {
						console.log("adding", element.name);
						let y = 256 + (productNo * 20);
						pdfDoc.fillColor("#000").text(element.id, 20, y, { width: 90 });
						pdfDoc.text(element.name, 110, y, { width: 190 });
						pdfDoc.text(element.qty, 300, y, { width: 100 });
						pdfDoc.text(element.unitPrice, 400, y, { width: 100 });
						pdfDoc.text(element.totalPrice, 500, y, { width: 100 });
						productNo++;
					});

					pdfDoc.rect(7, 256 + (productNo * 20), 560, 0.2).fillColor("#000").stroke("#000");
					productNo++;

					pdfDoc.font(fontBold).text("All prices are reflected in Singapore dollars ($SGD)", 20, 256 + (productNo * 17));

					pdfDoc.font(fontBold).text("Subtotal:", 400, 256 + (productNo * 17));
					pdfDoc.font(fontBold).text(orderInfo.subValue, 500, 256 + (productNo * 17));

					pdfDoc.font(fontBold).text("Discount:", 400, 256 + 15 + (productNo * 17));
					pdfDoc.font(fontBold).text(orderInfo.discountValue, 500, 256 + 15 + (productNo * 17));

					pdfDoc.font(fontBold).text("Shipping:", 400, 256 + 30 + (productNo * 17));
					pdfDoc.font(fontBold).text(orderInfo.shippingValue, 500, 256 + 30 + (productNo * 17));

					pdfDoc.font(fontBold).text("Total:", 400, 256 + 45 + (productNo * 17));
					pdfDoc.font(fontBold).text(orderInfo.totalValue, 500, 256 + 45 + (productNo * 17));

					pdfDoc.font(fontBold).text("Payment method: " + orderInfo.method, 400, 256 + 70 + (productNo * 17));

					pdfDoc.end();

					stream.on('finish', function () {
						resolve(true)
					});

					//console.log("pdf generated successfully");

				} catch (error) {
					console.log("Error occurred", error);
				}
			});

		}

		createPdf()
			.then((result) => {
				setTimeout(() => {
					if (result) {
						resolve(fileName)
					} else {
						reject("ERROR IN CREATING FILE");
					}
				}, 10000)
			}).catch((err) => {
				console.error(err);
			});

	});
	/*
	createPdf().then((result) => {
		console.log(fileName);
		return fileName;
		
	}).catch((err) => {
		console.error(err);
	});
	*/

}

function sendReceiptEmail(email, receipt_Date, name, order_Number, items, attachment) {
	// Use environment variable for sender email
	sgMail.setApiKey(process.env.SENDGRID_API_KEY);

	const message = {
		from: process.env.SENDGRID_FROM_EMAIL,
		template_id: process.env.SENDGRID_TEMPLATE_ID,

		personalizations: [{
			"to": [
				{
					email
				}
			],
			"dynamic_template_data": {
				"receipt_Date": receipt_Date,
				"name": name,
				"email": email,
				"order_Number": order_Number,
				"items": items
			}
		}],

		subject: 'Thank You for shopping with us!',
		attachments: [
			{
				content: attachment,
				filename: "Order Invoice",
				type: "application/pdf",
				disposition: "attachment"
			}
		]

	};

	return new Promise((resolve, reject) => {
		sgMail.send(message)
			.then(msg => {
				console.log(msg[0].statusCode);
				console.log(msg[0].headers);
				resolve(msg);
			})
			.catch(err => {
				console.error(err);
				reject(err);
			});
	});
}

router.get('/paymentConfirmed-Stripe', async (req, res) => {

	var query = req.query;

	const paymentIntent = await stripe.paymentIntents.retrieve(
		query.payment_intent
	);

	var order_ID = uuidv4(); // generate UUID for order
	var user_ID = req.user.id; // retrieve user_ID

	var currentCart = req.session.currentCart;
	var shipping_Price;

	shipping_Price = parseFloat(currentCart[1]);

	var discount_Amount = parseFloat(req.session.amount_Saved);
	var order_Subtotal = parseFloat(req.session.subtotal);
	var order_Total = order_Subtotal + shipping_Price - discount_Amount;

	// convert to 2 d.p
	order_Total = Math.round((order_Total + Number.EPSILON) * 100) / 100;
	order_Subtotal = Math.round((order_Subtotal + Number.EPSILON) * 100) / 100;
	discount_Amount = Math.round((discount_Amount + Number.EPSILON) * 100) / 100;
	shipping_Price = Math.round((shipping_Price + Number.EPSILON) * 100) / 100;

	var customer_Info = currentCart[0];
	var shipping_Type = currentCart[2];

	for (i = 0; i < customer_Info.length; i++) {
		customer_Info[i] = customer_Info[i].substring(customer_Info[i].indexOf('=') + 1);
	}

	if (customer_Info.length == 8) {// apartment / suite unfilled
		customer_Info.splice(5, 0, "");
	}

	var order_ID = uuidv4(); // generate UUID for order
	var user_ID = req.session.passport['user']; // retrieve user_ID

	const paymentMethod = await stripe.paymentMethods.retrieve(
		paymentIntent.payment_method
	);

	console.log(paymentMethod);

	var payment_Method_Stripe;
	var card_Num;

	switch (paymentMethod.type) {
		case "card":
			payment_Method_Stripe = "Debit / Credit Card";
			card_Num = paymentMethod.card.last4;
			break;
		case "grabpay":
			payment_Method_Stripe = "GrabPay";
			card_Num = '';
			break;
		default:
			payment_Method_Stripe = "Other payment method";
			card_Num = '';
	}



	Order.create({
		order_ID: order_ID,
		user_ID: user_ID,
		order_Subtotal: order_Subtotal,
		discount_Amount: discount_Amount,
		shipping_Amount: shipping_Price,
		shipping_Type: shipping_Type,
		order_Total: order_Total,
		first_Name: customer_Info[0].replaceAll('%20', ' '),
		last_Name: customer_Info[1].replaceAll('%20', ' '),
		email: customer_Info[2].replaceAll('%40', '@'),
		phone: customer_Info[3],
		address: customer_Info[4].replaceAll('%20', ' '),
		apartment: customer_Info[5].replaceAll('%20', ' '),
		city: customer_Info[6].replaceAll('%20', ' '),
		country: customer_Info[7].replaceAll('%20', ' '),
		post_Code: customer_Info[8],
		card_Number: card_Num,
		payment_Type: payment_Method_Stripe,
		discount_Code: req.session.promo_Code,
		timestamp: new Date().toLocaleString('en-GB', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', timeZone: 'UTC' }),
		paymentMethod_ID: paymentIntent.id,

	}).then(() => {
		var items = req.session.items
		console.log(items);
		for (i = 0; i < items.length; i++) {
			Order_Item.create({
				product_Name: req.session.items[i]["name"],
				product_Description: req.session.items[i]["description"],
				price: req.session.items[i]["price"],
				dimensions: req.session.items[i]["dimensions"],
				quantity: parseInt(req.session.items[i]["quantity"]),
				image: req.session.items[i]["image"],
				order_ID: order_ID,
				status: "Order Processing"
			});
		}

		sequelize.query("DELETE FROM cart_items WHERE cart_ID = :cart_ID", {
			replacements: { cart_ID: req.sessionID },
			type: QueryTypes.DELETE
		}).catch(err => console.log(err));

		req.session.items = [];
		req.session.subtotal = 0;
		req.session.amount_Saved = 0;
		req.session.promo_Code = "";
		req.session.cart_Total = 0;
		req.session.discount = 0;
		req.session.currentCart = [];
		req.session.save();

		sequelize.query("SELECT * FROM orders WHERE paymentMethod_ID = :paymentMethod_ID", {
			replacements: { paymentMethod_ID: paymentIntent.id },
			type: QueryTypes.SELECT
		}).then((order_Retrieved) => {
			console.log("Retrieved order from paymentMethod");
			console.log(order_Retrieved);
			var queryString = querystring.stringify({
				"order_number": order_Retrieved[0]['id'],
				"valid": "true",
			});

			customerInfo_Data = {};
			customerInfo_Data["customerName"] = order_Retrieved[0]['first_Name'] + " " + order_Retrieved[0]['last_Name'];
			customerInfo_Data["address"] = order_Retrieved[0]['address'];
			customerInfo_Data["apartment"] = order_Retrieved[0]['apartment'];
			customerInfo_Data["city"] = order_Retrieved[0]['city'];
			customerInfo_Data["pincode"] = order_Retrieved[0]['post_Code'];
			customerInfo_Data["country"] = order_Retrieved[0]['country'];
			customerInfo_Data["contactNo"] = order_Retrieved[0]['phone'];

			orderInfo_Data = {};
			orderInfo_Data["orderNo"] = order_Retrieved[0]['id'];
			orderInfo_Data["invoiceNo"] = order_Retrieved[0]['order_ID'];
			orderInfo_Data["invoiceTimeStamp"] = order_Retrieved[0]['timestamp'];
			orderInfo_Data["products"] = [];

			orderInfo_Data["totalValue"] = order_Retrieved[0]['order_Total'];
			orderInfo_Data["subValue"] = order_Retrieved[0]['order_Subtotal'];
			orderInfo_Data["discountValue"] = order_Retrieved[0]['discount_Amount'];
			orderInfo_Data["shippingValue"] = order_Retrieved[0]['shipping_Amount'];
			orderInfo_Data["method"] = order_Retrieved[0]['payment_Type'];

			console.log("Items in order");
			console.log(items);
			for (i = 0; i < items.length; i++) {
				var temp_Dict = {};
				temp_Dict["id"] = i + 1;
				temp_Dict["name"] = items[i]['name'];
				temp_Dict["unitPrice"] = items[i]['price'];
				temp_Dict["totalPrice"] = (parseFloat(items[i]['price']) * parseFloat(items[i]['quantity']));
				temp_Dict["qty"] = items[i]['quantity'];
				console.log("In Loop");
				console.log(temp_Dict);
				orderInfo_Data.products.push(temp_Dict);
			}

			console.log("Products array");
			console.log(orderInfo_Data["products"]);

			res.redirect("/shopping/paymentSuccess/?" + queryString);

			createInvoice(user_ID, customerInfo_Data, orderInfo_Data)
				.then((invoice_Path) => {
					invoice_Path = invoice_Path.substring(1);
					console.log(invoice_Path);
					email_Items = [];
					for (i = 0; i < items.length; i++) {
						var temp_Dict = {};

						temp_Dict["item_Name"] = items[i]['name'];
						temp_Dict["item_Quantity"] = items[i]['quantity'];
						temp_Dict["price"] = (parseFloat(items[i]['price']) * parseFloat(items[i]['quantity']));

						console.log(temp_Dict);
						email_Items.push(temp_Dict);
					}

					new_Path = (path.resolve(__dirname, '../') + invoice_Path).toString();
					console.log(new_Path);

					var attachment = fs.readFileSync(new_Path).toString("base64");

					sendReceiptEmail(order_Retrieved[0]["email"], order_Retrieved[0]['timestamp'], order_Retrieved[0]['first_Name'] + " " + order_Retrieved[0]['last_Name'], order_Retrieved[0]['id'], email_Items, attachment)
						.then(msg => {

						}).catch(err => {
							console.log(err.response.body.errors);
							console.log("ERROR SENDING RECEIPT EMAIL")
						});


					console.log(order_Retrieved[0]['discount_Code']);
					if (order_Retrieved[0]['discount_Code'].trim() != null || order_Retrieved[0]['discount_Code'].trim() != '') {
						sequelize.query("SELECT * FROM promos WHERE code = :code", {
							replacements: { code: order_Retrieved[0]['discount_Code'] },
							type: QueryTypes.SELECT
						}).then((promo_Retrieved) => {
							console.log(promo_Retrieved);
							if (promo_Retrieved.length > 0) {
								if (promo_Retrieved[0]['target'] != 'All') {
									if (promo_Retrieved[0]['target'] != 'New') {
										sequelize.query("DELETE FROM promos WHERE code = :code ", {
											replacements: { code: promo_Retrieved[0]['code'] },
											type: QueryTypes.DELETE
										}).then(() => {
											console.log("DELETED SUCCESSFULLY");
										}).catch(err => console.log(err));
									}
								}
							}
						}).catch((err) => {
							console.error(err);
						});

					}

				}).catch((err) => {
					console.error(err);
				});



		}).catch(err => console.log(err));

	}).catch(err => console.log(err));
});


router.post('/saveProgress', (req, res) => {
	var customer_Info;
	var shipping_Price;
	var shipping_Type;

	customer_Info = req.body.customer_Info.split("&");
	shipping_Price = req.body.shipping_Price;
	shipping_Price = parseFloat(shipping_Price.substring(shipping_Price.indexOf('=') + 1));
	shipping_Type = req.body.shipping_Type;

	if (Boolean(req.session.freeShipping)) {
		shipping_Price = 0.00;
	}

	req.session.currentCart = [customer_Info, shipping_Price, shipping_Type];
	req.session.save();

	console.log("PROGRESS SAVED");
	res.status(200).json({ "response": "success" });
})

router.post('/paymentPaypal', (req, res) => {

	var currentCart = req.session.currentCart;

	var shipping_Price;

	shipping_Price = parseFloat(currentCart[1]);

	if (Boolean(req.session.freeShipping)) {
		shipping_Price = 0;
	}

	var discount_Amount = parseFloat(req.session.amount_Saved);

	if (isNaN(discount_Amount)) {
		discount_amount == 0.00;
	}

	var order_Subtotal = parseFloat(req.session.subtotal);
	var order_Total = order_Subtotal + shipping_Price - discount_Amount;

	// convert to 2 d.p
	order_Total = Math.round((order_Total + Number.EPSILON) * 100) / 100;
	order_Subtotal = Math.round((order_Subtotal + Number.EPSILON) * 100) / 100;
	discount_Amount = Math.round((discount_Amount + Number.EPSILON) * 100) / 100;
	shipping_Price = Math.round((shipping_Price + Number.EPSILON) * 100) / 100;


	let sess_Items = req.session.items;

	let new_List = []

	for (i = 0; i < sess_Items.length; i++) {
		new_List.push({
			'name': sess_Items[i]['name'], 'quantity': sess_Items[i]['quantity'], 'price': sess_Items[i]['price'],
			'description': sess_Items[i]['description'], 'currency': 'SGD'
		});

	}

	new_List.push({ 'name': 'discount', 'quantity': '1', 'price': "-" + discount_Amount, 'currency': 'SGD' });
	new_List.push({ "name": "shipping", 'quantity': 1, "price": String(shipping_Price), "currency": "SGD" });

	console.log(new_List);



	const create_payment_json = {
		"intent": "sale",
		"payer": {
			"payment_method": "paypal"
		},
		"redirect_urls": {
			"return_url": "http://localhost:50000/shopping/paymentConfirmed-Paypal",
			"cancel_url": "http://localhost:50000/shopping/paymentCancelled-Paypal"
		},
		"transactions": [{
			"item_list": {
				"items": new_List
			},
			"amount": {
				"currency": "SGD",
				"total": String(order_Total),
			},

		}]
	};

	paypal.payment.create(create_payment_json, function (error, payment) {
		if (error) {
			throw error;
		} else {
			for (let i = 0; i < payment.links.length; i++) {
				if (payment.links[i].rel === 'approval_url') {
					res.redirect(payment.links[i].href);
				}
			}
		}
	});

});


router.get('/paymentConfirmed-Paypal', (req, res) => {
	const payerId = req.query.PayerID;
	const paymentId = req.query.paymentId;

	var currentCart = req.session.currentCart;

	var shipping_Price;

	shipping_Price = parseFloat(currentCart[1]);

	var discount_Amount = parseFloat(req.session.amount_Saved);
	var order_Subtotal = parseFloat(req.session.subtotal);
	var order_Total = order_Subtotal + shipping_Price - discount_Amount;

	// convert to 2 d.p
	order_Total = Math.round((order_Total + Number.EPSILON) * 100) / 100;
	order_Subtotal = Math.round((order_Subtotal + Number.EPSILON) * 100) / 100;
	discount_Amount = Math.round((discount_Amount + Number.EPSILON) * 100) / 100;
	shipping_Price = Math.round((shipping_Price + Number.EPSILON) * 100) / 100;

	const execute_payment_json = {
		"payer_id": payerId,
		"transactions": [{
			"amount": {
				"currency": "SGD",
				"total": String(order_Total)
			}
		}]
	};

	// Obtains the transaction details from paypal
	paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
		//When error occurs when due to non-existent transaction, throw an error else log the transaction details in the console then send a Success string reposponse to the user.
		if (error) {
			console.log(error.response);
			throw error;
		} else {

			console.log(JSON.stringify(payment));

			var customer_Info = currentCart[0];
			var shipping_Type = currentCart[2];

			for (i = 0; i < customer_Info.length; i++) {
				customer_Info[i] = customer_Info[i].substring(customer_Info[i].indexOf('=') + 1);
			}

			if (customer_Info.length == 8) {// apartment / suite unfilled
				customer_Info.splice(5, 0, "");
			}

			var email = customer_Info[2].replace('%40', '@');

			var order_ID = uuidv4(); // generate UUID for order
			var user_ID = req.session.passport['user']; // retrieve user_ID



			Order.create({
				order_ID: order_ID,
				user_ID: user_ID,
				order_Subtotal: order_Subtotal,
				discount_Amount: discount_Amount,
				shipping_Amount: shipping_Price,
				shipping_Type: shipping_Type,
				order_Total: order_Total,
				first_Name: customer_Info[0].replaceAll('%20', ' '),
				last_Name: customer_Info[1].replaceAll('%20', ' '),
				email: customer_Info[2].replaceAll('%40', '@'),
				phone: customer_Info[3],
				address: customer_Info[4].replaceAll('%20', ' '),
				apartment: customer_Info[5].replaceAll('%20', ' '),
				city: customer_Info[6].replaceAll('%20', ' '),
				country: customer_Info[7].replaceAll('%20', ' '),
				post_Code: customer_Info[8],
				payment_Type: "PayPal",
				discount_Code: req.session.promo_Code,
				timestamp: new Date().toLocaleString('en-GB', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', timeZone: 'UTC' }),
				paymentMethod_ID: payment['id'],

			}).then(() => {
				var items = req.session.items
				for (i = 0; i < items.length; i++) {
					Order_Item.create({
						product_Name: req.session.items[i]["name"],
						product_Description: req.session.items[i]["description"],
						price: req.session.items[i]["price"],
						dimensions: req.session.items[i]["dimensions"],
						quantity: parseInt(req.session.items[i]["quantity"]),
						image: req.session.items[i]["image"],
						order_ID: order_ID,
						status: "Order Processing"
					});
				}

				sequelize.query("DELETE FROM cart_items WHERE cart_ID = :cart_ID", {
					replacements: { cart_ID: req.sessionID },
					type: QueryTypes.DELETE
				}).catch(err => console.log(err));

				req.session.items = [];
				req.session.subtotal = 0;
				req.session.amount_Saved = 0;
				req.session.promo_Code = "";
				req.session.cart_Total = 0;
				req.session.discount = 0;
				req.session.currentCart = [];
				req.session.save();

				sequelize.query("SELECT * FROM orders WHERE paymentMethod_ID = :paymentMethod_ID", {
					replacements: { paymentMethod_ID: payment['id'] },
					type: QueryTypes.SELECT
				}).then((order_Retrieved) => {
					console.log("Retrieved order from paymentMethod");
					console.log(order_Retrieved);
					var queryString = querystring.stringify({
						"order_number": order_Retrieved[0]['id'],
						"valid": "true",
					});

					customerInfo_Data = {};
					customerInfo_Data["customerName"] = order_Retrieved[0]['first_Name'] + " " + order_Retrieved[0]['last_Name'];
					customerInfo_Data["address"] = order_Retrieved[0]['address'];
					customerInfo_Data["apartment"] = order_Retrieved[0]['apartment'];
					customerInfo_Data["city"] = order_Retrieved[0]['city'];
					customerInfo_Data["pincode"] = order_Retrieved[0]['post_Code'];
					customerInfo_Data["country"] = order_Retrieved[0]['country'];
					customerInfo_Data["contactNo"] = order_Retrieved[0]['phone'];

					orderInfo_Data = {};
					orderInfo_Data["orderNo"] = order_Retrieved[0]['id'];
					orderInfo_Data["invoiceNo"] = order_Retrieved[0]['order_ID'];
					orderInfo_Data["invoiceTimeStamp"] = order_Retrieved[0]['timestamp'];
					orderInfo_Data["products"] = [];

					orderInfo_Data["totalValue"] = order_Retrieved[0]['order_Total'];
					orderInfo_Data["subValue"] = order_Retrieved[0]['order_Subtotal'];
					orderInfo_Data["discountValue"] = order_Retrieved[0]['discount_Amount'];
					orderInfo_Data["shippingValue"] = order_Retrieved[0]['shipping_Amount'];
					orderInfo_Data["method"] = order_Retrieved[0]['payment_Type'];

					console.log("Items in order");
					console.log(items);
					for (i = 0; i < items.length; i++) {
						var temp_Dict = {};
						temp_Dict["id"] = i + 1;
						temp_Dict["name"] = items[i]['name'];
						temp_Dict["unitPrice"] = items[i]['price'];
						temp_Dict["totalPrice"] = (parseFloat(items[i]['price']) * parseFloat(items[i]['quantity']));
						temp_Dict["qty"] = items[i]['quantity'];
						console.log("In Loop");
						console.log(temp_Dict);
						orderInfo_Data.products.push(temp_Dict);
					}

					console.log("Products array");
					console.log(orderInfo_Data["products"]);

					res.redirect("/shopping/paymentSuccess/?" + queryString);

					createInvoice(user_ID, customerInfo_Data, orderInfo_Data)
						.then((invoice_Path) => {
							invoice_Path = invoice_Path.substring(1);
							console.log(invoice_Path);
							email_Items = [];
							for (i = 0; i < items.length; i++) {
								var temp_Dict = {};

								temp_Dict["item_Name"] = items[i]['name'];
								temp_Dict["item_Quantity"] = items[i]['quantity'];
								temp_Dict["price"] = (parseFloat(items[i]['price']) * parseFloat(items[i]['quantity']));

								console.log(temp_Dict);
								email_Items.push(temp_Dict);
							}

							new_Path = (path.resolve(__dirname, '../') + invoice_Path).toString();
							console.log(new_Path);

							var attachment = fs.readFileSync(new_Path).toString("base64");

							sendReceiptEmail(order_Retrieved[0]["email"], order_Retrieved[0]['timestamp'], order_Retrieved[0]['first_Name'] + " " + order_Retrieved[0]['last_Name'], order_Retrieved[0]['id'], email_Items, attachment)
								.then(msg => {

								}).catch(err => {
									console.log(err.response.body.errors);
									console.log("ERROR SENDING RECEIPT EMAIL")
								});


							console.log(order_Retrieved[0]['discount_Code']);
							if (order_Retrieved[0]['discount_Code'].trim() != null || order_Retrieved[0]['discount_Code'].trim() != '') {
								sequelize.query("SELECT * FROM promos WHERE code = :code", {
									replacements: { code: order_Retrieved[0]['discount_Code'] },
									type: QueryTypes.SELECT
								}).then((promo_Retrieved) => {
									console.log(promo_Retrieved);
									if (promo_Retrieved.length > 0) {
										if (promo_Retrieved[0]['target'] != 'All') {
											if (promo_Retrieved[0]['target'] != 'New') {
												sequelize.query("DELETE FROM promos WHERE code = :code ", {
													replacements: { code: promo_Retrieved[0]['code'] },
													type: QueryTypes.DELETE
												}).then(() => {
													console.log("DELETED SUCCESSFULLY");
												}).catch(err => console.log(err));
											}
										}
									}
								}).catch((err) => {
									console.error(err);
								});

							}

						}).catch((err) => {
							console.error(err);
						});

					






				}).catch(err => console.log(err));

			}).catch(err => console.log(err));
		}
	});

});

router.get('/paymentCancelled-Paypal', (req, res) => {
	alertMessage(res, 'danger', 'Check Out aborted!', 'fas fa-exclamation-circle', true);
	res.redirect('/shopping/viewCart');
});


router.get('/paymentSuccess', (req, res) => {
	var query = req.query;

	res.render('shopping/paymentSuccess', {
		order_number: query.order_number
	});

});


module.exports = router;