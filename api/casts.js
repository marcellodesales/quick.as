var jwt = require('jwt-simple'),
	tokenSecret = "artdeko",
	security = require('../libs/utilities'),
	pg = require('pg'),
	AWS = require('aws-sdk'), 
	postgres = process.env.DATABASE_URL;

exports.setup = function(req, res) {
	var client = new pg.Client(postgres);

	client.connect();

	var dropTables = function(fn) {
		client.query("DROP TABLE IF EXISTS casts;DROP TABLE IF EXISTS tags;DROP TABLE IF EXISTS casts_tags")
		.on('end', function(r) {
			return fn && fn(null, r);
		});
	};

	var createTables = function(fn) {
		client.query("CREATE TABLE casts_tags (castid INTEGER, tagid INTEGER, PRIMARY KEY (castid,tagid));CREATE TABLE tags (id SERIAL, name VARCHAR(100), PRIMARY KEY (id));CREATE TABLE casts (id SERIAL, created TIMESTAMP, published BOOLEAN, name VARCHAR(50), description TEXT, ownerid INTEGER, intro TEXT, outro TEXT, length FLOAT, size FLOAT, image VARCHAR(100), mp4 VARCHAR(100), ogv VARCHAR(100), webm VARCHAR(100), PRIMARY KEY (id))")
		.on('end', function(r) {
			return fn && fn(null, r);
		});
	};

	dropTables(function (err, result) {
		createTables(function (err, result) {
			client.end();
			res.send("Casts DB setup complete");
		});
	});
};

exports.publish = function(req, res) {
	if (req.headers.token == undefined) {
		res.json({ status: 401, message: "Inavlid token, authentication failed" }, 401); 
		return;
	}

	var decoded = jwt.decode(req.headers.token, tokenSecret);

	security.validateTokenUser(decoded.email, function(err, result) {

		if (!result.valid) {
			res.send({ status: 401, message: "Authentication failed" }, 401); 
			return;
		}

		AWS.config.update({accessKeyId: 'AKIAIZYVY67XOF34ZJWQ', secretAccessKey: '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', region: 'us-east-1'});

		var sts = new AWS.STS();

		var params = { 'Name' : 'Mac', 'Policy' : '{"Statement": [{"Effect": "Allow","Action": "s3:*","Resource": "*"}]}', 'DurationSeconds' : 60 * 60 * 1 };

		sts.client.getFederationToken(params, function(err, data) {

			var response = {};

			response["federationToken"] = data;
			response["bucket"] = "example";
			response["user"] = result.user;

			res.json([response]);
		});
	});
};

exports.index = function(req, res) {
	res.render('api/casts/index', {
		title: 'API'
	});
};