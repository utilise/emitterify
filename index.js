var err  = require('err')('emitterify')
  , def  = require('def')

module.exports = function emitterify(body) {
  return def(body, 'on', on)
       , def(body, 'once', once)
       , def(body, 'emit', emit)
       , body

  function emit(type, param) {
    var ns = type.split('.')[1]
      , id = type.split('.')[0]

    if (ns) {
      if (!body.on[id][ns]) return body
      body.on[id][ns](param || body)
      body.on[id][ns].once && delete body.on[id][ns]
      return body
    }

    (body.on[id] || []).forEach(function (d,i,a) {
      try {
        (d.once ? a.splice(i, 1).pop() : d)(param || body)
      } catch(e) { err(e) }
    })

    return body
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