var jwt = require('jwt-simple'),
	utilities = require('../libs/utilities'),
	pg = require('pg'),
	AWS = require('aws-sdk'), 
	postgres = utilities.getDBConnection(),
	amazonDetails = utilities.getAmazonDetails(),
	util = require('util');

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
		client.query("CREATE TABLE casts_tags (castid INTEGER, tagid INTEGER, PRIMARY KEY (castid,tagid));CREATE TABLE tags (tagid SERIAL, name VARCHAR(100), PRIMARY KEY (tagid));CREATE TABLE casts (castid SERIAL, created TIMESTAMP, published BOOLEAN, name VARCHAR(50), description TEXT, ownerid INTEGER, intro TEXT, outro TEXT, length FLOAT, size FLOAT, width INTEGER, height INTEGER, views INTEGER, PRIMARY KEY (castid))")
			.on('end', function(r) {
				return fn && fn(null, r);
			});
	};

	var createFunctions = function(fn) {
		// Expects: OwnerId, DateTime, Description, Name, Intro, Outro, Tags (comma separated)
		var addCast = "CREATE OR REPLACE FUNCTION AddCast(int, timestamp, varchar, varchar, varchar, varchar, text) RETURNS INTEGER AS $$ \
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

	dropTables(function (err, result){
		createTables(function (err, result){
			createFunctions(function (err, result){
				client.end();
				res.json({ "complete": true }, 200);
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
		if (err) {
			res.json({ status: 401, message: err }, 401);
			return;
		}

		// transcoding
		var str = '/%s/%s/quickcast.%s';

		var et = new AWS.ElasticTranscoder();

		var params_mp4 = { 
			'pipeline_id': amazonDetails.pipelineId,
			'input': {
				'key': util.format(str, result.user.userid, req.headers.castid, 'mp4'),
				'frame_rate': 'auto',
				'resolution': 'auto',
				'aspect_ratio': 'auto',
				'interlaced': 'auto',
				'container': 'auto'
			},
			'output': {
				'key': util.format(str, result.user.userid, req.headers.castid, 'mp4'),
				'preset_id': amazonDetails.mp4,
				'thumbnail_pattern': "",
				'rotate': '0'
			}
		};

		var params_webm = { 
			'pipeline_id': amazonDetails.pipelineId,
			'input': {
				'key': util.format(str, result.user.userid, req.headers.castid, 'mp4'),
				'frame_rate': 'auto',
				'resolution': 'auto',
				'aspect_ratio': 'auto',
				'interlaced': 'auto',
				'container': 'auto'
			},
			'output': {
				'key': util.format(str, result.user.userid, req.headers.castid, 'webm'),
				'preset_id': amazonDetails.webm,
				'thumbnail_pattern': "",
				'rotate': '0'
			}
		};

		et.createJob(params_mp4, function(err1, data1) {
			et.createJob(params_webm, function(err2, data2) {
				var client = new pg.Client(postgres);
				client.connect();

				client.query("UPDATE casts SET published = true, size = $1, length = $2, width = $3, height = $4 WHERE castid = $5", [req.headers.size, req.headers.length, parseInt(req.headers.width), parseInt(req.headers.height), req.headers.castid])
					.on('end', function(r) {
						client.end();
						res.json({ status: 200, message: "Successfully published" }, 200);
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