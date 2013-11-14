var express = require('express'), 
	users = require('./api/users'),
	casts = require('./api/casts'),
	api = require('./api/index'),
	site = require('./site'),
	utilities = require('./libs/utilities'),
    oneDay = 86400000,
 	app = express(),
 	RedisStore = require('connect-redis')(express);

module.exports = app;

var redis, rtg;

if (process.env.REDISCLOUD_URL) {
	rtg = require('url').parse(process.env.REDISCLOUD_URL);
	redis = require('redis').createClient(rtg.port, rtg.hostname);
	redis.auth(rtg.auth.split(':')[1]);
} else {
	redis = require("redis").createClient();
} 

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.methodOverride());

app.use(express.session({
	store: new RedisStore({client: redis}),
	secret: process.env.SESSION_SECRET,
	maxAge: new Date(Date.now() + 7200)//7200000)
}));

app.use(express.compress());
app.use(express.favicon(__dirname + '/public/favicon.ico'));
app.use(express.static(__dirname + '/public', { maxAge: oneDay }));

app.use(function(req, res, next) {
	if(req.url.substr(-1) == '/' && req.url.length > 1)
		res.redirect(301, req.url.slice(0, -1).toLowerCase());
	else if(req.url.match(/[A-Z]/) != null)
		res.redirect(301, req.url.toLowerCase());
	else
		next();
});

/*app.use(function(err, req, res, next){
	res.status(500);
	res.render('500', { error: err });
});*/

/* Site */

app.get('/', site.root);
app.get('/embed/:entry', site.embed);

//app.use('/reset-password', site.resetPassword);
//app.use('/new-password/:code', site.confirmNewPassword);

/* API */
//app.get('/api/v1', api.index);

// Users
//app.get('/api/v1/users', users.index);
app.post('/api/v1/users/signin', users.signin);
app.put('/api/v1/users/signup', users.signup);
app.get('/api/v1/users/userbytoken', users.userByToken);
app.get('/api/v1/users/usercasts', users.userCasts);

// Casts
//app.get('/api/v1/casts', casts.index);
app.put('/api/v1/casts/publish', casts.publish);
app.post('/api/v1/casts/publish/complete', casts.publishComplete);
app.post('/api/v1/casts/publish/update', casts.publishUpdate);
app.get('/api/v1/casts/publish/encode', casts.encodeRequest);
app.get('/api/v1/casts/publish/encode-windows', casts.encodeRequestWindows);

/* Site Video */

app.get('/:entry', site.video);

app.use(function(req,res) { 
    res.render('404', 404);
});

var port = process.env.PORT || 5000;

// Start the server
app.listen(port, function() {
	console.log('running on', port);
});