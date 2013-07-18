var bcrypt = require('bcrypt'), 
    jwt = require('jwt-simple'),
    pg = require('pg'), 
    config = require('../config'),
    postgres = config.postgres.connection,
    redis = require('redis');

exports.getSecret = function(){
  return config.bcrypt.secret;
}

exports.getAmazonDetails = function(){
  return config.amazon;
}

exports.getDBConnection = function(){
   return config.postgres.connection;
}

exports.getRedisConfig = function(){
  var redisUrl = config.redis.url.split(':');
  var redisConfig = { host: redisUrl[0], port: redisUrl[1], password: config.redis.password };

  return redisConfig;
}

exports.encodeToken = function(payload){
  return jwt.encode(payload, this.getSecret());
}

exports.cryptPassword = function(password, callback){
  bcrypt.genSalt(10, function(err, salt){
    if (err) return callback(err);
      else {
        bcrypt.hash(password, salt, function(err, hash){
          return callback(err, hash);
        });
      }
  });
};

exports.comparePassword = function(password, userPassword, callback){
  bcrypt.compare(password, userPassword, function(err, isPasswordMatch){
    if (err) return callback(err);
    else return callback(null, isPasswordMatch);
  });
};

exports.validateEmail = function(email){
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(email);
};

exports.validateField = function(str){
  if (str === "" || str === null || str === undefined)
    return false;
  else
    return true;
};

exports.validateToken = function(req, callback){
  var token = req.headers.token,
      client = new pg.Client(postgres),
      response;

  if (token === undefined || token === null)
    return callback("Invalid token, authentication failed");

  var decoded = null;

  try{ decoded = jwt.decode(token, this.getSecret()); }catch(e){ return callback(e); }

  if (decoded === undefined || decoded === null)
    return callback("Invalid token, authentication failed");

  client.connect();

  client.query("SELECT * FROM users WHERE email = $1", [decoded.email], function(err, result) {
    client.end();
    if (err) return callback(err,null);
    if (result != undefined && result.rows){
      if (result.rows[0] === undefined)
        return callback("Invalid token, user not found");
      else
        return callback(null, { valid: true, user: result.rows[0] });
    }else{
      return callback("Invalid token, authentication failed");
    }
  });
};

// This needs more thought and time - possible race condition
exports.logViews = function(video_entry, req, callback){
  var redisConfig = this.getRedisConfig(),
      client = redis.createClient(redisConfig.port, redisConfig.host)
      ip = req.headers["x-forwarded-for"];

  client.auth(redisConfig.password);

  if (ip === undefined)
    ip = req.connection.remoteAddress;

  client.get(video_entry+"_"+ip, function(err, reply) {
    if (reply === null) {
      client.set(video_entry+"_"+ip, new Date());
      client.incr(video_entry);
    }
  });

  client.get(video_entry, function(err, reply) {
    if (reply === "20"){
      client.del(video_entry);
      client.keys(video_entry + "_*", function(err,replies) {
        client.del(replies);
        client.quit();
      });

      var pClient = new pg.Client(postgres);
      pClient.connect();

      pClient.query("UPDATE casts SET views = views + $1 WHERE castid = $2", [5, video_entry])
        .on('end', function() {
          pClient.end();
        });
    }
    else
      client.quit();

    var count = 0;

    if (reply != null)
      count = parseInt(reply);

    callback(null, count);
  });
};