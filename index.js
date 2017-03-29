const FNV = require("fnv").FNV;
const murmurHash3 = require("murmurhash3js");
const redis = require("redis");
const async = require("async");

let murmur3_Uint32 = (str) => {
  return murmurHash3.x86.hash32(str);
};

let fnv_Uint32 = (str) => {
  return new FNV().update(str).value() & 0x7fffffff;
};

let nthHash = (i, hashA, hashB, filterSize) => {
  return (hashA + i * hashB) % filterSize;
};

const BloomFilter = function (config) {
  config = config ? config : {};
  this.redisSize = Math.ceil(config['redisSize'] || 256); // in MegaBytes
  if (this.redisSize > 512 || this.redisSize < 0) // a redis string value can be at max 512 Megabytes in length!
    this.redisSize = 256;

  this.filterSize = this.redisSize * (1 << 20) * 8; // bits

  this.hashesNum = config['hashesNum'] || 16; // specifies the number of hashing functions

  this.db = config['db'] || 0; // redis db, default 0

  this.redisKey = config['redisKey'] || 'Node_Bloomfilter_Redis';

  this.redisClient = config['redisClient'] || redis.createClient(); // redis client

};

BloomFilter.prototype.init = function (options) {
  options = options ? options : {};
  const redisKey = options['redisKey'] || this.redisKey;
  const filterSize = options['filterSize'] || this.filterSize;

  return new Promise((resolve, reject) => {
    this.redisClient.select(this.db, () => {
      // first allocate memory in redis
      this.redisClient.setbit(redisKey, filterSize - 1, 0, (err, reply) => {
        if (!err) {
          resolve(reply);
        } else {
          reject(err);
        }
      });
    });
  });
};

BloomFilter.prototype.add = function (str, options) {
  options = options ? options : {};
  const redisKey = options['redisKey'] || this.redisKey;
  const filterSize = options['filterSize'] || this.filterSize;

  return new Promise((resolve, reject) => {
    let fnv_hash = fnv_Uint32(str);
    let murmur3_hash = murmur3_Uint32(str);

    let setTasks = [];

    for (let n = 0; n < this.hashesNum; n++) {
      let f = (asy_callback) => {
        this.redisClient.setbit(redisKey, nthHash(n, fnv_hash, murmur3_hash, filterSize), 1, (err, reply) => {
          asy_callback(err, reply.toString());
        });
      };
      setTasks.push(f);
    }

    async.parallel(setTasks, function (error, results) {
      if (!error)
        resolve(results);
      else
        reject(error);
    });
  });
};

BloomFilter.prototype.contains = function (str, options, callback) {
  options = options ? options : {};
  if (typeof options === "function") {
    callback = options;
    const redisKey = this.redisKey;
    const filterSize = this.filterSize;
  } else {
    const redisKey = options['redisKey'] || this.redisKey;
    const filterSize = options['filterSize'] || this.filterSize;
  }

  return new Promise((resolve, reject) => {
    let fnv_hash = fnv_Uint32(str);
    let murmur3_hash = murmur3_Uint32(str);

    let getTasks = [];

    for (let n = 0; n < this.hashesNum; n++) {
      let f = (asy_callback) => {
        this.redisClient.getbit(redisKey, nthHash(n, fnv_hash, murmur3_hash, filterSize), (err, reply) => {
          asy_callback(err, reply.toString());
        });
      };
      getTasks.push(f);
    }

    async.parallel(getTasks, function (error, results) {
      if (!error) {
        let possiblyContains = true;
        for (var i = 0; i < results.length; i++) {
          if (results[i] == '0')
            resolve(false);
        }
        resolve(true);
      } else
        reject(error);
    });
  });
};

module.exports = BloomFilter;
