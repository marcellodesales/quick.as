exports.index = function(req, res) {
	res.render('api/index', {
		title: 'Index'
	});
};