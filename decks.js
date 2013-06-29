var jwt = require('jwt-simple');
var tokenSecret = "artdeko";
var security = require('./libs/security');
var pg = require('pg'); 
var AWS = require('aws-sdk');
var postgres = process.env.DATABASE_URL;// || "postgres://neilkinnish:neilkinnish527441@localhost/deko";

AWS.config.update({accessKeyId: 'AKIAJN7JW4JKRHUBZ2KQ', secretAccessKey: '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', region: 'us-east-1'});

exports.publish = function(req, res) {

	if (req.headers.token == undefined) {
		res.json({ status: 401, message: "Inavlid token, authentication failed" }, 401); 
		return;
	}

	var decoded = jwt.decode(req.headers.token, tokenSecret);

	security.validateTokenUser(decoded.email, function(err, result) {

		if (!result.valid){
			res.send({ status: 401, message: "Authentication failed" }, 401); 
			return;
		}

		var sts = new AWS.STS();

		var params = { 'Name' : 'Mac', 'Policy' : '{"Statement": [{"Effect": "Allow","Action": "*","Resource": "*"}]}', 'DurationSeconds' : 60 * 60 * 24 };

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
	res.render('decks/index', {
		title: 'API'
	});
};

exports.indexForm = function(req, res) {
	res.render('decks/indexform', {
		title: 'API'
	});
};