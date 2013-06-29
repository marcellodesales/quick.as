var bcrypt = require('bcrypt'), pg = require('pg'); 
var postgres = process.env.DATABASE_URL;// || "postgres://neilkinnish:neilkinnish527441@localhost/deko";

exports.cryptPassword = function(password, callback) {
  bcrypt.genSalt(10, function(err, salt) {
    if (err) return callback(err);
      else {
        bcrypt.hash(password, salt, function(err, hash) {
          return callback(err, hash);
        });
      }
  });
};

exports.comparePassword = function(password, userPassword, callback) {
  bcrypt.compare(password, userPassword, function(err, isPasswordMatch) {
    if (err) return callback(err);
    else return callback(null, isPasswordMatch);
  });
};

exports.validateEmail = function(email) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(email);
};

exports.validateTokenUser = function(email, callback) {
  var isValid = false;
  var client = new pg.Client(postgres);
  var response = {};

  client.connect();

  client.query("SELECT * FROM users WHERE email = $1", [email])
  .on('row', function(r) {
    isValid = true;
    response["user"] = r;
    //response.push({user: r});
  })
  .on('end', function(r) {
    client.end();
    //response.user.push({valid: isValid});
    response["valid"] = isValid;
    return callback && callback(null, response);
  });
};