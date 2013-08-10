var utilities = require('./libs/utilities'),
	pg = require('pg'), 
    postgres = utilities.getDBConnection(),
    marked = require('marked'),
    moment = require('moment'),
    util = require('util');

// Marked (markdown) settings
markedOpts = {
	gfm: true,
	/*highlight: function (code, lang, callback) {
		pygmentize({ lang: lang, format: 'html' }, code, function (err, result) {
			callback(err, result.toString());
		});
	},*/
	tables: true,
	breaks: false,
	pedantic: false,
	sanitize: true,
	smartLists: true,
	smartypants: false,
	langPrefix: 'lang-'
}