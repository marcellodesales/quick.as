// this is currently a bit of a dumping ground for functions
// some of these could be re-thought and moved - some should be written as middleware
var bcrypt = require('bcrypt'), 
    jwt = require('jwt-simple');

exports.stripHtml = function(str){
  if (str === undefined || str === null)
    return "QuickCast. Make. Publish. Share. 3 Minute Screencasts";
  
  return str.replace(/(<([^>]+)>)/ig,"");
}

// returns the postmark config
exports.getPostmark = function(){
  var postmark = {};
  postmark.apiKey = process.env.POSTMARK_API_KEY;
  postmark.from = process.env.POSTMARK_FROM;
  return postmark;
}

// returns the amazon config
exports.getAmazonDetails = function(){
  var amazon = {};
  amazon.accessKeyId = process.env.AWS_KEY;
  amazon.secretAccessKey = process.env.AWS_SECRET;
  amazon.region = process.env.AWS_REGION;
  amazon.sourceBucket = process.env.AWS_BUCKET_SOURCE;
  amazon.destinationBucket = process.env.AWS_BUCKET;
  amazon.pipelineId = process.env.AWS_PIPELINE_ID;
  amazon.webM = process.env.AWS_WEBM;
  amazon.mp4 = process.env.AWS_MP4;
  amazon.mp4small = process.env.AWS_MP4SMALL;
  return amazon;
}

// returns an encoded token
exports.encodeToken = function(payload){
  return jwt.encode(payload, process.env.BCRYPT_SECRET);
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