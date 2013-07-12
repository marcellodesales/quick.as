var bcrypt = require('bcrypt'), 
    jwt = require('jwt-simple'),
    pg = require('pg'), 
    postgres = process.env.DATABASE_URL,
    config = require('../config');

exports.getSecret = function(){
  return config.bcrypt.secret;
}

exports.getAmazonDetails = function(){
  return config.amazon;
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

  client.connect();

  if (token === undefined)
    return callback("Invalid token, authentication failed");

  var decoded = jwt.decode(token, this.getSecret());

  client.query("SELECT * FROM users WHERE email = $1", [decoded.email], function(err, result) {
    if (err) return callback(err);
    client.end();
    if (result != undefined && result.rowCount > 1)
      return callback(null, { valid: true, user: result.rows[0] });
    else  
      return callback("Invalid token, authentication failed");
  });
};