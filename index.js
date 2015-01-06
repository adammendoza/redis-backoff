
var Promise = require('native-or-bluebird')

module.exports = Backoff

function Backoff(options) {
  if (!(this instanceof Backoff)) return new Backoff(options)

  options = options || {}
  this.client = options.client
  this.backoff = options.backoff || calculateBackoffTime
  this.prefix = typeof options.prefix === 'string'
    ? options.prefix
    : 'backoff:'
  if (this.prefix && !/:$/.test(this.prefix)) this.prefix += ':'
}

/**
 * Add a prefix to all the keys.
 */

Backoff.prototype.addPrefix = function (key) {
  return this.prefix + key
}

/**
 * Check whether it's valid.
 * If valid, returns 0.
 * If invalid, returns the `ms` until it is valid, i.e. the "Retry-After" header.
 */

Backoff.prototype.check = function (keys) {
  if (!Array.isArray(keys)) keys = [].slice.call(arguments)
  var client = this.client
  var backoff = this.backoff
  return Promise.all(keys.map(this.addPrefix, this).map(function (key) {
    return client.lrange(key, 0, -1)
  })).then(function (lists) {
    var timeouts = lists.map(function (list) {
      if (!list || !list.length) return 0
      return backoff(list.length) - (Date.now() - parseInt(list[0]))
    }).concat(0)
    return Math.max.apply(null, timeouts)
  })
}

/**
 * Push a bad try to the following keys.
 */

Backoff.prototype.push = function (keys) {
  if (!Array.isArray(keys)) keys = [].slice.call(arguments)
  var client = this.client
  var date = Date.now()
  client.multi()
  keys.map(this.addPrefix, this).forEach(function (key) {
    client.lpush(key, date)
  })
  return client.exec()
}

/**
 * Clear keys from exponential backoff.
 */

Backoff.prototype.clear = function (keys) {
  if (!Array.isArray(keys)) keys = [].slice.call(arguments)
  keys = keys.map(this.addPrefix, this)
  var client = this.client
  return client.del.apply(client, keys)
}

/**
 * Calculate the backoff time of x tries in ms.
 */

function calculateBackoffTime(x) {
  if (!x) return 0
  return 1000 * Math.pow(2, x - 1)
}
