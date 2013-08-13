var jwt = require('jwt-simple'),
	utilities = require('../libs/utilities'),
	token = require('../libs/validateToken'),
	AWS = require('aws-sdk'), 
	amazonDetails = utilities.getAmazonDetails(),
	util = require('util'),
	Hashids = require('hashids'),
	config = require('../config'),
    pg = require('pg');

AWS.config.update({accessKeyId: amazonDetails.accessKeyId, secretAccessKey: amazonDetails.secretAccessKey, region: amazonDetails.region});

// Publish, called as soon as the user confirms they wish to publish their quickcast
// Expects a valid user token and responds with a castid and a temporary 
// amazon s3 token allowing the app to begin uploading the raw mp4
exports.publish = function(req, res) {
	// Validate user token - this could be middleware
	token.validateToken(req, function(err, result){
		if (err) {
			res.json({ status: 401, message: err }, 401);
			return;
		}

		var sts = new AWS.STS();
		var params = { 'Name' : 'Temporary', 'Policy' : '{"Statement":[{"Effect":"Allow","Action":["s3:GetObject","s3:PutObject","s3:PutObjectAcl","s3:ListMultipartUploadParts","s3:AbortMultipartUpload","s3:GetObjectTorrent"],"Resource":"arn:aws:s3:::quickcast/' + result.user.userid + '/*"}]}', 'DurationSeconds' : 1200 };

		// Get a temp amazon s3 token
		sts.client.getFederationToken(params, function(err, data){
			if (err) {
				res.json({ status: 500, message: err, amazon: amazonDetails }, 500);
				return;
			}

			var pgClient = new pg.Client(config.postgres.connection);
			pgClient.connect();

			var response = {};

			response["federationToken"] = data;
			response["bucket-1"] = amazonDetails.sourceBucket;
			response["bucket-2"] = amazonDetails.destinationBucket;
			response["user"] = result.user;

			var cleanTags = [];
			var tags = req.body.tags.split(',');

			for(var tag in tags){
				var t = tags[tag].replace(/^\s*|\s*$/g, '');
				if (t.length > 0)
					cleanTags.push(t);
			}

			// Add any details to the cast table and get an id, this postgres function
			// handles normalisation of tags, etc
			pgClient.query("SELECT AddCast($1,$2,$3,$4,$5,$6,$7);", [result.user.userid, new Date(), req.body.description, req.body.name, req.body.intro, req.body.outro, cleanTags.join(",")])
				.on('row', function(r){
					response["cast"] = r;
				})
				.on('end', function(r){
					pgClient.end();
					res.json(response);
				});			
		});
	});
};

// publish update. called by the app when the user submits the meta info for the quickcast
exports.publishUpdate = function(req, res) {
	// Validate user token - this could be middleware
	token.validateToken(req, function(err, result){
		if (err) {
			res.json({ status: 401, message: err }, 401);
			return;
		}

		var pgClient = new pg.Client(config.postgres.connection);
		pgClient.connect();

		var response = {};

		var cleanTags = [];
		var tags = req.body.tags.split(',');

		for(var tag in tags){
			var t = tags[tag].replace(/^\s*|\s*$/g, '');
			if (t.length > 0)
				cleanTags.push(t);
		}

		// as per publish, updatecast handles tags and all meta data normalisation
		pgClient.query("SELECT UpdateCast($1,$2,$3,$4,$5,$6);", [req.body.description, req.body.name, req.body.intro, req.body.outro, req.body.castid, cleanTags.join(",")])
			.on('row', function(r){
				response["cast"] = r;
			})
			.on('end', function(r){
				pgClient.end();
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
	token.validateToken(req, function(err, result){
		if (err) {
			res.json({ status: 401, message: err }, 401);
			return;
		}

		// fire a message to amazon and start transcoding the video into mp4 and webm
		var str = '%s/%s/quickcast.%s';
		var strSmall = '%s/%s/quickcast-small.%s';

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
					'Key': util.format(strSmall, result.user.userid, req.headers.castid, 'mp4'),
					'PresetId': amazonDetails.mp4small,
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
	token.validateToken(req, function(err, result){
		if (err) {
			res.json({ status: 401, message: err }, 401);
			return;
		}

		var pgClient = new pg.Client(config.postgres.connection);
		pgClient.connect();

		// get a hash for our unique video url
		var hashids = new Hashids("quickyo"),
			hash = hashids.encrypt(parseInt(result.user.userid), parseInt(req.headers.castid));

		// update the database with the final details and mark the quickcast as published
		pgClient.query("UPDATE casts SET published = true, size = $1, length = $2, width = $3, height = $4, uniqueid = $5 WHERE castid = $6", [req.headers.size, req.headers.length, parseInt(req.headers.width), parseInt(req.headers.height), hash, req.headers.castid])
			.on('end', function(r) {
				pgClient.end();

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