var jwt = require('jwt-simple'),
	utilities = require('../libs/utilities'),
	pg = require('pg'),
	AWS = require('aws-sdk'), 
	postgres = process.env.DATABASE_URL,
	amazonDetails = utilities.getAmazonDetails();

AWS.config.update({accessKeyId: amazonDetails.accessKeyId, secretAccessKey: amazonDetails.secretAccessKey, region: amazonDetails.region});

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
		client.query("CREATE TABLE casts_tags (castid INTEGER, tagid INTEGER, PRIMARY KEY (castid,tagid));CREATE TABLE tags (tagid SERIAL, name VARCHAR(100), PRIMARY KEY (tagid));CREATE TABLE casts (castid SERIAL, created TIMESTAMP, published BOOLEAN, name VARCHAR(50), description TEXT, ownerid INTEGER, intro TEXT, outro TEXT, length FLOAT, size FLOAT, PRIMARY KEY (castid))")
			.on('end', function(r) {
				return fn && fn(null, r);
			});
	};

	var createFunctions = function(fn) {
		// Expects: OwnerId, DateTime, Description, Name, Intro, Outro, Tags (comma separated)
		var addCast = "CREATE OR REPLACE FUNCTION AddCast(int, timestamp, varchar, varchar, varchar, varchar, text) RETURNS INTEGER AS $$ \
BEGIN \
INSERT INTO casts (castid, ownerid, created, published, description, name, intro, outro) \
VALUES (DEFAULT, $1, $2, false, $3, $4, $5, $6); \
INSERT INTO tags (name) \
SELECT tag \
FROM unnest(string_to_array($7, ',')) AS dt(tag) \
WHERE NOT EXISTS ( \
SELECT tagid \
FROM tags \
WHERE name = tag); \
INSERT INTO casts_tags(castid, tagid) \
SELECT currval('casts_castid_seq'::regclass), A.tagid FROM tags A WHERE A.name = ANY (string_to_array($7, ',')); \
RETURN currval('casts_castid_seq'::regclass); \
END; \
$$ language plpgsql;";

		client.query(addCast)
			.on('end', function(r){
				return fn && fn(null, r);
			});
	};

	dropTables(function (err, result){
		createTables(function (err, result){
			createFunctions(function (err, result){
				client.end();
				res.send("Casts DB setup complete");
			});
		});
	});
};

exports.publish = function(req, res) {
	utilities.validateToken(req, function(err, result){
		if (err) res.json({ status: 401, message: err }, 401);

		var client = new pg.Client(postgres),
			sts = new AWS.STS();

		var params = { 'Name' : 'Temporary', 'Policy' : '{"Statement": [{"Effect": "Allow","Action": "s3:*","Resource": "*"}]}', 'DurationSeconds' : 1200 };

		sts.client.getFederationToken(params, function(err, data){
			if (err) res.json({ status: 500, message: err, amazon: amazonDetails }, 500);

			client.connect();

			var response = {};

			response["federationToken"] = data;
			response["bucket-1"] = amazonDetails.sourceBucket;
			response["bucket-2"] = amazonDetails.destinationBucket;
			response["user"] = result.user;

			client.query("SELECT AddCast($1,$2,$3,$4,$5,$6,$7);", [result.user.userid, new Date(), req.headers.description, req.headers.name, req.headers.intro, req.headers.outro, req.headers.tags])
				.on('row', function(r){
					response["cast"] = r;
				})
				.on('end', function(r){
					client.end();
					res.json(response);
				});			
		});
	});
};

exports.publishComplete = function(req, res) {
	if (req.headers.castid === undefined) {
		res.json({ status: 400, message: "Invalid castid" }, 400); 
		return;
	}

	utilities.validateToken(req, function(err, result){
		if (err) res.json({ status: 401, message: err }, 401);

		var client = new pg.Client(postgres);
		client.connect();

		client.query("UPDATE casts SET published = true, size = $1, length = $2 WHERE castid = $3", [req.headers.size, req.headers.length, req.headers.castid])
			.on('end', function(r) {
				client.end();
				res.json({ status: 200, message: "Successfully published" }, 200);
			});
	});
};

exports.index = function(req, res) {
	res.render('api/casts/index', {
		title: 'API'
	});
};