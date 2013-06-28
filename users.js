var jwt = require('jwt-simple');
var tokenSecret = "artdeko";
var security = require('./libs/security');
var pg = require('pg'); 
var postgres = process.env.DATABASE_URL || "postgres://neilkinnish:neilkinnish527441@localhost/deko";


exports.setup = function(req, res) {

	var client = new pg.Client(postgres);

	if(client.connection != null)
		client.connect();

	client.query("DROP TABLE users");
	var query = client.query("CREATE TABLE users (id SERIAL, created TIMESTAMP, firstname VARCHAR(35), lastname VARCHAR(35), email VARCHAR(200), username VARCHAR(15), password VARCHAR(200))");

	query.on('end', function() {
		client.end();
		res.send("complete!");
	});
};

exports.users = function(req, res) {

	if (req.headers.token === undefined)
		res.send({ status: 401, message: "Inavlid token, authentication failed" }, 401); return;

	var decoded = jwt.decode(req.headers.token, tokenSecret);

	security.validateTokenUser(decoded.email, function(err, result) {

		if (!result){
			res.send({ status: 401, message: "Authentication failed" }, 401); 
			return;
		}

		var client = new pg.Client(postgres);

		if(client.connection != null)
			client.connect();

		var jsonArray = new Array();

		var query = client.query("SELECT * FROM users");

		query.on('row', function(row) {
			jsonArray.push(row);
		});

		query.on('end', function() {
			client.end();
			res.send(jsonArray);
		});

	});

};

exports.signup = function(req, res) {

	var client = new pg.Client(postgres);

	if(client.connection != null)
		client.connect();

	var username = req.headers.username;
	var password = req.headers.password;
	var email = req.headers.email;
	var firstname = req.headers.firstname;
	var lastname = req.headers.lastname;
	var errors = [];

	var checkEmail = function(fn) {
		client.query("SELECT * FROM users WHERE email = $1", [email])
		.on('row', function(r) {
			errors.push( { message: "Email already in use" } ); 
		})
		.on('end', function(r) {
			return fn && fn(null, r);
		});
	};

	var checkUsername = function(fn) {
		client.query("SELECT * FROM users WHERE username = $1", [username])
		.on('row', function(r) {
			errors.push( { message: "Username already in use" } ); 
		})
		.on('end', function(r) {
			return fn && fn(null, r);
		});
	};

	checkUsername(function (err, result) {
		checkEmail(function (err, result) {
			finishRequest(result);
		});
	});

	var finishRequest = function(result) {
		if (errors.length > 0) {

			var str = "";

			for(var m in errors)
			{
				str += " " + errors[m].message;
			}
			client.end();

			res.json({ error: true, message: str });
		}else{
			security.cryptPassword(password,function(err,pwd) {
				var query = client.query("INSERT INTO users(created,firstname,lastname,email,username,password) values($1,$2,$3,$4,$5,$6)", [new Date(), firstname, lastname, email, username, pwd]);

				query.on('end', function() {
					var payload = { email: email };
					var token = jwt.encode(payload, tokenSecret);
					client.end();
					res.json({ token: token });
				});
			});
		}
	};
};

exports.signin = function(req, res) {

	var client = new pg.Client(postgres);

	if(client.connection != null)
		client.connect();

	var username = req.headers.username;
	var password = req.headers.password;

	if (username === undefined || password === undefined) {
		res.send({ status: 401, message: "Authentication failed" }, 401);
		return;
	}

	var query = client.query("SELECT * FROM users WHERE username = $1", [username]);

	query.on('row', function(row) {

		security.comparePassword(password, row.password, function(err,match) {
			if (match)
			{
				var payload = { email: row.email };
				var token = jwt.encode(payload, tokenSecret);
				var response = { token: token, email: row.email };
				res.json(response);
			}
			else
				res.send({ status: 401, message: "Authentication failed" }, 401);
		});

	});

	query.on('error', function(err) {
		res.send({ status: 500, message: err }, 500);
	});

	query.on('end', function() {
		client.end();
	});
};

exports.signinForm = function(req, res) {
	res.render('signin', {
		title: 'Signin'
	});
};

exports.signupForm = function(req, res) {
	res.render('signup', {
		title: 'Signup'
	});
};

exports.index = function(req, res) {
	res.render('index', {
		title: 'API'
	});
};

