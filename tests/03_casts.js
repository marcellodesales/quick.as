var app = require("../server.js")
var request = require('supertest');
var assert  = require('assert');
var should  = require('should');

/*describe('Put /api/v1/casts/publish', function(){
    it('should respond json',function(done){
        request(app)
        .put('/api/v1/casts/publish')
        .set('Accept', 'application/json')
        .set('token', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImhlbGxvQG5laWxraW5uaXNoLmNvbSJ9.niqSfyyJBOK_ArST0JW2x43yyM5tDNcoubnsBxHxayc')
        .set('description','test')
        .set('name','test')
        .set('intro','test')
        .set('outro','test')
        .set('tags','test,testing')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res){
          if (err) return done(err);
          done()
        });
    });
});

describe('Put /api/v1/casts/publish/complete', function(){
    it('should respond json',function(done){
        request(app)
        .put('/api/v1/casts/publish/complete')
        .set('Accept', 'application/json')
        .set('token', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImhlbGxvQG5laWxraW5uaXNoLmNvbSJ9.niqSfyyJBOK_ArST0JW2x43yyM5tDNcoubnsBxHxayc')
        .set('castid',1)
        .set('length',123.00)
        .set('size',123.00)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res){
          if (err) return done(err);
          done()
        });
    });
});*/