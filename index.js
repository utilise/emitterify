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
    body.on[type] = body.on[type] || []
    if (!callback) return body.on[type]
    if (~body.on[type].indexOf(callback)) return body
    return body.on[type].push(callback), body
  }

  function once(type, callback){
    return callback.once = true, body.on(type, callback), body
  }
}
