var utilities = require('./libs/utilities'),
	pg = require('pg'), 
    postgres = utilities.getDBConnection(),
    marked = require('marked'),
    moment = require('moment'),
    util = require('util');

markedOpts = {
	gfm: true,
	highlight: function (code, lang, callback) {
		pygmentize({ lang: lang, format: 'html' }, code, function (err, result) {
			callback(err, result.toString());
		});
	},
	tables: true,
	breaks: false,
	pedantic: false,
	sanitize: true,
	smartLists: true,
	smartypants: false,
	langPrefix: 'lang-'
}

exports.video = function(req, res) {
	var video_entry = req.params.entry,
		client = new pg.Client(postgres);

    client.connect();

    client.query("SELECT casts.*, users.username FROM casts INNER JOIN users ON (casts.ownerid = users.userid) WHERE castid = $1", [video_entry], function(err, result){
    	client.end();
		if (result != undefined && result.rowCount > 0){
			var data = result.rows[0];
			utilities.logViews(video_entry, req, function(err, r) {
				marked(data.description, markedOpts, function (err, content) {
					if (err) throw err;

					var a = moment(data.created);
					var b = moment(new Date());

					var duration = moment(data.created).hours();

					var str = 'https://s3.amazonaws.com/quickcast/%s/%s/quickcast.%s';
					var fileCheck = '/%s/%s/quickcast.%s';

					var amazonDetails = utilities.getAmazonDetails();

					var s3 = require('aws2js').load('s3', amazonDetails.accessKeyId, amazonDetails.secretAccessKey)

					s3.setBucket(amazonDetails.destinationBucket);

					s3.head(util.format(fileCheck, data.ownerid, video_entry, 'mp4'), function (err, s3res) {

						var processed = null;

						if (err && err.code === 404){
							processed = "processing";
							if (duration > 2)
								processed = "failed";
						}
						else if (err && err.statusCode != 200)
							processed = "failed";

					    res.render('video', {
							mp4: util.format(str, data.ownerid, video_entry, 'mp4'),
							webm: util.format(str, data.ownerid, video_entry, 'webm'),
							body: content,
							views: data.views + r,
							title: data.name,
							username: data.username,
							when: a.from(b),
							processed: processed,
							id: video_entry
						});

					});

					
				});
			});
		}else{
			res.json("404!", 404);
		}
	});
};

exports.embed = function(req, res) {
	var video_entry = req.params.entry,
		client = new pg.Client(postgres);

    client.connect();

    client.query("SELECT casts.*, users.username FROM casts INNER JOIN users ON (casts.ownerid = users.userid) WHERE castid = $1", [video_entry], function(err, result){
    	client.end();
		if (result != undefined && result.rowCount > 0){
			var data = result.rows[0];

			var a = moment(data.created);
			var b = moment(new Date());

			var duration = moment(data.created).hours();

			var str = 'https://s3.amazonaws.com/quickcast/%s/%s/quickcast.%s';
			var fileCheck = '/%s/%s/quickcast.%s';

			var amazonDetails = utilities.getAmazonDetails();

			var s3 = require('aws2js').load('s3', amazonDetails.accessKeyId, amazonDetails.secretAccessKey)

			s3.setBucket(amazonDetails.destinationBucket);

			s3.head(util.format(fileCheck, data.ownerid, video_entry, 'mp4'), function (err, s3res) {

				var processed = null;

				if (err && err.code === 404){
					processed = "processing";
					if (duration > 2)
						processed = "failed";
				}
				else if (err && err.statusCode != 200)
					processed = "failed";

			    res.render('embed', {
					mp4: util.format(str, data.ownerid, video_entry, 'mp4'),
					webm: util.format(str, data.ownerid, video_entry, 'webm'),
					processed: processed,
					id: video_entry
				});

			});

		}else{
			res.json("404!", 404);
		}
	});
};