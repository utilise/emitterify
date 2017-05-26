var expect = require('chai').expect
  , delay = require('utilise.delay')
  , clone = require('utilise.clone')
  , time = require('utilise.time')
  , emitterify = require('./')

describe('emitterify', function() {
  it('should add api to object', function() {
    var o = emitterify({})
    expect(typeof o.on).to.eql('function')
    expect(typeof o.once).to.eql('function')
    expect(typeof o.emit).to.eql('function')

    var n = emitterify()
    expect(typeof n.on).to.eql('function')
    expect(typeof n.once).to.eql('function')
    expect(typeof n.emit).to.eql('function')
  })

  it('should be idempotent', function() {
    var o = emitterify({})
    o.on('event', String)
    expect(o.on.event.length).to.eql(1)

    o = emitterify(o)
    expect(o.on.event.length).to.eql(1)
  })

  it('should add a listener', function() {
    var o = emitterify({})
    o.on('change', String)
    expect(o.on.change).to.eql([String])
  })

  it('should add a once listener', function() {
    var o = emitterify({})
    o.once('change', String)
    expect(o.on.change).to.eql([String])
    expect(o.on.change[0].once).to.be.ok
  })

  it('should emit an event', function() {
    var o = emitterify({})
      , called = 0
      , fn = function(){ called++ }

    o.on('change', fn)
    o.emit('change')
    o.emit('change')
    expect(called).to.equal(2)
  })

  it('should emit an event once', function() {
    var o = emitterify({})
      , called = 0
      , fn = function(){ called++ }

    o.once('change', fn)
    o.emit('change')
    o.emit('change')
    expect(called).to.equal(1)
  })

  it('should not skip handlers with once', function() {
    var o = emitterify({})
      , called = 0
      , fn = function(){ called++ }

    o.once('change', fn)
    o.once('change', fn)
    o.once('change', fn)
    o.emit('change')
    expect(called).to.equal(3)
  })

  it('should not fail with no listeners', function() {
    var o = emitterify({})
    o.emit('change')
  })

  // it('should not fail with exceptional listener', function() {
  //   var o = emitterify({})
  //     , fn = function(){ throw new Error('dafuq?') }

  //   o.on('change', fn)
  //   o.emit('change')
  // })

  it('should register duplicate listeners', function() {
    var o = emitterify({})

    o.on('change', String)
    o.on('change', String)
    expect(o.on.change).to.eql([String, String])
  })

  it('should register only one listener for namespace', function() {
    var o = emitterify({})
    o.on('change.specific', String)
    o.on('change.specific', Date)

    expect(o.on.change.length).to.eql(1)
    expect(o.on.change[0]).to.eql(Date)
    expect(o.on.change.specific).to.eql(Date)
  })

  it('should register only once listener for namespace', function() {
    var o = emitterify({})
      , called = 0
      , fn = function(){ called++ }

    o.once('change.specific', fn)
    o.once('change.specific', fn)
    o.emit('change.specific')
    o.emit('change.specific')
    expect(called).to.equal(1)
  })

  it('should allow ignoring certain namespaces when emitting', function() {
    var o = emitterify({})
      , results = []

    /* istanbul ignore next */
    o.on('change.not-called', d => results.push('not-called'))
    o.on('change.called', d => results.push('called'))
    o.emit('change', 'x', ns => ns != 'not-called')
    expect(results).to.eql(['called'])
  })

  it('should invoke namespaced listeners on generic call', function() {
    var o = emitterify({})
      , called = 0
      , fn = function(){ called++ }

    o.once('change.specific', fn)
    o.emit('change')
    expect(called).to.equal(1)
  })

  it('should invoke listeners with multiple args', function() {
    var o = emitterify({})
      , fn = function(){ args = arguments; ctx = this }
      , args, ctx

    o.once('change', fn)
    o.emit('change', [1,2,3])
    expect(args[0]).to.eql(1)
    expect(args[1]).to.eql(2)
    expect(args[2]).to.eql(3)
    expect(ctx).to.eql(o)
  })

  it('should remove once listener before invoking', function(done) {
    var o = emitterify({})
      , called = 0

    o.once('change', function(){
      called++
      o.emit('change')  
    })
    o.emit('change')

    setTimeout(function(){
      expect(called).to.be.eql(1)
      done()
    }, 10)
  })

  it('should emitterify function', function() {
    var fn = emitterify(String)
    expect(fn.on).to.be.a('function')
  })

  it('should allow proxying', function() {
    var o = emitterify({})
      , emit = o.emit
      , result

    o.on('change', function(d){ result = d})
    o.emit = function(type, d){ emit(type, d + ' bar') }
    o.emit('change', 'foo')
    expect(result).to.be.eql('foo bar')
  })

  it('should emit any defined falsy params', function() {
    var body = {}
      , o = emitterify(body)
      , result

    o.on('change', function(d){ result = d })

    o.emit('change', 0)
    expect(result).to.be.eql(0)

    o.emit('change', false)
    expect(result).to.be.eql(false)

    o.emit('change', 0)
    expect(result).to.be.eql(0)

    o.emit('change', undefined)
    expect(result).to.be.eql(undefined)
  })

  it('should work with null param', function() {
    var o = emitterify({})
      , result

    o.on('change', function(d){ result = d })

    o.emit('change')
    expect(result).to.be.eql(undefined)

    o.emit('change', 1)
    expect(result).to.be.eql(1)

    o.emit('change', ['a'])
    expect(result).to.be.eql('a')
  })

  // TODO add string, object, buffer, arguments
  // it('should proxy arguments object', function() {
  //   var o = emitterify({})
  //     , fn = function(){ args = arguments }
  //     , args, ctx

  //   o.on('change', fn)

  //   !function proxy(){
  //     o.emit('change', arguments)
  //   }('a', 'b', 'c')

  //   expect(args[0]).to.eql('a')
  //   expect(args[1]).to.eql('b')
  //   expect(args[2]).to.eql('c')
  // })

  it('should work with promises - single arg', function(done) {
    /* istanbul ignore next */
    if (typeof Promise === 'undefined') return done()
    var o = emitterify({})
    setTimeout(function(){ o.emit('foo', 'bar') }, 10)
    o.on('foo').then(function(args) {
      expect(args).to.eql('bar')
      done()
    })
  })

  it('should work with promises - multi arg', function(done) {
    /* istanbul ignore next */
    if (typeof Promise === 'undefined') return done()
    var o = emitterify({})
    setTimeout(function(){ o.emit('foo', ['foo', 'bar']) }, 10)
    o.on('foo').then(function(args) {
      expect(args).to.eql(['foo', 'bar'])
      done()
    })
  })

  it('should work as observable - map', function(done) {
    var o = emitterify({})

    o.on('foo')
      .map(d => d + 50)
      .map(d => d/2)
      .map(d => (expect(d).to.eql(75), d))
      .then(d => expect(d).to.eql(75))
      .then(d => done())

    o.emit('foo', 100)
  })

  it('should work as observable - filter', function() {
    var o = emitterify({})
      , results = []

    o.on('foo')
      .filter(d => d % 2 ? d : false)
      .map(d => d * 10)
      .map(d => results.push(d))
    
    ;[0,1,2,3,4,5,6,7,8,9].map(d => o.emit('foo', d))

    expect(results).to.eql([10,30,50,70,90])
  })

  it('should work as observable - reduce', function() {
    var o = emitterify({})
      , results = []

    o.on('foo')
      .reduce((acc, d) => d % 2 ? (acc.push(d), acc) : acc, [])
      .map(d => results.push(clone(d)))
    
    ;[0,1,2,3,4,5,6,7,8,9].map(d => o.emit('foo', d))

    expect(results).to.eql([
      []
    , [1]
    , [1]
    , [1,3]
    , [1,3]
    , [1,3,5]
    , [1,3,5]
    , [1,3,5,7]
    , [1,3,5,7]
    , [1,3,5,7,9]
    ])
  })

  it('should emit all events on *', function() {
    var o = emitterify({})
      , called = 0

    o.on('*', function(){ called++ })
    o.emit('foo', 1)
    o.emit('bar', 1)

    expect(called).to.eql(2)
  })

  it('should wait for values to resolve', function(done) {
    var o = emitterify()
      , results = []

    o.on('test')
      .filter(wait(d => delay(d*100, d)))
      .map(d => results.push(d))

    o.emit('test', 3)
    o.emit('test', 1)
    o.emit('test', 2)

    time(150, d => expect(results).to.eql([1]))
    time(250, d => expect(results).to.eql([1, 2]))
    time(350, d => expect(results).to.eql([1, 2, 3]))
    time(400, done)

    function wait(fn) {
      return function(d, i, n){
        fn(d,i,n).then(n.next)
      }
    }
  })

  it('should remove listeners', function() {
    /* istanbul ignore next */
    var o = emitterify({})
      , result1
      , result2 
      , fn1 = d => { result1 = d }
      , fn2 = d => { result2 = d }

    o.off('test')

    o.on('test', fn1)
    o.on('test', fn2)
    expect(o.on.test.length).to.be.eql(2)

    o.off('test', fn2)

    o.emit('test', 1)
    expect(result1).to.be.eql(1)
    expect(result2).to.be.not.ok
    expect(o.on.test.length).to.be.eql(1)

    o.off('test')

    o.emit('test', 2)
    expect(result1).to.be.eql(1)
    expect(result2).to.be.not.ok
    expect(o.on.test.length).to.be.eql(0)
  })

  it('should unsubscribe observables', function() {
    var results = []
      , o1 = emitterify({})
      , o2 = o1.on('test')
      , o3 = o2.map(d => results.push(d))

    o1.emit('test', 'x')
    expect(results).to.be.eql(['x'])

    o1.off('test', o2)

    o1.emit('test', 'x')
    expect(results).to.be.eql(['x'])
  })

  it('should pass index to observables operators', function() {
    var o = emitterify({})

    o.on('test').map((d, i) => expect(i).to.be.eql(d == 'a' ? 0 : 1))
    o.on('test').filter((d, i) => expect(i).to.be.eql(d == 'a' ? 0 : 1))
    o.on('test').reduce((acc, d, i) => expect(i).to.be.eql(d == 'a' ? 0 : 1))
    o.emit('test', 'a')
    o.emit('test', 'b')
  })

  it('should create observable using once', function() {
    var o = emitterify({})
      , results = []

    o.once('test')
      .map(d => results.push(d))

    o.emit('test', 'a')
    o.emit('test', 'b')

    expect(results).to.be.eql(['a'])
  })

  it('flatmap operator (flatten)', function(){
    var numbers = emitterify()
      , even = emitterify()
      , odd = emitterify()
      , results = []

    numbers
      .on('test')
      .filter(flatten)
      .map(d => results.push(d))

    numbers.emit('test', even.on('value'))
    numbers.emit('test', odd.on('value'))

    odd.emit('value', 1)
    even.emit('value', 2)
    odd.emit('value', 3)
    even.emit('value', 4)
    odd.emit('value', 5)
    even.emit('value', 6)

    expect(results).to.be.eql([1,2,3,4,5,6])

    function flatten(d, i, n) {
      d.map(n.next)
    }
  })

  it('switchmap operator (latest)', function(){
    var numbers = emitterify()
      , even = emitterify()
      , odd = emitterify()
      , results = []

    numbers
      .on('test')
      .filter(latest)
      .map(d => results.push(d))

    numbers.emit('test', even.on('value'))

    odd.emit('value', 1)
    even.emit('value', 2)
    
    numbers.emit('test', odd.on('value'))
    
    odd.emit('value', 3)
    even.emit('value', 4)
    
    expect(results).to.be.eql([2,3])

    function latest(d, i, n) {
      if (n.prev) n.prev.off(n.next)
      ;(n.prev = d).map(n.next)
    }     
  })

  it('should not reuse observables by default (once)', function(){
    var o = emitterify()
      , foo = o.once('foo')
      , bar = o.once('foo')
      , noop = function(){}

    expect(foo).to.not.be.equal(bar)

    foo.map(noop)
    bar.map(noop)

    expect(foo.listeners.map(function(d){ return d.fn })).to.be.eql([noop])
    expect(bar.listeners.map(function(d){ return d.fn })).to.be.eql([noop])
    expect(o.once('foo').listeners).to.be.eql([])
  })

  it('should not reuse observables by default (on)', function(){
    var o = emitterify()
      , foo = o.on('foo')
      , bar = o.on('foo')
      , noop = function(){}

    expect(foo).to.not.be.equal(bar)

    foo.map(noop)
    bar.map(noop)

    expect(foo.listeners.map(function(d){ return d.fn })).to.be.eql([noop])
    expect(bar.listeners.map(function(d){ return d.fn })).to.be.eql([noop])
    expect(o.on('foo').listeners).to.be.eql([])
  })

  it('should reuse observables by namespace (once)', function(){
    var o = emitterify()
      , foo = o.once('foo.specific')
      , bar = o.once('foo.specific')
      , noop = function(){}

    expect(foo).to.be.equal(bar)

    foo.map(noop)
    bar.map(noop)

    expect(o.once('foo.specific').listeners.map(function(d){ return d.fn })).to.be.eql([noop, noop])
  })

  it('should reuse observables by namespace (on)', function(){
    var o = emitterify()
      , foo = o.on('foo.specific')
      , bar = o.on('foo.specific')
      , noop = function(){}

    expect(foo).to.be.equal(bar)

    foo.map(noop)
    bar.map(noop)

    expect(o.on('foo.specific').listeners.map(function(d){ return d.fn })).to.be.eql([noop, noop])
  })

  it('should allow unsubscribing observable', function(){
    var o = emitterify()
      , foo = o.on('foo')
      , bar = foo.map(function(){ result++ })
      , result = 0

    expect(bar.parent).to.be.eql(foo)

    o.emit('foo')
    bar.unsubscribe()
    o.emit('foo')

    expect(result).to.be.eql(1)
    expect(bar.parent).to.be.not.ok
  })

  it('should allow observable unsubscribing itself', function(){
    var o = emitterify()
      , result = 0

    o.on('foo').filter((m, i, n) => n.unsubscribe()).map(d => result++)

    o.emit('foo')
    o.emit('foo')
    o.emit('foo')

    expect(result).to.be.eql(1)
  })

})