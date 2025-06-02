const alertMessage = require('./messenger'); // Bring in alert messenger

const ensureAuthenticated = (req, res, next) => {
    
    if(req.isAuthenticated()) { // If user is authenticated
        return next(); // Calling next() to proceed to the next statement
    } else {
        req.session.returnTo = req.originalUrl;
        req.session.save();
        res.redirect('/showLogin');
    }
    // If not authenticated, show alert message and redirect to ‘/’
    //alertMessage(res, 'danger', 'Access Denied', 'fas fa-exclamation-circle', true);
    //res.redirect('/');
};
module.exports = ensureAuthenticated;