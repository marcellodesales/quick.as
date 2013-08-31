var config = require('../config'),
    pg = require('pg'),
    redis = require('redis');

// Log views - initially to redis and then persisted to postgres
// General benefits of writing to redis before persisting to postgres
// - it's fast + much cheaper than writing to postgres
// - reduces database writes (postgres)
// - stops the same user / ip logging on refresh
// This is currently not a great implementation
// - relies on subsequent visits and limits to persist from redis to postgres
// Better approach would be if redis - postgres was handled automaticallu through invalidation or cron job
// potentiallty: https://github.com/ncb000gt/node-cron
// see below started implementing cron job
exports.viewLog = function(video_entry, req, callback){

  var ip = req.headers["x-forwarded-for"];  
  
  if (ip === undefined || ip === null)
    ip = req.connection.remoteAddress;

  if (ip === undefined || ip === null)
    return callback("Null IP sent");

  if (ip.length > 45)
    return callback("IP address incorrect length");

  if (video_entry.length > 50)
    return callback("QuickCast id incorrect length")

  var redisConfig = require("url").parse(config.redis.url),
      redisClient = redis.createClient(redisConfig.port, redisConfig.hostname);

  redisClient.auth(config.redis.password); 

  // Only log if user ip and this entry are not logged in redis
  redisClient.get(video_entry+"_"+ip, function(err, reply) {
    if (err) {
      redisClient.quit();
      return callback(err);
    }

    if (reply === null) {
      redisClient.set(video_entry+"_"+ip, new Date(), function(err1, reply2){
        if (!err1)
          redisClient.incr(video_entry);
      });
    }
  });

  // check the entries and persist to postgres if limits met
  redisClient.get(video_entry, function(err, reply) {
    if (err) {
      redisClient.quit();
      return callback(err);
    }

    // if 10 logs already then persist them to postgres
    if (reply >= "10"){
      redisClient.del(video_entry);
      redisClient.keys(video_entry + "_*", function(err2,replies) {
        if (err2) {
          redisClient.quit();
          return callback(err2);
        }
        redisClient.del(replies);
        redisClient.quit();
      });

      var pgClient = new pg.Client(config.postgres.connection);
      pgClient.connect();

      pgClient.query("UPDATE casts SET views = views + $1 WHERE lower(casts.uniqueid) = $2", [parseInt(reply), video_entry])
        .on('end', function() {
          pgClient.end();
        });
    }
    else
    {
      redisClient.quit();
    }

    var count = 0;

    if (reply != null)
      count = parseInt(reply);

    return callback(null, count);
  });
};

// Fire and forget - this will override some of the functionality above
/*exports.persistRedisLogsToPostgres = function(date){

  var current = new Date();
  console.log("original: " + date);

  var newDateObj = new Date(date.getTime() + 2*60000); // + 10 mins

  console.log("current: " + current);

  if (current.getTime() > newDateObj.getTime())
  {
    console.log("greater than yes");
  }
  else
  {
    console.log("no");
  }

  var redisConfig = this.getRedisConfig(),
      client = redis.createClient(redisConfig.port, redisConfig.host);

  client.auth(redisConfig.password);

  client.keys('*', function (keys) { 
    for (key in keys) { 
      console.log(key); 
    } 
  });

  client.keys(video_entry + "_*", function(err, replies) {
    replies.forEach(function (reply, i) {
      console.log("    " + i + ": " + reply);
    });
  });

};*/