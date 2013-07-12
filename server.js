var express = require('express'), 
	users = require('./api/users'),
	casts = require('./api/casts'),
	api = require('./api/index'),
	site = require('./site');
 
var app = express();

module.exports = app;

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(__dirname + '/public'));

/* Site */

app.get('/', site.index);
app.get('/make', site.make);
app.get('/source', site.watch);

/* API */

app.get('/api/v1', api.index);

// Users
app.post('/api/v1/users', users.index);
app.post('/api/v1/users/signin', users.signin);
app.put('/api/v1/users/signup', users.signup);
app.get('/api/v1/users/userbytoken', users.userByToken);

app.get('/api/v1/users/setup', users.setup); // Setup

// Casts
app.get('/api/v1/casts', casts.index);
app.put('/api/v1/casts/publish', casts.publish);
app.put('/api/v1/casts/publish/complete', casts.publishComplete);

app.get('/api/v1/casts/setup', casts.setup); // Setup

var port = process.env.PORT || 5000;

app.listen(port, function() {
	console.log('running on', port);
});