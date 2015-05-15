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
        (d.once ? a.splice(i, 1).pop().fn : d.fn)(param || this)
      } catch(e) { err(e) }
    })
  }

  function on(type, callback, opts) {
    opts = opts || {}
    opts.fn = callback
    body.on[type] = body.on[type] || []
    body.on[type].push(opts)
    return body
  }

  function once(type, callback){
    return body.on(type, callback, { once: true }), body
  }
}
