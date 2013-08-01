var app = require("../server.js")
var request = require('supertest');
var assert  = require('assert');
var should  = require('should');

// Disabled for go live

/*describe('Put /api/v1/users/setup success', function(){
    it('should drop and rebuild postgres and return json',function(done){
        request(app)
        .get('/api/v1/users/setup')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res){
          if (err) return done(err);
          done()
        });
    });
});*/