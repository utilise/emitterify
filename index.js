var err = require('err')('emitterify')
  , def = require('def')

module.exports = function emitterify(body) {
  return def(body, 'on', on)
       , def(body, 'once', once)
       , def(body, 'emit', emit)
       , body

  function emit(type, param) {
    (body.on[type] || []).forEach(function (d,i,a) {
      try {
        (d.once ? a.splice(i, 1).pop() : d)(param || body)
      } catch(e) { err(e) }
    })
  }

  function on(type, callback) {
    if (!callback) return body.on[type]
    body.on[type] = body.on[type] || []
    body.on[type].push(callback)
    return body
  }

  function once(type, callback){
    return callback.once = true, body.on(type, callback), body
  }
}
