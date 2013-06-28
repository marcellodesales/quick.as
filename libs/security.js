var bcrypt = require('bcrypt'), pg = require('pg'); 
var postgres = process.env.DATABASE_URL || "postgres://neilkinnish:neilkinnish527441@localhost/deko";

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

  if(client.connection != null)
    client.connect();

  var query = client.query("SELECT * FROM users WHERE email = $1", [email]);

  query.on('error', function(err) {
    return callback(err);
  });

  query.on('row', function(r) {
      isValid = true;
  });

  query.on('end', function() {
    client.end();
    return callback(null, isValid);
  });
};