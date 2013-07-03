var app = require("../server.js")
var request = require('supertest');
var assert  = require('assert');
var should  = require('should');

/*describe('Get /v1/users/list', function(){
    it('should respond 401',function(done){
        request(app)
        .get('/v1/users/list')
        .end(function(err, res){
          res.status.should.equal(401);
          done(err);
        });
    });
});*/

/*describe('Get /v1/users/list', function(){
    it('should respond json',function(done){
        request(app)
        .get('/v1/users/list')
        .set('Accept', 'application/json')
        .set('token', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImhlbGxvQG5laWxraW5uaXNoLmNvbSJ9.niqSfyyJBOK_ArST0JW2x43yyM5tDNcoubnsBxHxayc')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res){
          if (err) return done(err);
          done()
        });
    });
});*/

describe('Get /api/v1/users/userbytoken', function(){
    it('should respond json',function(done){
        request(app)
        .get('/api/v1/users/userbytoken')
        .set('Accept', 'application/json')
        .set('token', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImhlbGxvQG5laWxraW5uaXNoLmNvbSJ9.niqSfyyJBOK_ArST0JW2x43yyM5tDNcoubnsBxHxayc')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res){
          if (err) return done(err);
          done()
        });
    });
});

describe('Get /api/v1/users/signin no details', function(){
    it('should respond json',function(done){
        request(app)
        .post('/api/v1/users/signin')
        .expect(401)
        .expect('Content-Type', /json/)
        .end(function(err, res){
          if (err) return done(err);
          done()
        });
    });
});

describe('Get /api/v1/users/signin with details', function(){
    it('should respond json',function(done){
        request(app)
        .post('/api/v1/users/signin')
        .set('username', 'neil')
        .set('password', 'neil')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res){
          if (err) return done(err);
          done()
        });
    });
});

describe('Get /api/v1/users/signup no details', function(){
    it('should respond json',function(done){
        request(app)
        .post('/api/v1/users/signup')
        .expect(403)
        .expect('Content-Type', /json/)
        .end(function(err, res){
          if (err) return done(err);
          done()
        });
    });
});

describe('Get /api/v1/users/signup username + email in use', function(){
    it('should respond json',function(done){
        request(app)
        .post('/api/v1/users/signup')
        .set('username', 'neil')
        .set('email','hello@neilkinnish.com')
        .expect(403)
        .expect('Content-Type', /json/)
        .end(function(err, res){
          if (err) return done(err);
          res.text.should.include('Username already in use')
          res.text.should.include('Email already in use')
          done()
        });
    });
});

describe('Get /api/v1/users/signup username + email in use', function(){
    it('should respond json',function(done){
        request(app)
        .post('/api/v1/users/signup')
        .set('username', 'neil')
        .set('email','hello@neilkinnish.com')
        .expect(403)
        .expect('Content-Type', /json/)
        .end(function(err, res){
          if (err) return done(err);
          res.text.should.include('Username already in use')
          res.text.should.include('Email already in use')
          res.text.should.include('Firstname is required')
          res.text.should.include('Lastname is required')
          res.text.should.include('Password is required')
          done()
        });
    });
});
