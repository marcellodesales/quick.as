var jwt = require('jwt-simple'),
	utilities = require('../libs/utilities'),
	pg = require('pg'),
	AWS = require('aws-sdk'), 
	postgres = utilities.getDBConnection(),
	amazonDetails = utilities.getAmazonDetails(),
	util = require('util'),
	Hashids = require('hashids');

AWS.config.update({accessKeyId: amazonDetails.accessKeyId, secretAccessKey: amazonDetails.secretAccessKey, region: amazonDetails.region});

exports.updateFunctions = function(req, res) {
	var client = new pg.Client(postgres);
	client.connect();

	var createUpdateCastFunction = function(fn) {
		// Expects: Description, Name, Intro, Outro, CastId, Tags (comma separated)
		var addCast = "CREATE OR REPLACE FUNCTION UpdateCast(text, varchar, varchar, varchar, int, text) RETURNS INTEGER AS $$ \
BEGIN \
UPDATE casts SET description = $1, name = $2, intro = $3, outro = $4 WHERE castid = $5; \
INSERT INTO tags (name) \
SELECT tag \
FROM unnest(string_to_array($6, ',')) AS dt(tag) \
WHERE NOT EXISTS ( \
SELECT tagid \
FROM tags \
WHERE name = tag); \
INSERT INTO casts_tags(castid, tagid) \
SELECT currval('casts_castid_seq'::regclass), A.tagid FROM tags A WHERE A.name = ANY (string_to_array($6, ',')); \
RETURN currval('casts_castid_seq'::regclass); \
END; \
$$ language plpgsql;";

		client.query(addCast)
			.on('end', function(r){
				return fn && fn(null, r);
			});
	};

	createUpdateCastFunction(function (err, result){
		client.end();
		res.json({ "complete": true }, 200);
	});
};

exports.setup = function(req, res) {
	var client = new pg.Client(postgres);
	client.connect();

	var dropTables = function(fn) {
		client.query("DROP TABLE IF EXISTS casts;DROP TABLE IF EXISTS tags;DROP TABLE IF EXISTS casts_tags;")
			.on('end', function(r) {
				return fn && fn(null, r);
			});
	};

	var createTables = function(fn) {
		client.query("CREATE TABLE casts_tags (castid INTEGER, tagid INTEGER, PRIMARY KEY (castid,tagid));CREATE TABLE tags (tagid SERIAL, name VARCHAR(100), PRIMARY KEY (tagid));CREATE TABLE casts (castid SERIAL, uniqueid VARCHAR(50), created TIMESTAMP, published BOOLEAN, name VARCHAR(50), description TEXT, ownerid INTEGER, intro TEXT, outro TEXT, length FLOAT, size FLOAT, width INTEGER, height INTEGER, views INTEGER, PRIMARY KEY (castid))")
			.on('end', function(r) {
				return fn && fn(null, r);
			});
	};

	var createAddCastFunction = function(fn) {
		// Expects: OwnerId, DateTime, Description, Name, Intro, Outro, Tags (comma separated)
		var addCast = "CREATE OR REPLACE FUNCTION AddCast(int, timestamp, text, varchar, varchar, varchar, text) RETURNS INTEGER AS $$ \
BEGIN \
INSERT INTO casts (castid, ownerid, created, published, description, name, intro, outro, views, height, width) \
VALUES (DEFAULT, $1, $2, false, $3, $4, $5, $6, 0, 0, 0); \
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

	var createUpdateCastFunction = function(fn) {
		// Expects: CastId, Description, Name, Intro, Outro, Tags (comma separated)
		var addCast = "CREATE OR REPLACE FUNCTION UpdateCast(text, varchar, varchar, varchar, int, text) RETURNS INTEGER AS $$ \
BEGIN \
UPDATE casts SET description = $1, name = $2, intro = $3, outro = $4 WHERE castid = $5; \
INSERT INTO tags (name) \
SELECT tag \
FROM unnest(string_to_array($6, ',')) AS dt(tag) \
WHERE NOT EXISTS ( \
SELECT tagid \
FROM tags \
WHERE name = tag); \
INSERT INTO casts_tags(castid, tagid) \
SELECT $5, A.tagid FROM tags A WHERE A.name = ANY (string_to_array($6, ',')); \
RETURN $5; \
END; \
$$ language plpgsql;";

		client.query(addCast)
			.on('end', function(r){
				return fn && fn(null, r);
			});
	};

	dropTables(function (err, result){
		createTables(function (err, result){
			createAddCastFunction(function (err, result){
				createUpdateCastFunction(function (err, result){
					client.end();
					res.json({ "complete": true }, 200);
				});
			});
		});
	});
};

exports.publish = function(req, res) {
	utilities.validateToken(req, function(err, result){
		if (err) {
			res.json({ status: 401, message: err }, 401);
			return;
		}

		var client = new pg.Client(postgres),
			sts = new AWS.STS();

		var params = { 'Name' : 'Temporary', 'Policy' : '{"Statement": [{"Effect": "Allow","Action": "s3:*","Resource": "*"}]}', 'DurationSeconds' : 1200 };

		sts.client.getFederationToken(params, function(err, data){
			if (err) {
				res.json({ status: 500, message: err, amazon: amazonDetails }, 500);
				return;
			}

			client.connect();

			var response = {};

			response["federationToken"] = data;
			response["bucket-1"] = amazonDetails.sourceBucket;
			response["bucket-2"] = amazonDetails.destinationBucket;
			response["user"] = result.user;

			var cleanTags = [];
			var tags = req.body.tags.split(',');

			for(var tag in tags){
				cleanTags.push(tags[tag].replace(/^\s*|\s*$/g, ''));
			}

			client.query("SELECT AddCast($1,$2,$3,$4,$5,$6,$7);", [result.user.userid, new Date(), req.body.description, req.body.name, req.body.intro, req.body.outro, cleanTags.join(",")])
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

exports.publishUpdate = function(req, res) {
	utilities.validateToken(req, function(err, result){
		if (err) {
			res.json({ status: 401, message: err }, 401);
			return;
		}

		var client = new pg.Client(postgres);

		client.connect();

		var response = {};

		var cleanTags = [];
		var tags = req.body.tags.split(',');

		for(var tag in tags){
			cleanTags.push(tags[tag].replace(/^\s*|\s*$/g, ''));
		}

		client.query("SELECT UpdateCast($1,$2,$3,$4,$5,$6);", [req.body.description, req.body.name, req.body.intro, req.body.outro, req.body.castid, cleanTags.join(",")])
			.on('row', function(r){
				response["cast"] = r;
			})
			.on('end', function(r){
				client.end();
				res.json(response);
			});
	});
};

exports.publishComplete = function(req, res) {
	if (req.headers.castid === undefined) {
		res.json({ status: 400, message: "Invalid castid" }, 400); 
		return;
	}

	utilities.validateToken(req, function(err, result){
		if (err) {
			res.json({ status: 401, message: err }, 401);
			return;
		}

		// transcoding
		var str = '%s/%s/quickcast.%s';

		var et = new AWS.ElasticTranscoder();

		var params_mp4 = { 
			'PipelineId': amazonDetails.pipelineId,
			'Input': {
				'Key': util.format(str, result.user.userid, req.headers.castid, 'mp4'),
				'FrameRate': 'auto',
				'Resolution': 'auto',
				'AspectRatio': 'auto',
				'Interlaced': 'auto',
				'Container': 'auto'
			},
			'Output': {
				'Key': util.format(str, result.user.userid, req.headers.castid, 'mp4'),
				'PresetId': amazonDetails.mp4,
				'ThumbnailPattern': "",
				'Rotate': '0'
			}
		};

		var params_webm = { 
			'PipelineId': amazonDetails.pipelineId,
			'Input': {
				'Key': util.format(str, result.user.userid, req.headers.castid, 'mp4'),
				'FrameRate': 'auto',
				'Resolution': 'auto',
				'AspectRatio': 'auto',
				'Interlaced': 'auto',
				'Container': 'auto'
			},
			'Output': {
				'Key': util.format(str, result.user.userid, req.headers.castid, 'webm'),
				'PresetId': amazonDetails.webM,
				'ThumbnailPattern': "",
				'Rotate': '0'
			}
		};

		et.createJob(params_mp4, function(err1, data1) {
			if (err1){
				res.json({ status: 400, message: err1 }, 400);
				return;
			}
			et.createJob(params_webm, function(err2, data2) {
				if (err2){
					res.json({ status: 400, message: err2 }, 400);
					return;
				}
				var client = new pg.Client(postgres);
				client.connect();

				var hashids = new Hashids("quickyo"),
    				hash = hashids.encrypt(parseInt(result.user.userid), parseInt(req.headers.castid));

				client.query("UPDATE casts SET published = true, size = $1, length = $2, width = $3, height = $4, uniqueid = $5 WHERE castid = $6", [req.headers.size, req.headers.length, parseInt(req.headers.width), parseInt(req.headers.height), hash, req.headers.castid])
					.on('end', function(r) {
						client.end();
						res.json({ status: 200, message: "Successfully published", url: "http://quick.as/" + hash }, 200);
					});
			});
		});
	});
};

exports.index = function(req, res) {
	res.render('api/casts/index', {
		title: 'API'
	});
};