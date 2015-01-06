
# redis-backoff

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Dependency Status][david-image]][david-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]
[![Gittip][gittip-image]][gittip-url]

Exponential backoff using redis.
Designed specifically for passwords.

## Example

```js
var backoff = require('redis-backoff')({
  client: require('then-redis').createClient('tcp://localhost')
});

app.use(function* (next) {
  var credentials = yield parse(this);

  var username = credentials.username;

  // keys to limit against
  var keys = [
    username, // limit by the username
    this.ip, // limit by the ip
  ];

  // tell the client it needs to wait
  var retryAfter = yield backoff.check(keys);
  if (retryAFter) {
    this.status = 403;
    this.response.set('Retry-After', Math.ceil(retryAfter / 1000));
    return;
  }

  var password = credentials.password;

  var user = yield User.getByUsername(username);
  var valid = yield User.checkPassword(user, password);

  if (!valid) {
    // give a bad response and push and remember this bad try
    yield backoff.push(keys);
    this.status = 400;
    return;
  }

  // if the password is valid, clear the retries
  yield backoff.clear(keys)
  this.status = 200; // log the user in or something
})
```

## API

### var backoff = new Backoff(options)

- `client` - a `then-redis` client
- `backoff` - a custom backoff function of the form `#retries -> millisecond timeout`.

### backoff.check(keys).then( retryAfter => )

Checks all the keys whether to backoff.
Returns the time to wait in milliseconds.

### backoff.push(keys).then( => )

Add a bad try to all the keys.
The lock period starts from the current time.

### backoff.clear(keys).then( => )

Clear all retries from the keys.

[gitter-image]: https://badges.gitter.im/jonathanong/redis-backoff.png
[gitter-url]: https://gitter.im/jonathanong/redis-backoff
[npm-image]: https://img.shields.io/npm/v/redis-backoff.svg?style=flat-square
[npm-url]: https://npmjs.org/package/redis-backoff
[github-tag]: http://img.shields.io/github/tag/jonathanong/redis-backoff.svg?style=flat-square
[github-url]: https://github.com/jonathanong/redis-backoff/tags
[travis-image]: https://img.shields.io/travis/jonathanong/redis-backoff.svg?style=flat-square
[travis-url]: https://travis-ci.org/jonathanong/redis-backoff
[coveralls-image]: https://img.shields.io/coveralls/jonathanong/redis-backoff.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/jonathanong/redis-backoff
[david-image]: http://img.shields.io/david/jonathanong/redis-backoff.svg?style=flat-square
[david-url]: https://david-dm.org/jonathanong/redis-backoff
[license-image]: http://img.shields.io/npm/l/redis-backoff.svg?style=flat-square
[license-url]: LICENSE
[downloads-image]: http://img.shields.io/npm/dm/redis-backoff.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/redis-backoff
[gittip-image]: https://img.shields.io/gratipay/jonathanong.svg?style=flat-square
[gittip-url]: https://gratipay.com/jonathanong/
