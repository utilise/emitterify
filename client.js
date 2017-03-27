(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var promise = require('utilise.promise')
  , def     = require('utilise.def')
  
module.exports = function emitterify(body) {
  def(body, 'emit', emit, 1)
  def(body, 'once', once, 1)
  def(body, 'on', on, 1)
  body.on['*'] = []
  return body

  function emit(type, pm, filter) {
    var li = body.on[type.split('.')[0]] || []
    
    for (var i = 0; i < li.length; i++)
      if (!li[i].ns || !filter || filter(li[i].ns))
        call(li[i].once ? li.splice(i, 1)[0] : li[i], pm)

    for (var i = 0; i < body.on['*'].length; i++)
      call(body.on['*'][i], [type, pm])

    return body
  }

  function call(cb, pm){
      cb.next                                   ? cb.next(pm) 
    : pm && pm.length && typeof pm !== 'string' ? cb.apply(body, pm) 
                                                : cb.call(body, pm) 
  }

  function on(type, callback) {
    var cb = callback ? callback : observable()
      , id = type.split('.')[0]
      , li = body.on[id] = body.on[id] || []

    if ((cb.ns = type.split('.')[1]))
      for (var i = 0; i < li.length; i++)
        if (li[i].ns === cb.ns) 
          li.splice(i, 1)

    li.push(cb)
    return cb.next ? cb : body
  }

  function once(type, callback){
    return callback.once = true, body.on(type, callback)
  }

  function observable() {
    var o = promise()
    o.listeners = []
    
    o.map = function(fn) {
      var n = observable()
      o.listeners.push(function(v){ n.next(fn(v)) })
      return n
    }

    o.filter = function(fn) {
      var n = observable()
      o.listeners.push(function(v){ fn(v) && n.next(v) })
      return n
    }

    o.next = function(v) {
      o.resolve(v)
      o.listeners.map(function(fn){ fn(v) })
      return o
    }

    return o
  }
}
},{"utilise.def":2,"utilise.promise":4}],2:[function(require,module,exports){
var has = require('utilise.has')

module.exports = function def(o, p, v, w){
  if (o.host && o.host.nodeName) o = o.host
  if (p.name) v = p, p = p.name
  !has(o, p) && Object.defineProperty(o, p, { value: v, writable: w })
  return o[p]
}

},{"utilise.has":3}],3:[function(require,module,exports){
module.exports = function has(o, k) {
  return k in o
}
},{}],4:[function(require,module,exports){
promise.sync = promiseSync
promise.null = promiseNull
promise.noop = promiseNoop
promise.args = promiseArgs
module.exports = promise

function promise() {
  var resolve
    , reject
    , p = new Promise(function(res, rej){ 
        resolve = res, reject = rej
      })

  arguments.length && resolve(arguments[0])
  p.resolve = resolve
  p.reject  = reject
  return p
}

function promiseArgs(i){
  return function(){
    return promise(arguments[i])
  }
}

function promiseSync(arg){
  return function() {
    var a = arguments
      , o = { then: function(cb){ cb(a[arg]); return o } }
    return o
  }
}

function promiseNoop(){
  return promise()
}

function promiseNull(){
  return promise(null)
}
},{}]},{},[1]);
