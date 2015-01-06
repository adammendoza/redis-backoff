
var assert = require('assert')

var client = require('then-redis').createClient('tcp://localhost')
var backoff = require('..')({
  client: client
})

before(function () {
  return client.del('backoff:a', 'backoff:b')
})

it('should work', function () {
  return backoff.check('a').then(function (remaining) {
    assert.equal(remaining, 0)
    return backoff.push('a', 'b')
  }).then(function () {
    return backoff.check('a')
  }).then(function (remaining) {
    assert(remaining > 900)
    assert(remaining <= 1001)
    return backoff.clear('a')
  }).then(function () {
    return backoff.check('b')
  }).then(function (remaining) {
    assert(remaining > 900)
    assert(remaining < 1000)
    return backoff.clear('b')
  }).then(function () {
    return backoff.check('b')
  }).then(function (remaining) {
    assert.equal(remaining, 0)
  })
})
