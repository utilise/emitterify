var emitterify = (function () {
'use strict';

var index$2 = promise;

function promise() {
  var resolve
    , reject
    , p = new Promise(function(res, rej){ 
        resolve = res, reject = rej;
      });

  arguments.length && resolve(arguments[0]);
  p.resolve = resolve;
  p.reject  = reject;
  return p
}

var index$4 = function flatten(p,v){ 
  if (v instanceof Array) v = v.reduce(flatten, []);
  return (p = p || []), p.concat(v) 
};

var index$8 = function has(o, k) {
  return k in o
};

var index$6 = function def(o, p, v, w){
  if (o.host && o.host.nodeName) o = o.host;
  if (p.name) v = p, p = p.name;
  !index$8(o, p) && Object.defineProperty(o, p, { value: v, writable: w });
  return o[p]
};

var index = function emitterify(body) {
  body = body || {};
  index$6(body, 'emit', emit, 1);
  index$6(body, 'once', once, 1);
  index$6(body, 'off', off, 1);
  index$6(body, 'on', on, 1);
  body.on['*'] = body.on['*'] || [];
  return body

  function emit(type, pm, filter) {
    var li = body.on[type.split('.')[0]] || []
      , results = [];

    for (var i = 0; i < li.length; i++)
      if (!li[i].ns || !filter || filter(li[i].ns))
        results.push(call(li[i].isOnce ? li.splice(i--, 1)[0] : li[i], pm));

    for (var i = 0; i < body.on['*'].length; i++)
      results.push(call(body.on['*'][i], [type, pm]));

    return results.reduce(index$4, [])
  }

  function call(cb, pm){
    return cb.next             ? cb.next(pm) 
         : pm instanceof Array ? cb.apply(body, pm) 
                               : cb.call(body, pm) 
  }

  function on(type, opts, isOnce) {
    var id = type.split('.')[0]
      , ns = type.split('.')[1]
      , li = body.on[id] = body.on[id] || []
      , cb = typeof opts == 'function' ? opts : 0;

    return !cb &&  ns ? (cb = body.on[id]['$'+ns]) ? cb : push(observable(body, opts))
         : !cb && !ns ? push(observable(body, opts))
         :  cb &&  ns ? push((remove(li, body.on[id]['$'+ns] || -1), cb))
         :  cb && !ns ? push(cb)
                      : false

    function push(cb){
      cb.isOnce = isOnce;
      cb.type = id;
      if (ns) body.on[id]['$'+(cb.ns = ns)] = cb;
      li.push(cb);
      return cb.next ? cb : body
    }
  }

  function once(type, callback){
    return body.on(type, callback, true)
  }

  function remove(li, cb) {
    var i = li.length;
    while (~--i) 
      if (cb == li[i] || cb == li[i].fn || !cb)
        li.splice(i, 1);
  }

  function off(type, cb) {
    remove((body.on[type] || []), cb);
    if (cb && cb.ns) delete body.on[type]['$'+cb.ns];
    return body
  }

  function observable(parent, opts) {
    opts = opts || {};
    var o = emitterify(opts.base || index$2());
    o.i = 0;
    o.li = [];
    o.fn = opts.fn;
    o.recv = opts.recv;
    o.parent = parent;
    o.source = opts.recv ? o.parent.source : o;
    
    o.map = function(fn) {
      var n = observable(o, { fn: fn, recv: function(d){ return n.next(fn(d, n.i++, n)) } });
      o.li.push(n);
      return n
    };

    o.filter = function(fn) {
      var n = observable(o, { fn: fn, recv: function(d){ return fn(d, n.i++, n) && n.next(d) } });
      o.li.push(n);
      return n
    };

    o.reduce = function(fn, seed) {
      var n = observable(o, { fn: fn, recv: function(d){ return n.next(seed = fn(seed, d, n.i++, n)) } });
      o.li.push(n);
      return n
    };

    o.unpromise = function(){ 
      var n = observable(o, { base: {}, recv: function(d){ return n.next(d) } });
      o.li.push(n);
      return n
    };

    o.next = function(value) {
      o.resolve && o.resolve(value);
      return o.li.length 
           ? o.li.map(function(o){ return o.recv(value) })
           : value
    };

    o.off = function(fn){
      return remove(o.li, fn), o
    };

    o.unsubscribe = function(reason){
      o.type 
        ? o.parent.off(o.type, o)
        : o.parent.off(o); 

      return o.emit('unsubscribe', (o.reason = reason, o))
    };

    o[Symbol.asyncIterator] = () => ({ 
      next: () => new Promise(resolve => {
        o.wait = true;
        o.map((d, i, n) => {
          o.wait = false;
          o.off(n);
          resolve({ value: d, done: false });
        });

        o.emit('pull', o);
      })
    });

    return o
  }
};

return index;

}());
