var jwt = require('jwt-simple'),
	utilities = require('../libs/utilities'),
	pg = require('pg'),
	AWS = require('aws-sdk'), 
	postgres = utilities.getDBConnection(),
	amazonDetails = utilities.getAmazonDetails(),
	util = require('util'),
	Hashids = require('hashids');

AWS.config.update({accessKeyId: amazonDetails.accessKeyId, secretAccessKey: amazonDetails.secretAccessKey, region: amazonDetails.region});

// Simply a setup controller - drops and recreated all tables and functions in postgres
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

// Publish, called as soon as the user confirms they wish to publish their quickcast
// Expects a valid user token and responds with a castid and a temporary 
// amazon s3 token allowing the app to begin uploading the raw mp4
exports.publish = function(req, res) {
	// Validate user token - this could be middleware
	utilities.validateToken(req, function(err, result){
		if (err) {
			res.json({ status: 401, message: err }, 401);
			return;
		}

		var client = new pg.Client(postgres),
			sts = new AWS.STS();

		var params = { 'Name' : 'Temporary', 'Policy' : '{"Statement": [{"Effect": "Allow","Action": "s3:*","Resource": "*"}]}', 'DurationSeconds' : 1200 };

		// Get a temp amazon s3 token
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

			// Add any details to the cast table and get an id, this postgres function
			// handles normalisation of tags, etc
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

// publish update. called by the app when the user submits the meta info for the quickcast
exports.publishUpdate = function(req, res) {
	// Validate user token - this could be middleware
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

		// as per publish, updatecast handles tags and all meta data normalisation
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

// encode request. called once the raw mp4 has been uploaded and fires amazon encoding 
exports.encodeRequest = function(req, res) {
	if (req.headers.castid === undefined) {
		res.json({ status: 400, message: "Invalid castid" }, 400); 
		return;
	}

	// Validate user token - this could be middleware
	utilities.validateToken(req, function(err, result){
		if (err) {
			res.json({ status: 401, message: err }, 401);
			return;
		}

		// fire a message to amazon and start transcoding the video into mp4 and webm
		var str = '%s/%s/quickcast.%s';

		var et = new AWS.ElasticTranscoder();

		var params = { 
			'PipelineId': amazonDetails.pipelineId,
			'Input': {
				'Key': util.format(str, result.user.userid, req.headers.castid, 'mp4'),
				'FrameRate': 'auto',
				'Resolution': 'auto',
				'AspectRatio': 'auto',
				'Interlaced': 'auto',
				'Container': 'auto'
			},
			'Outputs': [
				{
					'Key': util.format(str, result.user.userid, req.headers.castid, 'mp4'),
					'PresetId': amazonDetails.mp4,
					'ThumbnailPattern': "",
					'Rotate': '0'
				},
				{
					'Key': util.format(str, result.user.userid, req.headers.castid, 'webm'),
					'PresetId': amazonDetails.webM,
					'ThumbnailPattern': "",
					'Rotate': '0'
				}
			]
		};

		// transcode
		et.createJob(params, function(err1, data1){
			if (err1){
				res.json({ status: 500, message: err1 }, 500);
				return;
			}

			res.json({ status: 200, message: "Encoding requested" }, 200);
		});
	});
};

// publish complete. sets the quickcast to published
exports.publishComplete = function(req, res) {
	if (req.headers.castid === undefined) {
		res.json({ status: 400, message: "Invalid castid" }, 400); 
		return;
	}

	// Validate user token - this could be middleware
	utilities.validateToken(req, function(err, result){
		if (err) {
			res.json({ status: 401, message: err }, 401);
			return;
		}

		var client = new pg.Client(postgres);
		client.connect();

		// get a hash for our unique video url
		var hashids = new Hashids("quickyo"),
			hash = hashids.encrypt(parseInt(result.user.userid), parseInt(req.headers.castid));

		// update the database with the final details and mark the quickcast as published
		client.query("UPDATE casts SET published = true, size = $1, length = $2, width = $3, height = $4, uniqueid = $5 WHERE castid = $6", [req.headers.size, req.headers.length, parseInt(req.headers.width), parseInt(req.headers.height), hash, req.headers.castid])
			.on('end', function(r) {
				client.end();

				// send a postmark confirmation mail
				var postmark = require("postmark")(utilities.getPostmark().apiKey);

				postmark.send({
					"From": utilities.getPostmark().from, 
					"To": result.user.email, 
					"Subject": "Published QuickCast", 
					"TextBody": "Hi " + result.user.firstname + ",\n\nYour QuickCast has been successfully published!\n\nIt can take a few seconds to encode your QuickCast once it has been uploaded, but once ready you can view online at the following URL: http://quick.as/" + hash + "\n\nThanks for using QuickCast\n\nhttp://quickcast.io\nhttp://twitter.com/quickcast"
				});

				res.json({ status: 200, message: "Successfully published", url: "http://quick.as/" + hash }, 200);
			});
	});
};

// Casts API index page
exports.index = function(req, res) {
	res.render('api/casts/index', {
		title: 'API'
	});
};