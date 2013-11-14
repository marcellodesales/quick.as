var pg = require('pg');

// Just using basic session for now
exports.viewLog = function(video_entry, req, callback){

  var ip = req.headers["x-forwarded-for"];  
  
  if (ip === undefined || ip === null)
    ip = req.connection.remoteAddress;

  var entry = video_entry+"_"+ip;

  if (req.session && req.session.entry === entry)
    return callback(null, 0);

  req.session.entry = entry;

  var pgClient = new pg.Client(process.env.DATABASE_URL);
      pgClient.connect();

  pgClient.query("UPDATE casts SET views = views + $1 WHERE lower(casts.uniqueid) = $2", [1, video_entry])
    .on('end', function() {
      pgClient.end();
      return callback(null, 1);
    });
};