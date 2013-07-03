var express = require('express'), 
	users = require('./api/users'),
	casts = require('./api/casts'),
	api = require('./api/index'),
	public = require('./public');
 
var app = express();

module.exports = app;

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

/* Public */

app.get('/', public.index);

/* API */

app.get('/api', api.index);

// Users
app.get('/api/v1/users', users.index);
app.post('/api/v1/users/signin', users.signin);
app.post('/api/v1/users/signup', users.signup);
app.get('/api/v1/users/userbytoken', users.userByToken);
app.get('/api/v1/users/setup', users.setup); // Setup

// Casts
app.get('/api/v1/casts', casts.index);
app.get('/api/v1/casts/publish', casts.publish);
//app.get('/api/v1/casts/publish/completed', casts.publishcompleted);

app.get('/api/v1/casts/setup', casts.setup); // Setup

var port = process.env.PORT || 5000;

app.listen(port, function() {
	console.log('running on', port);
});