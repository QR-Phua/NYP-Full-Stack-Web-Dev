const express = require('express');
const router = express.Router();
const User = require('../models/User');
const alertMessage = require('../helpers/messenger');
const bcrypt = require('bcryptjs'); //for passowrd encryption
const passport = require('passport');
const { success } = require('flash-messenger/Alert');
const ensureAuthenticated = require('../helpers/auth');
const { route } = require('./main');
const saltRounds = 10;
const { Op } = require("sequelize").Op;
const sgMail = require('@sendgrid/mail');
const jwt = require('jsonwebtoken');
const { response } = require('express');

// Login Form POST => /user/login
router.post('/login', (req, res, next) => {
    User.findOne({
        where:{
            username: req.body.username
        }
    }).then(user => {
        if(user) {
            if (user.verified === true) {
                passport.authenticate('local', {
                    successRedirect: '/',
                    failureRedirect: '/showLogin', // Route to /login URL
                    failureFlash: true
                })(req, res, next);
            } else {
                alertMessage(res, 'danger', user.username + ' has not been verified', 'fas fa-exclamation-circle', true);
                res.redirect('/showLogin');
            }
        } else {
            alertMessage(res, 'danger', 'Unauthorised Access', 'fas fa-exclamation-circle', true);
        } 
    });
});
    

// User register URL using HTTP post => /user/register
router.post('/register', (req, res) => {
    //insert codes here
    req.body.username
    req.body.name
    req.body.contact
    req.body.address
    req.body.email // Retrieves email input
    req.body.password // Retrieves password input
    req.body.password2 // Retrieves password2 input
    req.body.role 
 

    let errors = [];
    // Retrieves fields from register page from request body
    let {username, name, contact, address, email, password, password2, role} = req.body;
    // Checks if both passwords entered are the same
    if(password !== password2) {
        errors.push({text: 'Passwords do not match'});
    }
    // Checks that password length is more than 4
    if(password.length < 4) {
        errors.push({text: 'Password must be at least 4 characters'});
    }
    if(contact.length < 8) {
        errors.push({text: 'Contact must be at least 8 characters'});
    }
    if (errors.length > 0) {
    res.render('user/register', {
        errors,
        username,
        name,
        contact,
        address,
        email,
        password,
        password2,
        role
        });
    }else{
        // If all is well, checks if user is already registered
        User.findOne({ where: {email: req.body.email} })
        .then(user => {
            if (user) {
        // If user is found, that means email has already been
        // registered
            res.render('user/register', {
                error: user.email + ' already registered',
                errors,
                username,
                name,
                contact,
                address,
                email,
                password,
                password2,
                role
            });
        } else {
            User.findOne({ where: {username: req.body.username} })
            .then(user => {
                if (user) {
            // If user is found, that means email has already been
            // registered
                res.render('user/register', {
                    error: user.username + ' already registered',
                    errors,
                    username,
                    name,
                    contact,
                    address,
                    email,
                    password,
                    password2,
                    role
                });
            } else {
                User.findOne({ where: {contact: req.body.contact} })
                .then(user => {
                    if (user) {
                // If user is found, that means email has already been
                // registered
                    res.render('user/register', {
                        error: user.contact + ' already registered',
                        errors,
                        username,
                        name,
                        contact,
                        address,
                        email,
                        password,
                        password2,
                        role
                    });
                } else {
                    User.findOne({ where: {address: req.body.address} })
                    .then(user => {
                        if (user) {
                    // If user is found, that means email has already been
                    // registered
                        res.render('user/register', {
                            error: user.address + ' already registered',
                            errors,
                            username,
                            name,
                            contact,
                            address,
                            email,
                            password,
                            password2,
                            role
                        });
                    } else {
            let token;
            jwt.sign(email, process.env.JWT_SECRET, (err, jwtoken) => {
            if (err) console.log('Error generating Token: ' + err);
                token = jwtoken;
            });
                //Generate salt hashed password
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(password,salt, (err, hash) => {
                    if (err) throw err;
                    password = hash;
                    // Create new user record
                    User.create({ username, name, contact, address, email, password, role, verified:0})
                        .then(user => {
                            sendEmail(user.id, user.email, token) // Add this to call sendEmail function
                            .then(msg => { // Send email success
                                alertMessage(res, 'success', user.username + ' added. Please logon to ' + user.email + ' to verify account.','fas fa-sign-in-alt', true);
                            res.redirect('/showLogin');
                        }).catch(err => { // Send email fail
                            alertMessage(res, 'warning', 'Error sending to ' + user.email, 'fas fa-sign-in-alt', true);
                            res.redirect('/');
                        });
                        }).catch(err => console.log(err));
                    })
                })
            }
        });
    }
});
    }
});
    }
});
}
});

router.post('/staffregister', (req, res) => {
    //insert codes here
    req.body.username
    req.body.name
    req.body.contact
    req.body.address
    req.body.email // Retrieves email input
    req.body.password // Retrieves password input
    req.body.password2
    req.body.role // Retrieves password2 input
 

    let errors = [];
    // Retrieves fields from register page from request body
    let {username, name, contact, address, email, password, password2, role} = req.body;
    // Checks if both passwords entered are the same
    if(password !== password2) {
        errors.push({text: 'Passwords do not match'});
    }
    if(contact.length < 8) {
        errors.push({text: 'Contact needs to have at least 8 digits'});
    }
    // Checks that password length is more than 4
    if(password.length < 4) {
        errors.push({text: 'Password must be at least 4 characters'});
    }
    if (errors.length > 0) {
    res.render('user/staffregister', {
        errors,
        username,
        name,
        contact,
        address,
        email,
        password,
        password2,
        role
        });
    }else{
        // If all is well, checks if user is already registered
        User.findOne({ where: {email: req.body.email} })
        .then(user => {
            if (user) {
        // If user is found, that means email has already been
        // registered
            res.render('user/staffregister', {
                error: user.email + ' already registered',
                errors,
                username,
                name,
                contact,
                address,
                email,
                password,
                password2,
                role
            });
        } else {
            User.findOne({ where: {username: req.body.username} })
            .then(user => {
                if (user) {
            // If user is found, that means email has already been
            // registered
                res.render('user/staffregister', {
                    error: user.username + ' already registered',
                    errors,
                    username,
                    name,
                    contact,
                    address,
                    email,
                    password,
                    password2,
                    role
                });
            } else {
                User.findOne({ where: {contact: req.body.contact} })
                .then(user => {
                    if (user) {
                // If user is found, that means email has already been
                // registered
                    res.render('user/staffregister', {
                        error: user.contact + ' already registered',
                        errors,
                        username,
                        name,
                        contact,
                        address,
                        email,
                        password,
                        password2,
                        role
                    });
                } else {
                    User.findOne({ where: {address: req.body.address} })
                    .then(user => {
                        if (user) {
                    // If user is found, that means email has already been
                    // registered
                        res.render('user/staffregister', {
                            error: user.address + ' already registered',
                            errors,
                            username,
                            name,
                            contact,
                            address,
                            email,
                            password,
                            password2,
                            role
                        });
                    } else {
                //Generate salt hashed password
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(password,salt, (err, hash) => {
                    if (err) throw err;
                    password = hash;
                    
                    // Create new user record
                    User.create({ username, name, contact, address, email, password, role, verified:1})
                        .then(user => {
                            alertMessage(res, 'success', user.username + ' added. Please login', 'fas fa-sign-in-alt', true);
                            res.redirect('/showAfterlogin');
                        })
                        .catch(err => console.log(err));
                    })
                })
            }   
        });
    }
});
            }
        });
    }
});
}
});

router.get('/profile', ensureAuthenticated, (req, res) => {
    User.findAll({
        where: {
            username: req.user.username
        },
        order: [
            ['username', 'name', 'contact', 'address', 'email']
        ],
        raw: true
    })
    .then((user) => {
    // pass object to listVideos.handlebar
        res.render('user/profile', {
            user: user
        });
    })
    .catch(err => console.log(err));
});

router.get('/edit/:id', ensureAuthenticated, (req, res) => {
    User.findOne({
        where: {
            id: req.params.id
        }
    }).then((user) => {
        if (req.user.id === req.user.id) {
        res.render('user/editprofile', {
            user // passes video object to handlebar
        });
    }else{
        alertMessage(res, 'danger', 'Unauthorised access to the profile', 'fas fa-exclamation-circle', true);
        res.redirect('/logout')
    }
    }).catch(err => console.log(err)); 
});

router.get('/editpass/:id', ensureAuthenticated, (req, res) => {
    User.findOne({
        where: {
            id: req.params.id
        }
    }).then((user) => {
        if (req.user.id === req.user.id) {
        res.render('user/editpassword', {
            user // passes video object to handlebar
        });
    }else{
        alertMessage(res, 'danger', 'Unauthorised access to the profile', 'fas fa-exclamation-circle', true);
        res.redirect('/logout')
    }
    }).catch(err => console.log(err)); 
});

router.put('/saveEditedProfile/:id', (req,res) => {
    let errors = [];
    let {username, name, contact, address, email} = req.body;

    if(contact.length < 8) {
        errors.push({text: 'Contact must be at least 8 characters'});
    }

    if (errors.length > 0) {
        res.render('user/editprofile', {
            errors,
            username,
            name,
            contact,
            address,
            email   
            });
        }else{

    User.update({
        username,
        name,
        contact,
        address,
        email
    }, {
        where: {
            id: req.params.id
        }
    }).then((user) => {
        res.redirect('/showProfile');
    }).catch(err => console.log(err))
}
});

router.post('/saveEditedPass/:id', (req,res) => {
    let errors = [];
    let id = req.params.id;
    let password = req.body.password;
    let npassword = req.body.npassword;
    let cpassword = req.body.cpassword;

    if(password.length < 4 && password.length != 0) {
        errors.push({text: 'Password must be at least 4 characters'});
        console.log(npassword);
        console.log(password);
        }
    if(npassword !== cpassword) {
        errors.push({text: 'Password does not match!'});
        console.log(npassword);
        console.log(password);
    }
    if (npassword.length < 4 && npassword.length != 0) {
        errors.push({text: 'Password must be at least 4 characters'});
        }
        if (password.length != 0) {
            bcrypt.compare(password, req.user.password, (error, result) => {
                if(error) throw error;
                if(result == false) {
                    errors.push({text: 'Password Incorrect'});
                }
                if(errors.length > 0) {
                    res.render('user/editpassword', {
                        id,
                        errors,
                        password 
                        })
            }else{
                password = req.body.cpassword;
                npassword = req.body.npassword;
                cpassword = req.body.cpassword;
                const hash = bcrypt.hashSync(password, saltRounds)
                password = hash;
                
                User.update({
                    password
                }, {
                    where: {
                        id: id
                    }
                }).then((user) => {
                    res.redirect('/showProfile');
                }).catch(err => console.log(err))
            }
        })
    }
})

router.get('/delete/:id', ensureAuthenticated, (req, res) => {
    User.findOne({
        where:{
            id:req.params.id
        }
    }).then((user) => {
        let username = user.username;

        if(req.user.id === req.user.id){
            User.destroy({
                where: {
                    id: req.params.id
                }
            }).then(() => {
                alertMessage(res, 'success', 'your account ' +username+ ' has been successfully deleted', 'far fa-trash-alt', true);
                res.redirect('/logout');
            })
        }else{
            alertMessage(res, 'danger', 'Unauthorised access to video', 'fas fa -exclamtion-circle', true);
            res.redirect('/logout');
        }
    }).catch(err => console.log(err));
});

router.get('/editrole/:id', ensureAuthenticated, (req, res) => {
    User.findOne({
        where: {
            id: req.params.id
        }
    }).then((user) => {
        if (req.user.id === req.user.id) {
        res.render('user/editrole', {
            user // passes video object to handlebar
        });
    }else{
        alertMessage(res, 'danger', 'Unauthorised access to the profile', 'fas fa-exclamation-circle', true);
        res.redirect('/logout')
    }
    }).catch(err => console.log(err)); 
});

router.put('/saveRole/:id', (req,res) => {
    let errors = [];
    let {username, name, contact, address, email, role} = req.body;

    if(contact.length < 8) {
        errors.push({text: 'Contact must be at least 8 characters'});
    }

    if (errors.length > 0) {
        res.render('user/editrole', {
            errors,
            username,
            name,
            contact,
            address,
            email,
            role
            });
        }else{

    User.update({
        username,
        name,
        contact,
        address,
        email,
        role
    }, {
        where: {
            id: req.params.id
        }
    }).then((user) => {
        res.redirect('/showStaffRole');
    }).catch(err => console.log(err))
}
});

router.get('/deletestaff/:id', ensureAuthenticated, (req, res) => {
    User.findOne({
        where:{
            id:req.params.id
        }
    }).then((user) => {
        let username = user.username;

        if(req.user.id === req.user.id){
            User.destroy({
                where: {
                    id: req.params.id
                }
            }).then(() => {
                alertMessage(res, 'success', 'The account ' +username+ ' has been successfully deleted', 'far fa-trash-alt', true);
                res.redirect('/showStaffRole');
            })
        }else{
            alertMessage(res, 'danger', 'Unauthorised access to video', 'fas fa -exclamtion-circle', true);
            res.redirect('/showStaffRole');
        }
    }).catch(err => console.log(err));
});
function sendEmail(id, email, token){
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    let verifyURL = 'http://localhost:50000/user/verify/'+ id + '/' + token;
    
    
    const message = {
        to: email,
        from: '195113g@mymail.nyp.edu.sg',
        subject: 'Verify Chun Mee Lee Account',
        text: 'Chun Mee Lee Email Verification',
        html: 'Thank you registering with Chun Mee Lee.<br><br>Please <a href="'+ verifyURL+'"><strong>verify</strong></a> your account.'
        };
        // Returns the promise from SendGrid to the calling function
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

router.get('/verify/:id/:token', (req, res, next) => {
    // retrieve from user using id
    User.findOne({
        where: {
            id: req.params.id
        }
    }).then(user => {
        if (user) { // If user is found
            let userEmail = user.email; // Store email in temporary variable
            if (user.verified === true) { // Checks if user has been verified
                alertMessage(res, 'info', 'User already verified', 'fas fa-exclamation-circle', true);
                res.redirect('/showLogin');
            } else {
            // Verify JWT token sent via URL
        jwt.verify(req.params.token, process.env.JWT_SECRET, (err, authData) => {
            if (err) {
                alertMessage(res, 'danger', 'Unauthorised Access', 'fas fa-exclamation-circle', true);
                res.redirect('/');
            } else {
                User.update({verified: 1}, {
                    where: {id: user.id}
                }).then(user => {
                    alertMessage(res, 'success', userEmail + ' verified. Please login', 'fas fa-sign-in-alt', true);
                    res.redirect('/showLogin');
                });
            }
        });
    }
} else {
    alertMessage(res, 'danger', 'Unauthorised Access', 'fas fa-exclamation-circle', true);
    res.redirect('/');
        }
    });
});
module.exports = router;