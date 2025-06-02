const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const alertMessage = require('../helpers/messenger');
const ensureAuthenticated = require('../helpers/auth');
const fs = require('fs');
// SendGrid
const sgMail = require('@sendgrid/mail');
// JWT
const jwt = require('jsonwebtoken');

// View Supplier
router.get('/viewSupplier', ensureAuthenticated, (req, res) => {
	Supplier.findAll({
        order: [
            ['supname', 'ASC']
        ],
        raw: true
    })
    .then((suppliers) => {
        // pass object to listVideos.handlebar
        res.render('supplier/viewSupplier', {
            suppliers: suppliers
        });
    })
    .catch(err => console.log(err));
});

router.post('/viewSupplier', ensureAuthenticated, (req, res) => {
    let search = req.body.searchinput;
    let searchcategory = req.body.SearchCategory;
    let resultlist = [];
    if (searchcategory == "Company"){
        Supplier.findAll({where: {supname: search}})
        .then((Supname) => {
            Supname.forEach(element => {
                if (element.supemail in resultlist){
                    
                }
                else{
                    resultlist.push(element)
                }
            });
        })
    }
    if (searchcategory == "Contact Name"){
        Supplier.findAll({where: {supcontactname: search}})
        .then((Supcontactname) => {
            Supcontactname.forEach(element => {
                if (element.supemail in resultlist){
                    
                }
                else{
                    resultlist.push(element)
                }
            });
        })
    }
    if (searchcategory == "Email"){
        Supplier.findAll({where: {supemail: search}})
        .then((Supemail) => {
            Supemail.forEach(element => {
                if (element.supemail in resultlist){
                    
                }
                else{
                    resultlist.push(element)
                }
            });
        })
    }
    if (searchcategory == "Phone"){
        Supplier.findAll({where: {supcontactno: search}})
        .then((Supcontactno) => {
            Supcontactno.forEach(element => {
                if (element.supemail in resultlist){
                    
                }
                else{
                    resultlist.push(element)
                }
            });
        })
    }
    if (searchcategory == "Country"){
        Supplier.findAll({where: {suplocation: search}})
        .then((Suplocation) => {
            Suplocation.forEach(element => {
                if (element.supemail in resultlist){
                    
                }
                else{
                    resultlist.push(element)
                }
            });
        })
    }
    if (searchcategory == "Address"){
        Supplier.findAll({where: {supaddress: search}})
        .then((Supaddress) => {
            Supaddress.forEach(element => {
                if (element.supemail in resultlist){
                    
                }
                else{
                    resultlist.push(element)
                }
            });
        })
    }
    if (searchcategory == "Zipcode"){
        Supplier.findAll({where: {suppostalcode: search}})
        .then((Suppostalcode) => {
            Suppostalcode.forEach(element => {
                if (element.supemail in resultlist){
                    
                }
                else{
                    resultlist.push(element)
                }
            });
        })
    }
    res.render('supplier/viewSupplier', {
            suppliers: resultlist
    });
});

router.post('/addSupplier', ensureAuthenticated, (req, res) => {
    //insert codes here

    let errors = [];

    // Retrieves fields from register page from request body
    let supplierImg = req.files.SupplierImg;
    let image = "";
    let { supname, supcontactname, supemail, supcontactno, suplocation, supaddress, suppostalcode} = req.body
    
    if (supname.length < 2) {
        errors.push({text: ' Supplier name must be at least 2 characters'});
    }

    if (supcontactname.length < 2) {
        errors.push({text: ' Contact name must be at least 2 characters'});
    }

    if (supemail.length < 2) {
        errors.push({text: ' Supplier email must be at least 2 characters'});
    }

    if (supaddress.length < 2) {
        errors.push({text: ' Address must be at least 2 characters'});
    }

    if (suplocation == "Singapore") {  
        if (supcontactno.length < 2) {
            errors.push({text: ' Contact Number must be at least 2 characters'});
        }
    
        if (suppostalcode.length < 6) {
            errors.push({text: ' Postal Code must be at least 6 characters'});
        }
    }

    else if (suplocation == "Malaysia") {
        if (supcontactno.length < 13) {
            errors.push({text: ' Contact Number must be at least 13 characters'});
        }
    
        if (suppostalcode.length < 5) {
            errors.push({text: ' Postal Code must be at least 5 characters'});
        }
    }

    else if (suplocation == "United States") {
        if (supcontactno.length < 12) {
            errors.push({text: ' Contact Number must be at least 12 characters'});
        }
    
        if (suppostalcode.length < 5) {
            errors.push({text: ' Postal Code must be at least 5 characters'});
        }
    }
    
    else{
            errors.push({text: ' Country Error'});
    }

    if (errors.length > 0) {
        res.render('supplier/addSupplier', {
            errors: errors,
            supname,
            supcontactname,
            supemail,
            supcontactno,
            suplocation,
            supaddress,
            suppostalcode,
            supplierImg
        });
    } else {
        // If all is well, checks if user is already registered
        Supplier.findOne({ where: {supemail: req.body.supemail} })
        .then(supplier => {
            if (supplier) {
            // If user is found, that means email has already been
            // registered
                res.render('supplier/addSupplier', {
                    error: supplier.supemail + ' already registered',
                    supname,
                    supcontactname,
                    supemail,
                    supcontactno,
                    suplocation,
                    supaddress,
                    suppostalcode,
                    supplierImg
                });
            } else {

                if (req.files && req.files.SupplierImg) {
                    let dir = './public/uploads/inventory/';
                    if (!fs.existsSync(dir)) {
                     fs.mkdirSync(dir, { recursive: true });
                    }
            
                    let supplierImage = req.files.SupplierImg;
                    let nowDate = Date.now();
                    let iconUrl = dir + nowDate / 1000 + "" + supplierImage.name;

                    
                    //create img in the uploads foldder
                    supplierImage.mv(iconUrl, async function (err) {
                        if (err)
                            console.log(err);
                    });
            
                    imagePath = iconUrl.substring(9);
                    image = imagePath;
                }
                else{
                    let dir = './public/uploads/inventory/';
                    let nowDate = Date.now();
                    let iconUrl = dir + nowDate / 1000 + "" + supplierImg.name;
                    imagePath = iconUrl.substring(9);
                    image = imagePath;
                }

                // Create new user record
                Supplier.create({ supname, supcontactname, supemail, supcontactno, suplocation, supaddress, suppostalcode, image})
                .then(supplier => {
                    alertMessage(res, 'success', supplier.supname + ' added.', 'fas fa-user-plus', true);
                    res.redirect('/supplier/viewSupplier');
                })
                .catch(err => console.log(err));
            }
        });
    }
});

// List videos belonging to current logged in user
router.get('/editSupplier', ensureAuthenticated, (req, res) => {
    Supplier.findAll()
    .then((suppliers) => {
    // pass object to listVideos.handlebar
    res.render('supplier/editSupplier', {
        suppliers: suppliers
    });
    })
    .catch(err => console.log(err));
});

// Shows edit video page
router.get('/editSupplier/:id', ensureAuthenticated, (req, res) => {
    Supplier.findOne({where: {id: req.params.id}})
        .then((supplier) => {
            //checkOptions(supplier);
            // call views/video/editVideo.handlebar to render the edit video page
            res.render('supplier/editingSupplier', {
                supplier // passes video object to handlebar
            });
        }).catch(err => console.log(err)); // To catch no video ID
});

// Save edited
router.put('/editedSupplier/:id', ensureAuthenticated, (req, res) => {
    let errors = [];
    let supname = req.body.supname;
    let supcontactname = req.body.supcontactname;
    let supemail = req.body.supemail;
    let supcontactno = req.body.supcontactno;
    let suplocation = req.body.suplocation;
    let supaddress = req.body.supaddress;
    let suppostalcode = req.body.suppostalcode;
    let supplierImg = req.files.SupplierImg;
    let image = "";

    if (suplocation == "Singapore") {  
        if (supcontactno.length < 2) {
            errors.push({text: ' Contact Number must be at least 2 characters'});
        }
    
        if (suppostalcode.length < 6) {
            errors.push({text: ' Postal Code must be at least 6 characters'});
        }
    }

    else if (suplocation == "Malaysia") {
        if (supcontactno.length < 13) {
            errors.push({text: ' Contact Number must be at least 13 characters'});
        }
    
        if (suppostalcode.length < 5) {
            errors.push({text: ' Postal Code must be at least 5 characters'});
        }
    }

    else if (suplocation == "United States") {
        if (supcontactno.length < 12) {
            errors.push({text: ' Contact Number must be at least 12 characters'});
        }
    
        if (suppostalcode.length < 5) {
            errors.push({text: ' Postal Code must be at least 5 characters'});
        }
    }
    else{
        errors.push({text: ' Country Error'});
    }

    if (errors.length > 0) {
        res.render('supplier/editingSupplier', {
            errors: errors,
            supname,
            supcontactname,
            supemail,
            supcontactno,
            suplocation,
            supaddress,
            suppostalcode,
            supplierImg
        });
    
    } else {
        if (req.files && req.files.SupplierImg) {
            let dir = './public/uploads/inventory/';
            if (!fs.existsSync(dir)) {
             fs.mkdirSync(dir, { recursive: true });
            }
    
            let supplierImage = req.files.SupplierImg;
            let nowDate = Date.now();
            let iconUrl = dir + nowDate / 1000 + "" + supplierImage.name;
    
            supplierImage.mv(iconUrl, async function (err) {
                if (err)
                    console.log(err);
            });
    
            imagePath = iconUrl.substring(9);
            image = imagePath;
        }
        else{
            let dir = './public/uploads/inventory/';
            let nowDate = Date.now();
            let iconUrl = dir + nowDate / 1000 + "" + supplierImg.name;
            imagePath = iconUrl.substring(9);
            image = imagePath;
        }

        Supplier.update({
            supname,
            supcontactname,
            supemail,
            supcontactno,
            suplocation,
            supaddress,
            suppostalcode,
            image
        }, {
            where: {
                id: req.params.id
            }
        }). then((supplier) => {
            alertMessage(res, 'success', supname + ' has been edited successfully.', 'fas fa-edit', true);
            res.redirect('/supplier/viewSupplier');
        }).catch(err => console.log(err)) 
    }
});

// Remove Rattan Supplier
router.get('/rmvSupplier', (req, res) => {
	Supplier.findAll()
    .then((suppliers) => {
    // pass object to listVideos.handlebar
    res.render('supplier/rmvSupplier', {
        suppliers: suppliers
    });
    })
    .catch(err => console.log(err));
});

// Shows edit video page
router.get('/rmvingSupplier/:id', (req, res) => {
    Supplier.findOne({where: {id: req.params.id}})
        .then((supplier) => {
            let suppliername = supplier.supname;
            let supplierid = supplier.id
            Supplier.destroy({
                where: {
                    id: supplierid
                }
            }).then(() => {
                alertMessage(res, 'success', suppliername + ' has been deleted successfully.', 'fas fa-user-minus', true);
                res.redirect('/supplier/viewSupplier')
            })
        })
        .catch(err => console.log(err)); // To catch no video ID
});

router.get('/emailSupplier/:id', (req, res) => {
    Supplier.findOne({where: {id: req.params.id}})
        .then((supplier) => {
            //checkOptions(supplier);
            // call views/video/editVideo.handlebar to render the edit video page
            res.render('supplier/emailSupplier', {
                supplier // passes video object to handlebar
            });
        }).catch(err => console.log(err)); // To catch no video ID
});

router.post('/emailSupplier/:id', (req, res) => {
    let email = req.body.supemail;
    let subjects = req.body.emailSubject;
    let title = req.body.emailTitle;
    let content = req.body.emailContent;
    // Generate JWT token
    let token;
    jwt.sign(email, process.env.JWT_SECRET, (err, jwtoken) => {
        if (err) console.log('Error generating Token: ' + err);
        token = jwtoken;
    });

    sendEmail(email, subjects, title, content, token)
    .then(msg => {
        alertMessage(res, 'success', 'Email has been sent successfully!', 'fas fa-user-minus', true);
        res.redirect('/supplier/viewSupplier');
    }).catch(err => {
        alertMessage(res, 'warning', 'Email has not been sent successfully!', 'fas fa-user-minus', true);
        res.redirect('/supplier/viewSupplier');
    });
});

function sendEmail(email, subjects, title, content, token){
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const message = {
        to: email,
        from: 'leezheng13@gmail.com',
        subject: subjects,
        text: title,
        html: content
    };
    // Returns the promose from SendGrid to the calling function
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

module.exports = router;
