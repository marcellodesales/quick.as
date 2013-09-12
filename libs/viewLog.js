var config = require('../config'),
    pg = require('pg'),

// This is a simple fix as having so many issues with redis
exports.viewLog = function(video_entry, req, callback){

  var ip = req.headers["x-forwarded-for"];  
  
  if (ip === undefined || ip === null)
    ip = req.connection.remoteAddress;

  var entry = video_entry+"_"+ip;

  if (req.session.entry === entry)
    return callback(null, 0);

  var pgClient = new pg.Client(config.postgres.connection);
      pgClient.connect();

  pgClient.query("UPDATE casts SET views = views + $1 WHERE lower(casts.uniqueid) = $2", [1, video_entry])
    .on('end', function() {
      pgClient.end();
      return callback(null, 1);
    });
};