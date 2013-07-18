var express = require('express'), 
	users = require('./api/users'),
	casts = require('./api/casts'),
	api = require('./api/index'),
	site = require('./site');
 
var app = express();

module.exports = app;

var oneDay = 86400000;

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.compress());
app.use(express.favicon(__dirname + '/public/favicon.ico'));
app.use(express.static(__dirname + '/public', { maxAge: oneDay }));

app.use(function(req, res, next) {
	if(req.url.substr(-1) == '/' && req.url.length > 1)
		res.redirect(301, req.url.slice(0, -1).toLowerCase());
	else
		next();
});

app.use(function(err, req, res, next){
	res.status(500);
	res.render('500', { error: err });
});

/* Site */

app.get('/', site.root);
app.get('/embed/:entry', site.embed);

/* API */

app.get('/api/v1', api.index);

// Users
app.get('/api/v1/users', users.index);
app.post('/api/v1/users/signin', users.signin);
app.put('/api/v1/users/signup', users.signup);
app.get('/api/v1/users/userbytoken', users.userByToken);
app.get('/api/v1/users/usercasts', users.userCasts);

app.get('/api/v1/users/setup', users.setup); // Setup

// Casts
app.get('/api/v1/casts', casts.index);
app.put('/api/v1/casts/publish', casts.publish);
app.put('/api/v1/casts/publish/complete', casts.publishComplete);

app.get('/api/v1/casts/setup', casts.setup); // Setup

/* Site Video */

app.get('/:entry', site.video);

var port = process.env.PORT || 5000;

app.listen(port, function() {
	console.log('running on', port);
});