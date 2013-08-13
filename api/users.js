var jwt = require('jwt-simple'),
	utilities = require('../libs/utilities'),
	token = require('../libs/validateToken'),
	Q = require('q'),
	config = require('../config'),
    pg = require('pg');

// handles the user signup
exports.signup = function(req, res) {
	var username = req.headers.username,
		password = req.headers.password,
		email = req.headers.email,
		firstname = req.headers.firstname,
		lastname = req.headers.lastname,
		mailinglist = req.headers.mailinglist === undefined ? false : req.headers.mailinglist,
		errors = [];

	// really basic validation - could be better
	function validate(){
		if (!utilities.validateField(firstname))
			errors.push( { name: "firstname", message: "Firstname is required" } );
		if (!utilities.validateField(lastname))
			errors.push( { name: "lastname", message: "Lastname is required" } );
		if (!utilities.validateField(username))
			errors.push( { name: "username", message: "Username is required" } );
		if (!utilities.validateEmail(email))
			errors.push( { name: "email", message: "Email is required & must be valid" } );
		if (!utilities.validateField(password))
			errors.push( { name: "password", message: "Password is required" } );

		if (errors.length > 0)
			throw new Error("Invalid data sent");

		return;
	}

	var pgClient = new pg.Client(config.postgres.connection);
	pgClient.connect();

	// validate the email doesn't already exist within postgres
	function emailExists(){
		var deferred = Q.defer();
		pgClient.query("SELECT email FROM users WHERE email = $1", [email], function(err, result){
			if (result.rowCount > 0){
				errors.push( { name: "email", message: "Email already in use" } );
				deferred.reject(new Error("Email already in use"));
			}else{
				deferred.resolve();
			}
		});
		return deferred.promise;
	}

	// validate the username doesn't already exist within postgres
	function usernameExists(){
		var deferred = Q.defer();
		pgClient.query("SELECT username FROM users WHERE username = $1", [username], function(err, result){
			if (result.rowCount > 0){
				errors.push( { name: "username", message: "Username already in use" } );
				deferred.reject(new Error("Username already in use"));
			}else{
				deferred.resolve();
			}
		});
		return deferred.promise;
	}

	// rather than nest, we defer all of the calls before we insert the new user
	Q.fcall(validate)
		.then(emailExists)
		.then(usernameExists)
		.then(function(){
			utilities.cryptPassword(password,function(err,pwd){
				pgClient.query("INSERT INTO users(created,firstname,lastname,email,username,password,mailinglist) VALUES ($1,$2,$3,$4,$5,$6,$7)", [new Date(), firstname, lastname, email, username, pwd, mailinglist])
					.on('end', function(){
						pgClient.end();
						var token = jwt.encode({ email: email }, utilities.getSecret());

						// send a postmark confirmation mail
						var postmark = require("postmark")(utilities.getPostmark().apiKey);

						postmark.send({
							"From": utilities.getPostmark().from, 
							"To": email, 
							"Subject": "Welcome to QuickCast", 
							"TextBody": "Hi " + firstname + ",\n\nThis email is simply to comfirm that you have created an account and published your first QuickCast!\n\nThanks for using QuickCast\n\nhttp://quickcast.io\nhttp://twitter.com/quickcast"
						});

						res.json({ token: token });
					});
			});
		})
		.fail(function(err){
			pgClient.end();
			res.json({ errors: errors }, 403); 
		})
		.done();
};

// handles the user signin
exports.signin = function(req, res) {
	var username = req.headers.username,
		password = req.headers.password,
		error = { status: 401, message: "Authentication failed for supplied credentials" };

	if (username === undefined || password === undefined) {
		res.json(error, 401);
		return;
	}

	var pgClient = new pg.Client(config.postgres.connection);
	pgClient.connect();

	// query postgres
	pgClient.query("SELECT * FROM users WHERE username = $1", [username], function(err, result){
		pgClient.end();
		if (err) {
			res.json(error, 401);
			return;
		}

		if (result.rowCount === 0)
		  res.json(error, 401);
		else{
			var row = result.rows[0];

			// compare the encrypted password
			utilities.comparePassword(password, row.password, function(err, match) {
				if (match)
				{
					var token = utilities.encodeToken({ email: row.email });
					res.json({ token: token, email: row.email });
				}
				else
					res.json(error, 401);
			});
		}
	});
};

// handles the token validation by the app
exports.userByToken = function(req, res) {
	token.validateToken(req, function(err, result) {
		if (err) {
			res.json({ status: 401, message: err }, 401);
			return;
		}
		
		res.json(result);
	});
};

// returns a list (top 10) of users casts
exports.userCasts = function(req, res) {
	token.validateToken(req, function(err, result){
		if (err) {
			res.json({ status: 401, message: err }, 401);
			return;
		}

		var pgClient = new pg.Client(config.postgres.connection);
		pgClient.connect();
		
		pgClient.query("SELECT * FROM casts WHERE ownerid = $1 AND published = true ORDER BY created DESC LIMIT 10", [result.user.userid], function(e, casts){
			pgClient.end();
			if (e) {
				res.json(e, 400);
				return;
			}

			if (casts.rowCount === 0)
				res.json({ casts: null, user: result.user }, 200)
			else
				res.json({ casts: casts, user: result.user }, 200);
		});
	});
};

// Users API index page
exports.index = function(req, res){
	res.render('api/users/index', {
		title: 'API'
	});
};