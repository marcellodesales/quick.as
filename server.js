var express = require('express'), 
	users = require('./api/users'),
	casts = require('./api/casts'),
	api = require('./api/index'),
	site = require('./site'),
	config = require('./config'),
	utilities = require('./libs/utilities'),
	//passport = require("passport"), 
	//LocalStrategy = require('passport-local').Strategy,
	//redis = require('redis'),
	//redisConfig = require("url").parse(config.redis.url)
    //redisClient = redis.createClient(redisConfig.port, redisConfig.hostname),
    oneDay = 86400000,
 	app = express();

redisClient.auth(config.redis.password);

module.exports = app;

/* Implement passport against postgres lookup
 * session will be held in redis
passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function(err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
    done(null, user.email);
});

passport.deserializeUser(function(email, done) {
    User.findOne({email:email}, function(err, user) {
        done(err, user);
    });
});*/

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.bodyParser());
app.use(express.methodOverride());

//app.use(express.session({
//  store: redisClient,
//  secret: config.sessionSecret
//}));
//app.use(passport.initialize());
//app.use(passport.session());

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

// Casts
app.get('/api/v1/casts', casts.index);
app.put('/api/v1/casts/publish', casts.publish);
app.post('/api/v1/casts/publish/complete', casts.publishComplete);
app.post('/api/v1/casts/publish/update', casts.publishUpdate);
app.get('/api/v1/casts/publish/encode', casts.encodeRequest);

/* Site Video */

app.get('/:entry', site.video);

var port = process.env.PORT || 5000;

// Start the server
app.listen(port, function() {
	console.log('running on', port);
	// Potentially activate this for a better implementation
	// managing log persistance
	/*var cronJob = require('cron').CronJob;
	var date = new Date();
	new cronJob('59 * * * * *', function(){
		utilities.persistRedisLogsToPostgres(date);
	}, null, true, null);*/
});