var utilities = require('./libs/utilities'),
	pg = require('pg'), 
    postgres = utilities.getDBConnection(),
    marked = require('marked'),
    moment = require('moment'),
    util = require('util');

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

// Request password reset
exports.resetPassword = function(req, res) {
	
	if (req.body != null)
	{

	}

	res.render('reset-password');
};

// Confirm new password
exports.confirmNewPassword = function(req, res) {
	
	if (req.body != null)
	{
		
	}

	res.render('new-password');
};