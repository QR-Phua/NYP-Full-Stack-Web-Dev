/*
* 'require' is similar to import used in Java and Python. It brings in the libraries required to be used
* in this JS file.
* */
const flash = require('connect-flash');
const FlashMessenger = require('flash-messenger');
const express = require('express');
const session = require('express-session');
const path = require('path');
const exphbs = require('express-handlebars');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const passport = require('passport');
const fileUpload = require('express-fileupload');
require("dotenv").config();
var paginateHelper  = require('express-handlebars-paginate');
var paginatee = require('handlebars-paginate');
/*
* Loads routes file main.js in routes directory. The main.js determines which function
* will be called based on the HTTP request and URL.
*/
const mainRoute = require('./routes/main');
const userRoute = require('./routes/user');
const staffRoute = require('./routes/staff');
const shoppingRoute = require('./routes/shopping');
const productsRoute = require('./routes/products');
const featuredRoute = require('./routes/featureds');
const supplierRoute = require('./routes/supplier');
const suppliesRoute = require('./routes/supplies');
const stockRoute = require('./routes/stock');
const dealRoute = require('./routes/deal');
const transactionRoute = require('./routes/transaction');
const invpaymentRoute = require('./routes/invpayment');
const orderRoute = require('./routes/order');
const promoRoute = require('./routes/promo');
const invdeliveryRoute = require('./routes/invdelivery');

const {adminCheck, calculateTotal} = require('./helpers/hbs');
const {staffCheck} = require('./helpers/hbs');
const {userCheck} = require('./helpers/hbs');

// Bring in handlebars helper
const {formatDate, radioCheck, equalto, greaterthan, replaceCommas, maskEmail, get_Item_Total, maskCC} = require('./helpers/hbs');

/*
* Creates an Express server - Express is a web application framework for creating web applications
* in Node JS.
*/
const app = express();

const MySQLStore = require('express-mysql-session');
const db = require('./config/db');
// Bring in database connection
const invDB = require('./config/DBConnection');
// Connects to MySQL database
invDB.setUpDB(false); // To set up database with new tables set (true)

// Passport Config
const authenticate = require('./config/passport');
authenticate.localStrategy(passport);

app.use('/uploads', express.static(__dirname + '/uploads'));

app.use(express.static('./public'));
app.use(express.static(__dirname + './public', { maxAge: '30 days' }));
app.use(express.static(__dirname + '/../public'));
app.use(express.static(__dirname + '/static'));


// Handlebars Middleware
/*
* 1. Handlebars is a front-end web templating engine that helps to create dynamic web pages using variables
* from Node JS.
*
* 2. Node JS will look at Handlebars files under the views directory
*
* 3. 'defaultLayout' specifies the main.handlebars file under views/layouts as the main template
*
* */
app.engine('handlebars', exphbs({
	helpers: {
        formatDate: formatDate,
        radioCheck: radioCheck,
		equalto: equalto,
		greaterthan: greaterthan,
        replaceCommas: replaceCommas,
		maskEmail: maskEmail,
		get_Item_Total: get_Item_Total,
		maskCC: maskCC,
		staffCheck:staffCheck,
		adminCheck:adminCheck,
		userCheck:userCheck,
		calculateTotal:calculateTotal
    },
	defaultLayout: 'main' // Specify default template views/layout/main.handlebar 
}));
app.set('view engine', 'handlebars');


//Register Helper
// exphbs.registerHelper('paginate', paginate);

// exphbs.handlebars.registerHelper('paginateHelper', paginateHelper.createPagination);



// Body parser middleware to parse HTTP body in order to read HTTP data
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(bodyParser.json());


// Creates static folder for publicly accessible HTML, CSS and Javascript files
app.use(express.static(path.join(__dirname, 'public')));


// Method override middleware to use other HTTP methods such as PUT and DELETE
app.use(methodOverride('_method'));

// Enables session to be stored using browser's Cookie ID
app.use(cookieParser());

app.use(fileUpload());
// To store session information. By default it is stored as a cookie on browser
app.use(session({
	key: 'fsdp_session',
	secret: 'fsdpj',
	store: new MySQLStore({
		host: db.host,
		port: 3306,
		user: db.username,
		password: db.password,
		database: db.database,
		clearExpired: true,
		// How frequently expired sessions will be cleared; milliseconds:
		checkExpirationInterval: 900000,
		// The maximum age of a valid session; milliseconds:
		expiration: 900000,
	}),
	resave: false,
	saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use(FlashMessenger.middleware);

app.use(function (req, res, next) {
	res.locals.success_msg = req.flash('success_msg');
	res.locals.error_msg = req.flash('error_msg');
	res.locals.error = req.flash('error');
	res.locals.user = req.user || null;
	res.locals.session = req.session;
	next();
});

// Place to define global variables - not used in practical 1

app.use((req, res, next) => {
    res.locals.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    next();
});

// Use Routes
/*
* Defines that any root URL with '/' that Node JS receives request from, for eg. http://localhost:5000/, will be handled by
* mainRoute which was defined earlier to point to routes/main.js
* */
app.use('/', mainRoute); // mainRoute is declared to point to routes/main.js
app.use('/user', userRoute);
app.use('/staff', staffRoute);
app.use('/shopping', shoppingRoute);
app.use('/products', productsRoute);
app.use('/featureds', featuredRoute);
app.use('/supplier', supplierRoute);
app.use('/supplies', suppliesRoute);
app.use('/stock', stockRoute);
app.use('/deal', dealRoute);
app.use('/transaction', transactionRoute);
app.use('/invpayment', invpaymentRoute);
app.use('/order', orderRoute);
app.use('/promo', promoRoute);
app.use('/invdelivery', invdeliveryRoute);
// This route maps the root URL to any path defined in main.js

/*
* Creates a unknown port 5000 for express server since we don't want our app to clash with well known
* ports such as 80 or 8080.
* */
const port = 50000;

// Starts the server and listen to port 5000
app.listen(port, () => {
	console.log(`Server started on port ${port}`);
});