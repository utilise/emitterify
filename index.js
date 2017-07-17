var promise = require('utilise.promise')
  , def     = require('utilise.def')
  
module.exports = function emitterify(body) {
  body = body || {}
  def(body, 'emit', emit, 1)
  def(body, 'once', once, 1)
  def(body, 'off', off, 1)
  def(body, 'on', on, 1)
  body.on['*'] = []
  return body

  function emit(type, pm, filter) {
    var li = body.on[type.split('.')[0]] || []
    
    for (var i = 0; i < li.length; i++)
      if (!li[i].ns || !filter || filter(li[i].ns))
        call(li[i].once ? li.splice(i--, 1)[0] : li[i], pm)

    for (var i = 0; i < body.on['*'].length; i++)
      call(body.on['*'][i], [type, pm])

    return body
  }


  function call(cb, pm){
      cb.next             ? cb.next(pm) 
    : pm instanceof Array ? cb.apply(body, pm) 
                          : cb.call(body, pm) 
  }

  function on(type, cb, once) {
    var id = type.split('.')[0]
      , ns = type.split('.')[1]
      , li = body.on[id] = body.on[id] || []
      
    return !cb &&  ns ? (cb = body.on[id]['$'+ns]) ? cb : push(observable(body))
         : !cb && !ns ? push(observable(body))
         :  cb &&  ns ? push((remove(li, body.on[id]['$'+ns] || -1), cb))
         :  cb && !ns ? push(cb)
                      : false

    function push(cb){
      cb.once = once
      cb.type = type
      if (ns) body.on[id]['$'+(cb.ns = ns)] = cb
      li.push(cb)
      return cb.next ? cb : body
    }
  }

  function once(type, callback){
    return body.on(type, callback, true)
  }

  function remove(li, cb) {
    var i = li.length
    while (~--i) 
      if (cb == li[i] || cb == li[i].fn || !cb)
        li.splice(i, 1)
  }

  function off(type, cb) {
    remove((body.on[type] || []), cb)
    if (cb && cb.ns) delete li['$'+cb.ns]
  }

  function observable(parent, fn) {
    var o = promise()
    o.listeners = []
    o.parent = parent
    o.fn = fn
    o.i = 0
    Object.defineProperty(o, 'source', parent.emit 
      ? { value: o, writable: true }
      : { get: function(){ return parent.source } }
    )
    
    o.map = function(fn) {
      var n = observable(o, fn)
      o.listeners[o.listeners.push(function(d, i){ n.next(fn(d, i, n)) }) - 1].fn = fn
      return n
    }

    o.filter = function(fn) {
      var n = observable(o, fn)
      o.listeners[o.listeners.push(function(d, i){ fn(d, i, n) && n.next(d) }) - 1].fn = fn
      return n
    }

    o.reduce = function(fn, seed) {
      var n = observable(o, fn)
      o.listeners[o.listeners.push(function(d, i){ n.next(seed = fn(seed, d, i, n)) }) - 1].fn = fn
      return n
    }

    o.next = function(d) {
      o.resolve(d)
      o.listeners.map(function(fn){ fn(d, o.i) })
      o.i++
      return o
    }

    o.off = function(fn){
      return remove(o.listeners, fn), o
    }

    o.unsubscribe = function(){
      o.fn ? o.parent.off(o.fn) : o.parent.off(o.type, o)
      o.parent = o.source = undefined
      return o
    }

    return o

  }
}