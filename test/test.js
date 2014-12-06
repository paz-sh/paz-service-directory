  'use strict';

/* eslint-disable no-unused-expressions */

var Lab = require('lab');
var supertest = require('supertest');
var fixtures = require('./fixtures/services.json');

var host = process.env.DOCKER_IP || 'localhost';
var svcDirPort = process.env.SVCDIR_PORT || 9001;
var svcDirPath = ['http://', host, ':', svcDirPort].join('');

var lab = exports.lab = Lab.script();
var expect = Lab.expect;
var svcDir = supertest(svcDirPath);
var service = fixtures['my-service'];

lab.experiment('Service Directory', function() {
  lab.afterEach(function(done) {
    svcDir
      .del('/services/my-service')
      .end(function(err) {
        if (err) {
          return done(err);
        }

        done();
      });
  });

  lab.test('creates a new service successfully', function(done) {
    svcDir
      .post('/services')
      .set('Content-Type', 'application/json')
      .send(service)
      .expect('Content-Type', 'application/json')
      .expect(201)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }
        var doc = res.body.doc;

        expect(doc.name).to.equal('my-service');

        done();
      });
  });

  lab.test('creates a new service and the config is correct', function(done) {
    svcDir
      .post('/services')
      .set('Content-Type', 'application/json')
      .send(service)
      .expect('Content-Type', 'application/json')
      .expect(201)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }

        var config = res.body.doc.config;

        expect(config.publicFacing).to.equal(service.publicFacing);
        expect(config.numInstances).to.equal(service.numInstances);
        expect(config.ports).to.be.instanceOf(Array);
        expect(config.ports[0].container).to.equal(service.ports[0].container);
        expect(config.env).to.be.instanceOf(Object);
        expect(config.env.suchKey).to.equal(service.env.suchKey);

        done();
      });
  });

  lab.test('returns 404 when fetching a non-existant service', function(done) {
    svcDir
      .get('/services/non-existent-service')
      .expect(404)
      .end(function(err) {
        if (err) {
          return done(err);
        }

        done();
      });
  });

  lab.test('fetches a created service', function(done) {
    svcDir
      .post('/services')
      .send(service)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .end(function(err) {
        if (err) {
          return done(err);
        }

        svcDir
          .get('/services/my-service')
          .expect('Content-Type', 'application/json')
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }

            var config = res.body.doc.config;

            expect(config.publicFacing).to.equal(service.publicFacing);
            expect(config.numInstances).to.equal(service.numInstances);
            expect(config.ports).to.be.instanceOf(Array);
            expect(config.ports[0].container).to.equal(service.ports[0].container);
            expect(config.env).to.be.instanceOf(Object);
            expect(config.env.suchKey).to.equal(service.env.suchKey);

            done();

          });
      });
  });

  lab.test('fetches a service by lookup on dockerRepository', function(done) {
    svcDir
      .post('/services')
      .send(service)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .end(function(err) {
        if (err) {
          return done(err);
        }

        // now fetch it
        svcDir
          .get('/services?dockerRepository=' + encodeURIComponent(service.dockerRepository))
          .expect('Content-Type', 'application/json')
          .expect(200)
          .end(function(err, res) {
            if (err) {
              done(err);
            }

            var doc = res.body.doc;

            expect(doc.name).to.equal('my-service');

            done();
          });
      });
  });

  lab.test('successfully lists services', function(done) {
    svcDir
      .get('/services')
      .expect(200)
      .end(function(err, res) {

        if (err) {
          return done(err);
        }

        expect(res.body.doc).to.be.instanceOf(Array);

        done();
      });
  });

  lab.test('successfully modifies a created service\'s config', function(done) {
    svcDir
      .post('/services')
      .send(service)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .end(function(err) {
        if (err) {
          return done(err);
        }

        svcDir
          .patch('/services/my-service/config')
          .send({
            publicFacing: false,
            numInstances: 5
          })
        .expect('Content-Type', 'application/json')
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }

            var doc = res.body.doc;

            expect(doc.publicFacing).to.be.false;
            expect(doc.numInstances).to.equal(5);

            done();
          });
      });
  });
});
