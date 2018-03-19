# bloomfilter-redis

[![Linux Build Status](https://travis-ci.org/chendotjs/bloomfilter-redis.svg?branch=master)](https://travis-ci.org/chendotjs/bloomfilter-redis) [![Windows Build Status](https://ci.appveyor.com/api/projects/status/osb7bfpfjrlutkeu/branch/master?svg=true)](https://ci.appveyor.com/project/chendotjs/bloomfilter-redis/branch/master)


Bloomfilter-redis is a node.js package implementing bloom filter using redis as backend. 🚢

## Features
- use 32bit `murmur3` and ` FNV-1a` for [double hashing](https://en.wikipedia.org/wiki/Double_hashing)

- depends on [`redis`](https://www.npmjs.com/package/redis) package

- you specify the filter size in redis, up to 512MB

## Requirements

- Redis-server installed and running
- Node.js >= 6


## Install

```
npm install bloomfilter-redis
```

## Usage Example

```javascript
const BloomFilter = require('bloomfilter-redis');
const redis = require("redis");

const bf = new BloomFilter({//all params have a default value, and I choose some to present below
  redisSize: 256, // this will create a string value which is 16 MegaBytes in length
  hashesNum: 16, // how many hash functions do we use
  redisKey: 'Node_Bloomfilter_Redis', // this will create a string which keyname is `Node_Bloomfilter_Redis`
  redisClient: redis.createClient(), // you can choose to create the client by yourself
});

promise = bf.init(); // invokes `SETBIT` to allocate memory in redis.For details https://redis.io/commands/setbit

promise.then(() => {
    return bf.add('abc'); // add "abc"
  })
  .then(() => {
    return bf.add('hello'); // add "hello"
  })
  .then(() => {
    return bf.add('world'); // add "world"
  })
  .then(() => {
    return bf.add('nihao'); // add "nihao"
  })
  .then(() => {
    return bf.contains('hola');
  })
  .then((result) => {
    console.log(`"hola" in the set? ${result}`); // "hola" in the set? false
  })
  .then(() => {
    return bf.contains('hello');
  })
  .then((result) => {
    console.log(`"hello" in the set? ${result}`); // "hello" in the set? true
  }).catch(function(err) {
    console.error(err);
  });

```
Or for an easier way, use promise.all()

```javascript
const BloomFilter = require('bloomfilter-redis');
const redis = require("redis");

const bf = new BloomFilter();

promise = bf.init();
// both array has `I love you`
arr = ['我爱你', 'I love you', 'je t\'aime', 'ich liebe dich', 'Ti Amo', 'te amo vos amo'];
testArr = ['사랑해요', 'I love you', '爱してる'];

promiseAddArr = [];
promiseContainsArr = [];


arr.forEach(str => {
  promiseAddArr.push(bf.add(str)); // assembly add tasks
});

testArr.forEach(str => {
  promiseContainsArr.push(bf.contains(str)); // assembly contains tasks
});

//lauch!
Promise.all(promiseAddArr).then(() => {
  Promise.all(promiseContainsArr).then(results => {
    console.log(results); // [ false, true, false ]. Yeah, that's the right answer
  })
});

```

### Note
- `BloomFilter.init`,`BloomFilter.add` and `BloomFilter.contains` all returns a Promise.

- As there are various options when creating a redis-client using `redis.createClient` method, it may be a good choice to let users create the redis-client by themselves. Pass the redis-client as a parameter when contructing `BloomFilter`.


## Why choose 32bit hash
- we use redis string as the filter.

- [A redis string value can be at max 512 Megabytes in length](https://redis.io/topics/data-types), that is totally `512*2^20*8` bits.

- Javascript does not support 64bit integer calculations.

- 32bit hash is suffient.


## LICENCE

MIT
