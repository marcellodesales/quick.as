var utilities = require('./libs/utilities'),
	views = require('./libs/viewLog'),
    marked = require('marked'),
    moment = require('moment'),
    util = require('util'),
    Hashids = require('hashids'),
    pg = require('pg');

// Marked (markdown) settings
markedOpts = {
	gfm: true,
	tables: true,
	breaks: false,
	pedantic: false,
	sanitize: true,
	smartLists: true,
	smartypants: false,
	langPrefix: 'lang-'
}

// Root url - simply redirect to quickcast.io
exports.root = function(req, res) {
	res.redirect("http://quickcast.io");
};

exports.resetPassword = function(req, res) {

	if (req.body.reset)
	{		
		var pgClient = new pg.Client(process.env.DATABASE_URL);
    	pgClient.connect();

    	var timestamp = new Date().getTime();

    	var hashids = new Hashids("quickyo"),
			resetcode = hashids.encrypt(parseInt(timestamp)),
			resetdate = new Date().addHours(1);

		console.log(resetdate);

    	pgClient.query("SELECT username, email, firstname FROM users WHERE lower(email) = $1 OR lower(username) = $1;", [req.body.reset.toLowerCase()], function(err, result) {
    		
	    	if (!err) {

	    		var data = result.rows[0];

	    		if (data)
	    		{
		    		pgClient.query("UPDATE users SET resetcode = $1, resetdate = $2 WHERE lower(email) = $3;", [resetcode, resetdate, data.email.toLowerCase()], function(err1, result1) {
		    			pgClient.end();

						var postmark = require("postmark")(utilities.getPostmark().apiKey);

						postmark.send({
							"From": utilities.getPostmark().from, 
							"To": data.email, 
							"Subject": "Password Reset QuickCast", 
							"TextBody": "Hi " + data.firstname + ",\n\nA request was made to reset your password, if you did not make this request please ignore this mail.\n\nFollow the link below to update your password\n\nhttp://quick.as/confirm-password/" + resetcode + "\n\nThanks for using QuickCast\n\nhttp://quickcast.io\nhttp://twitter.com/quickcast"
						});

		    		});
				}
	    	}
	    	else
	    	{
	    		pgClient.end();
	    	}

			res.render('reset-password', { posted: true });
			return;

		});

	}else{
		res.render('reset-password', { posted: false });
	}
	
};

exports.confirmNewPassword = function(req, res) {
	var resetcode = req.params.code;
	var updated = false;

	if (resetcode)
	{		
		var pgClient = new pg.Client(process.env.DATABASE_URL);
    	pgClient.connect();

    	pgClient.query("SELECT username, email, firstname, resetdate FROM users WHERE lower(resetcode) = $1 AND resetdate > $2;", [resetcode, new Date()], function(err, result) {

	    	if (err) {
	    		pgClient.end();
				res.render('404', 404);
				return;
	    	}

			var data = result.rows[0];

			if (!data)
			{
				res.render('404', 404);
				return;
			}

			if (req.body.reset)
			{	
				utilities.cryptPassword(req.body.reset,function(err,pwd){
					pgClient.query("UPDATE users SET password = $2, resetcode = '' WHERE lower(email) = $1;", [data.email, pwd], function(err1, result1) {
						updated = true;
						pgClient.end();
						res.render('confirm-new-password', { updated: updated });
						return;
					});
				});
			}
			else
			{
				res.render('confirm-new-password', { updated: updated });
				return;
			}			
		});

	}else{
		res.render('404', 404);
	}

};

// quick.as video
exports.video = function(req, res) {
	var video_entry = req.params.entry;

	var pgClient = new pg.Client(process.env.DATABASE_URL);
    pgClient.connect();

    // get the cast
    pgClient.query("SELECT casts.*, users.username FROM casts INNER JOIN users ON (casts.ownerid = users.userid) WHERE lower(casts.uniqueid) = $1 AND casts.published = true", [video_entry.toLowerCase()], function(err1, result1){
    
    	if (err1) {
    		pgClient.end();
			res.status(500);
			res.render('500', { error: err1 });
    		return;
    	}

		var data = result1.rows[0];

		if (data === undefined){
			pgClient.end();
			res.render('404', 404);
			return;
		}

		// get any tags
		pgClient.query("SELECT tags.name FROM casts_tags INNER JOIN tags ON (casts_tags.tagid = tags.tagid) WHERE casts_tags.castid = $1", [data.castid], function(err2, result2){
				
			pgClient.end();

			var tags = null;

			if (!err2 && result2.rowCount > 0){
				tags = result2.rows;
			}

			// log the views
			views.viewLog(video_entry, req, function(err3, r) {
				marked(data.description, markedOpts, function (err4, content) {
					if (err4) {
						content = "Error converting Markdown!";
					}

					var a = moment(data.created);
					var b = moment(new Date());

					var duration = moment(data.created).hours();

					var str = 'https://s3.amazonaws.com/quickcast/%s/%s/quickcast.%s';
					var strSmall = 'https://s3.amazonaws.com/quickcast/%s/%s/quickcast-small.%s';
					var fileCheck = '/%s/%s/quickcast.%s';
					var gifCheck = '/%s/%s/quickcast.gif';
					var strGif = 'https://s3.amazonaws.com/quickcast/%s/%s/quickcast.gif';

					var amazonDetails = utilities.getAmazonDetails();

					var s3 = require('aws2js').load('s3', amazonDetails.accessKeyId, amazonDetails.secretAccessKey)

					s3.setBucket(amazonDetails.destinationBucket);

					// Check that the last video to be encoded exists (in this case webm)
					// should consider handling this in the app flow and this would
					// negate the need for this check here
					s3.head(util.format(fileCheck, data.ownerid, data.castid, 'webm'), function (err5, s3res) {
						s3.head(util.format(gifCheck, data.ownerid, data.castid), function (err6, s3res1) {
							var processed = null;
							var gifexists = false;
							var gif = null;

							var bodyClass = "loading"

							if (err5 && err5.code === 404){
								processed = "processing";
								bodyClass = "";
							}
							else if (err5 && err5.statusCode != 200){
								processed = "failed";
								bodyClass = "";
							}

							if (!err6)
								gifexists = true;

						    res.render('video', {
						    	mp4small: util.format(strSmall, data.ownerid, data.castid, 'mp4'),
								mp4: util.format(str, data.ownerid, data.castid, 'mp4'),
								webm: util.format(str, data.ownerid, data.castid, 'webm'),
								body: content,
								views: data.views + r,
								title: data.name,
								username: data.username,
								when: a.from(b),
								processed: processed,
								id: data.castid,
								pageTitle: data.name,
								video_width: data.width,
								video_height: data.height,
								uniqueid: video_entry.toLowerCase(),
								tags: tags,
								video_intro: data.intro,
								video_outro: data.outro,
								gif: util.format(strGif, data.ownerid, data.castid),
								gifexists: gifexists,
								desc: utilities.stripHtml(content),
								img: util.format(str, data.ownerid, data.castid, 'jpg'),
								bodyClass: bodyClass
							});
						});
					});
				});
			});
		});
	});
};

// quick.as video emned (see above) - not logging views
exports.embed = function(req, res) {
	var video_entry = req.params.entry;

	var pgClient = new pg.Client(process.env.DATABASE_URL);
    pgClient.connect();

    pgClient.query("SELECT casts.*, users.username FROM casts INNER JOIN users ON (casts.ownerid = users.userid) WHERE lower(casts.uniqueid) = $1 AND casts.published = true", [video_entry.toLowerCase()], function(err1, result1){
		pgClient.end();

		if (err1){
			res.status(500);
			res.render('500', { error: err1 });
    		return;
		}

		var data = result1.rows[0];

		if (data === undefined){
			res.render('404', 404);
			return;
		}
			
		var a = moment(data.created);
		var b = moment(new Date());

		var duration = moment(data.created).hours();

		var str = 'https://s3.amazonaws.com/quickcast/%s/%s/quickcast.%s';
		var strSmall = 'https://s3.amazonaws.com/quickcast/%s/%s/quickcast-small.%s';
		var fileCheck = '/%s/%s/quickcast.%s';

		var amazonDetails = utilities.getAmazonDetails();

		var s3 = require('aws2js').load('s3', amazonDetails.accessKeyId, amazonDetails.secretAccessKey)

		s3.setBucket(amazonDetails.destinationBucket);

		s3.head(util.format(fileCheck, data.ownerid, data.castid, 'webm'), function (err3, s3res) {
			views.viewLog(video_entry, req, function(err4, logRes) {
				var processed = null;

				if (err3 && err3.code === 404){
					processed = "processing";
				}
				else if (err3 && err3.statusCode != 200){
					processed = "failed";
				}

			    res.render('embed', {
			    	mp4small: util.format(strSmall, data.ownerid, data.castid, 'mp4'),
					mp4: util.format(str, data.ownerid, data.castid, 'mp4'),
					webm: util.format(str, data.ownerid, data.castid, 'webm'),
					processed: processed,
					id: data.castid,
					video_width: data.width,
					video_height: data.height,
					uniqueid: video_entry.toLowerCase(),
					video_intro: data.intro,
					video_outro: data.outro
				});
			});
		});
	});
};

Date.prototype.addHours= function(h){
    this.setHours(this.getHours()+h);
    return this;
}