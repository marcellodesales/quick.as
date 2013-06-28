var express = require('express'), users = require('./users');
 
var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.get('/', users.index);
app.post('/v1/signin', users.signin);
app.post('/v1/signup', users.signup);
app.get('/v1/users', users.users);
app.get('/v1/setup', users.setup);
app.get('/v1/form/signin', users.signinForm);
app.get('/v1/form/signup', users.signupForm);

var port = process.env.PORT || 5000;

app.listen(port, function() {
	console.log('Listening on port ' + port);
});