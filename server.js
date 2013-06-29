var express = require('express'), users = require('./users'), decks = require('./decks');
 
var app = express();

module.exports = app;

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.get('/', function(req, res, next){
	res.render('index', {
		title: 'Index'
	});
});

app.get('/v1/decks', decks.index);
app.get('/v1/decks/publish', decks.publish);
//app.get('/v1/decks/form/publish', decks.indexForm);

app.get('/v1/users', users.index);
app.post('/v1/users/signin', users.signin);
app.post('/v1/users/signup', users.signup);
app.get('/v1/users/userbytoken', users.userbytoken);
//app.get('/v1/users/list', users.users);
//app.get('/v1/users/setup', users.setup);
//app.get('/v1/users/form/signin', users.signinForm);
//app.get('/v1/users/form/signup', users.signupForm);

var port = process.env.PORT || 5000;

app.listen(port, function() {
	console.log('Listening on port ' + port);
});