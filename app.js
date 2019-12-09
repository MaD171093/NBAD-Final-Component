var express = require('express');
var router = require('./routes/router.js');
var connectionRouter = require('./routes/connectionController.js');
var profileRouter = require('./routes/profileController.js');
var session = require('express-session');//so that req.session is available for all the routers

var helmet = require('helmet'); //to protect the app from some well-known web vulnerabilities by setting HTTP headers appropriately

var app = express();

var PORT = 8080;

app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/assets/'));


app.use(helmet());

app.use(session({
  secret: "secret",
  resave: true,
  saveUninitialized: true
}));



app.use('/',profileRouter)
app.use('/loginView',profileRouter)
app.use('/savedConnections',profileRouter)
app.use('/savedConnections/clearSession',profileRouter)


app.use('/',connectionRouter);
app.use('/connections',connectionRouter);
app.use('/connection',connectionRouter);

app.use('/',router);
app.use('/index',router);
app.use('/contact',router);
app.use('/about',router);




app.listen(PORT, function(){
  console.log("Listening on port", PORT);
});
