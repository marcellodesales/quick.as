var jwt = require('jwt-simple'),
	utilities = require('../libs/utilities'),
	pg = require('pg'),
	postgres = process.env.DATABASE_URL,
	Q = require('q');

exports.setup = function(req, res) {
	var client = new pg.Client(postgres);
	client.connect();

	client.query("DROP TABLE IF EXISTS users;CREATE TABLE users (userid SERIAL, created TIMESTAMP, firstname VARCHAR(35), lastname VARCHAR(35), email VARCHAR(200), username VARCHAR(15), password VARCHAR(200), mailinglist BOOLEAN, PRIMARY KEY (userid))")
		.on('end', function() {
			client.end();
			res.json({ "complete": true }, 200);
		});
};

exports.signup = function(req, res){
	var client = new pg.Client(postgres),
		username = req.headers.username,
		password = req.headers.password,
		email = req.headers.email,
		firstname = req.headers.firstname,
		lastname = req.headers.lastname,
		mailinglist = req.headers.mailinglist === undefined ? false : req.headers.mailinglist,
		errors = [];

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

	client.connect();

	function emailExists(){
		var deferred = Q.defer();
		client.query("SELECT email FROM users WHERE email = $1", [email], function(err, result){
			if (result.rowCount > 0){
				errors.push( { name: "email", message: "Email already in use" } );
				deferred.reject(new Error("Email already in use"));
			}else{
				deferred.resolve();
			}
		});
		return deferred.promise;
	}

	function usernameExists(){
		var deferred = Q.defer();
		client.query("SELECT username FROM users WHERE username = $1", [username], function(err, result){
			if (result.rowCount > 0){
				errors.push( { name: "username", message: "Username already in use" } );
				deferred.reject(new Error("Username already in use"));
			}else{
				deferred.resolve();
			}
		});
		return deferred.promise;
	}

	Q.fcall(validate)
		.then(emailExists)
		.then(usernameExists)
		.then(function(){
			utilities.cryptPassword(password,function(err,pwd){
				client.query("INSERT INTO users(created,firstname,lastname,email,username,password,mailinglist) values($1,$2,$3,$4,$5,$6,$7)", [new Date(), firstname, lastname, email, username, pwd, mailinglist])
					.on('end', function(){
						client.end();
						var token = jwt.encode({ email: email }, utilities.getSecret());
						res.json({ token: token });
					});
			});
		})
		.fail(function(err){
			client.end();
			res.json({ errors: errors }, 403); 
		})
		.done();
};

exports.signin = function(req, res){
	var client = new pg.Client(postgres),
		username = req.headers.username,
		password = req.headers.password,
		error = { status: 401, message: "Authentication failed for supplied credentials" };

	client.connect();

	if (username === undefined || password === undefined) {
		res.json(error, 401);
		return;
	}

	client.query("SELECT * FROM users WHERE username = $1", [username], function(err, result){
		if (err) res.json(error, 401);
		client.end();
		if (result.rowCount === 0)
		  res.json(error, 401);
		else{
			var row = result.rows[0];
			utilities.comparePassword(password, row.password, function(err, match){
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

exports.userByToken = function(req, res){
	utilities.validateToken(req, function(err, result){
		if (err) res.json({ status: 401, message: err }, 401);
		res.json(result.user);
	});
};

exports.userCasts = function(req, res){
	utilities.validateToken(req, function(err, result){
		if (err) res.json({ status: 401, message: err }, 401);

		var client = new pg.Client(postgres);
		client.connect();
		
		client.query("SELECT * FROM casts WHERE ownerid = $1 ORDER BY created DESC LIMIT 10", [result.user.userid], function(e, casts){
			if (e) res.json(e, 400);
			client.end();
			if (casts.rowCount === 0)
				res.json({ casts: null },200)
			else
				res.json(casts, 200);
		});
	});
};

exports.index = function(req, res){
	res.render('api/users/index', {
		title: 'API'
	});
};