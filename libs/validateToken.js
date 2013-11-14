var jwt = require('jwt-simple'),
    pg = require('pg');

// validates the app token - could be better as middleware
// should consider adding a date to the token and expiring based on this also
exports.validateToken = function(req, callback){
  var token = req.headers.token,
      response;

  if (token === undefined || token === null)
    return callback("Invalid token, authentication failed");

  var decoded = null;

  try{ decoded = jwt.decode(token, process.env.BCRYPT_SECRET); }catch(e){ return callback(e); }

  if (decoded === undefined || decoded === null)
    return callback("Invalid token, authentication failed");

  var pgClient = new pg.Client(process.env.DATABASE_URL);
  pgClient.connect();

  pgClient.query("SELECT * FROM users WHERE email = $1", [decoded.email], function(err, result) {
    pgClient.end();
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