const BloomFilter = require('./index');
const redis = require("redis");

//all params have a default value, and I choose some to present below
let bf = new BloomFilter({
  redisSize: 16, // this will create a string value which is 16 MegaBytes in length
  hashesNum: 8, // how many hash functions do we use
  redisKey: 'test', //this will create a string which keyname is `test`
  redisClient: redis.createClient(), //you can choose to create the client by yourself
});

promise = bf.init(); // this will allocate memory in redis.For details https://redis.io/commands/setbit

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


/* or for an easier way, use promise.all() */

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
