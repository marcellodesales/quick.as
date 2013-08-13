// this is currently a bit of a dumping ground for functions
// some of these could be re-thought and moved - some should be written as middleware
var bcrypt = require('bcrypt'), 
    jwt = require('jwt-simple'), 
    config = require('../config');

exports.stripHtml = function(str){
  if (str === undefined || str === null)
    return "QuickCast. Make. Publish. Share. 3 Minute Screencasts";
  
  return str.replace(/(<([^>]+)>)/ig,"");
}

// returns the postmark config
exports.getPostmark = function(){
  return config.postmark;
}

// returns the amazon config
exports.getAmazonDetails = function(){
  return config.amazon;
}

// returns an encoded token
exports.encodeToken = function(payload){
  return jwt.encode(payload, config.bcrypt.secret);
}

// returns an encrypted password
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

// compares an encrypted password
exports.comparePassword = function(password, userPassword, callback){
  bcrypt.compare(password, userPassword, function(err, isPasswordMatch){
    if (err) return callback(err);
    else return callback(null, isPasswordMatch);
  });
};

// validates an email
exports.validateEmail = function(email){
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(email);
};

// valiates a standard field
exports.validateField = function(str){
  if (str === "" || str === null || str === undefined)
    return false;
  else
    return true;
};