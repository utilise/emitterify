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

    if (li.source) call(li.source, pm)

    return body
  }


  function call(cb, pm){
      cb.next             ? cb.next(pm) 
    : pm instanceof Array ? cb.apply(body, pm) 
                          : cb.call(body, pm) 
  }

  function on(type, cb) {
    var id = type.split('.')[0]
      , li = body.on[id] = body.on[id] || []
      , i = li.length

    if (!cb) return body.on[type].source || (body.on[type].source = observable())

    if ((cb.ns = type.split('.')[1]))
      while (~--i && li[i].ns === cb.ns)
        li.splice(i, 1)

    li.push(cb)
    return cb.next ? cb : body
  }

  function once(type, callback){
    (callback = callback || observable()).once = true
    return body.on(type, callback)
  }

  function off(type, cb) {
    var li = (body.on[type] || [])
      , i  = li.length

    if (cb && cb == li.source) 
      return delete li.source

    while (~--i && (cb == li[i] || !cb))
      li.splice(i, 1)
  }

  function observable() {
    var o = promise()
    o.listeners = []
    o.i = 0

    o.map = function(fn) {
      var n = observable()
      o.listeners.push(function(d, i){ n.next(fn(d, i, n)) })
      o.listeners[o.listeners.length - 1].fn = fn
      return n
    }

    o.filter = function(fn) {
      var n = observable()
      o.listeners.push(function(d, i){ fn(d, i, n) && n.next(d) })
      o.listeners[o.listeners.length - 1].fn = fn
      return n
    }

    o.reduce = function(fn, seed) {
      var n = observable()
      o.listeners.push(function(d, i){ n.next(seed = fn(seed, d, i, n)) })
      o.listeners[o.listeners.length - 1].fn = fn
      return n
    }

    o.next = function(d) {
      o.resolve(d)
      o.listeners.map(function(fn){ fn(d, o.i) })
      o.i++
      return o
    }

    o.off = function(fn){
      var i = o.listeners.length

      while (~--i && (fn == o.listeners[i].fn || !fn))
        o.listeners.splice(i, 1)
      return o
    }

    return o

  }
}