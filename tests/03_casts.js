var app = require("../server.js")
var request = require('supertest');
var assert  = require('assert');
var should  = require('should');

/*describe('Put /api/v1/casts/publish', function(){
    it('should respond 200 json',function(done){
        request(app)
        .put('/api/v1/casts/publish')
        .set('Accept', 'application/json')
        .set('token', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImhlbGxvQG5laWxraW5uaXNoLmNvbSJ9.niqSfyyJBOK_ArST0JW2x43yyM5tDNcoubnsBxHxayc')
        .set('description','')
        .set('name','')
        .set('intro','')
        .set('outro','')
        .set('tags','')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res){
          if (err) return done(err);
          done()
        });
    });
});

describe('Post /api/v1/casts/publish/update', function(){
    it('should respond 200 json',function(done){
        request(app)
        .post('/api/v1/casts/publish', { 
            description: 'test',
            name: 'test',
            intro: 'test',
            outro: 'test',
            tags: 'test,testing',
            castid: 1
        })
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

describe('Put /api/v1/casts/publish/complete', function(){
    it('should respond 200 json',function(done){
        request(app)
        .put('/api/v1/casts/publish/complete')
        .set('Accept', 'application/json')
        .set('token', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImhlbGxvQG5laWxraW5uaXNoLmNvbSJ9.niqSfyyJBOK_ArST0JW2x43yyM5tDNcoubnsBxHxayc')
        .set('castid',1)
        .set('length',123.00)
        .set('size',123.00)
        .set('width',123)
        .set('height',123)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res){
          if (err) return done(err);
          done()
        });
    });
});*/