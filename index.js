var err  = require('err')('emitterify')
  , keys = require('keys')
  , def  = require('def')
  , not  = require('not')
  
module.exports = function emitterify(body) {
  return def(body, 'on', on)
       , def(body, 'once', once)
       , def(body, 'emit', emit)
       , body

  function emit(type, param) {
    var ns = type.split('.')[1]
      , id = type.split('.')[0]
      , li = body.on[id] || []

    if (ns) return invoke(li, ns, param || body), body

    li.forEach(function (fn, i, a) { invoke(a, i, param || body) })

    keys(li)
      .filter(not(isFinite))
      .forEach(function(n){ invoke(li, n, param || body) })

    return body
  }

  function invoke(o, k, p){
    // console.log('invoking', o, k)
    if (!o[k]) return
    try { o[k](p) } catch(e) { err(e) }
    o[k].once && (isFinite(k) ? o.splice(k, 1) : delete o[k])
  }

  function on(type, callback) {
    var ns = type.split('.')[1]
      , id = type.split('.')[0]

    body.on[id] = body.on[id] || []
    return !callback && !ns ? (body.on[id])
         : !callback &&  ns ? (body.on[id][ns])
         :  ns              ? (body.on[id][ns] = callback, body)
                            : (body.on[id].push(callback), body)
  }

  function once(type, callback){
    return callback.once = true, body.on(type, callback), body
  }
}