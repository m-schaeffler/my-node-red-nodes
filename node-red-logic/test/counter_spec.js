var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../counter.js");

describe( 'counter Node', function () {
    "use strict";

  beforeEach(function (done) {
      helper.startServer(done);
  });

  afterEach(function(done) {
      helper.unload().then(function() {
          helper.stopServer(done);
      });
  });

  it('should be loaded', function (done) {
    var flow = [{ id: "n1", type: "counter", name: "test" }];
    helper.load(node, flow, function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should forward numbers', function (done) {
    const numbers = [-1,0,1,12.345,-12.345,"-1","0","1","34.5","-34.5",true,false,null,"FooBar",NaN,undefined];
    var flow = [{ id: "n1", type: "counter", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.property('payload',numbers[c]);
          msg.should.have.property('count',++c);
          if( c === numbers.length )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      for( const i of numbers )
      {
        n1.receive({ payload: i });
      }
    });
  });

  it('should not forward invalid data', function (done) {
    var flow = [{ id: "n1", type: "counter", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',255);
          if( c === 1 && msg.payload === 255 )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      n1.receive({ invalid:true, payload: 12.345 });
      n1.receive({ invalid:true, payload: -12.345 });
      n1.receive({ invalid:true, payload: 0 });
      n1.receive({ payload: 255 });
    });
  });

  it('should have reset and query', function (done) {
    var flow = [{ id: "n1", type: "counter", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          switch( c )
          {
            case 1:
              msg.should.have.a.property('count',1);
              break;
            case 2:
              msg.should.have.a.property('count',2);
              break;
            case 3:
              msg.should.have.a.property('count',0);
              msg.should.not.have.a.property('reset');
              break;
            case 4:
              msg.should.have.a.property('count',1);
              break;
            case 5:
              msg.should.have.a.property('count',1);
              msg.should.have.a.property('query',true);
              break;
            case 6:
              msg.should.have.a.property('count',1);
              msg.should.have.a.property('topic','query');
              break;
            case 7:
              msg.should.have.a.property('count',0);
              msg.should.have.a.property('topic','init');
              done();
              break;
            default:
              done("extra message received");
          }
        }
        catch(err) {
          done(err);
        }
      });
      n1.receive({ payload: 12.345 });
      n1.receive({ payload: -12.345 });
      n1.receive({ reset: true });
      n1.receive({ payload: 255 });
      n1.receive({ query: true });
      n1.receive({ topic: "query" });
      n1.receive({ topic: "init" });
    });
  });

});
