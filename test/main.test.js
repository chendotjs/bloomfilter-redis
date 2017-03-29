const BloomFilter = require('../index');
const redis = require('redis');
const should = require('should');

let bf = new BloomFilter();

describe('bloomfilter-redis', function() {
  let client = null;
  let promise = null;
  beforeEach(function() {
    client = redis.createClient();
    promise = bf.init();
    return promise;
  });

  it('should have a string named "Node_Bloomfilter_Redis" in redis', function() {
    client.strlen('Node_Bloomfilter_Redis', function(err, res) {
      let length = parseInt(res);
      length.should.not.be.equal(0);
      length.should.be.above(Math.pow(2, 31));
    })
  });

  it('should be able to add && contains', function() {
    promise.then(() => {
        return bf.add('abc');
      })
      .then(() => {
        return bf.add('hello');
      })
      .then(() => {
        return bf.add('world');
      })
      .then(() => {
        return bf.add('nihao');
      })
      .then(() => {
        return bf.contains('hola');
      })
      .then((result) => {
        result.should.be.equal(false);
      })
      .then(() => {
        return bf.contains('hello');
      })
      .then((result) => {
        result.should.be.equal(true);
      }).catch(function(err) {
        console.error(err);
      });
  });
});
