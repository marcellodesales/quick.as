var app = require("../server.js")
var request = require('supertest');
var assert  = require('assert');
var should  = require('should');

// Disabled for go live

/*describe('Put /api/v1/users/signup no details', function(){
    it('should 403 and respond json',function(done){
        request(app)
        .put('/api/v1/users/signup')
        .expect(403)
        .expect('Content-Type', /json/)
        .end(function(err, res){
          if (err) return done(err);
          done()
        });
    });
});

describe('Put /api/v1/users/signup success', function(){
    it('should 200 and respond json',function(done){
        request(app)
        .put('/api/v1/users/signup')
        .set('username', 'neil')
        .set('email','hello@neilkinnish.com')
        .set('password','neil')
        .set('firstname','Neil')
        .set('lastname','Kinnish')
        .set('mailinglist', false)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res){
          if (err) return done(err);
          done()
        });
    });
});

describe('Put /api/v1/users/signup missing details', function(){
    it('should 403 and respond respond json',function(done){
        request(app)
        .put('/api/v1/users/signup')
        .set('username', 'neil')
        .set('email','hello@neilkinnish.com')
        .expect(403)
        .expect('Content-Type', /json/)
        .end(function(err, res){
          if (err) return done(err);
          res.text.should.include('Firstname is required')
          res.text.should.include('Lastname is required')
          res.text.should.include('Password is required')
          done()
        });
    });
});

describe('Put /api/v1/users/signup email (in use)', function(){
    it('should 403 and respond json',function(done){
        request(app)
        .put('/api/v1/users/signup')
        .set('username', 'neil1')
        .set('email','hello@neilkinnish.com')
        .set('firstname','Neil')
        .set('lastname','Kinnish')
        .set('password','neil')
        .expect(403)
        .expect('Content-Type', /json/)
        .end(function(err, res){
          if (err) return done(err);
          res.text.should.include('Email already in use')
          done()
        });
    });
});

describe('Put /api/v1/users/signup username (in use)', function(){
    it('should 403 and respond json',function(done){
        request(app)
        .put('/api/v1/users/signup')
        .set('username', 'neil')
        .set('email','hello@neilkinnish1.com')
        .set('firstname','Neil')
        .set('lastname','Kinnish')
        .set('password','neil')
        .expect(403)
        .expect('Content-Type', /json/)
        .end(function(err, res){
          if (err) return done(err);
          res.text.should.include('Username already in use')
          done()
        });
    });
});

describe('Get /api/v1/users/userbytoken valid token', function(){
    it('should 200 and respond json',function(done){
        request(app)
        .get('/api/v1/users/userbytoken')
        .set('Accept', 'application/json')
        .set('token', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImhlbGxvQG5laWxraW5uaXNoLmNvbSJ9.niqSfyyJBOK_ArST0JW2x43yyM5tDNcoubnsBxHxayc')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res){
          if (err) return done(err);
          res.text.should.include('hello@neilkinnish.com')
          done()
        });
    });
});

describe('Get /api/v1/users/userbytoken invalid token', function(){
    it('should 401 and respond json',function(done){
        request(app)
        .get('/api/v1/users/userbytoken')
        .set('Accept', 'application/json')
        .set('token', 'eyJ0ArST0JW2x43yyM5tDNcoubnsBxHxayc')
        .expect(401)
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

describe('Get /api/v1/users/signin incorrect details', function(){
    it('should respond json',function(done){
        request(app)
        .post('/api/v1/users/signin')
        .set('username', 'test')
        .set('password', 'test')
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

describe('Get /api/v1/users/usercasts top 10 casts', function(){
    it('should respond json',function(done){
        request(app)
        .get('/api/v1/users/usercasts')
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