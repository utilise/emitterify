var expect = require('chai').expect
  , emitterify = require('./')

describe('emitterify', function() {
  it('should add api to object', function() {
    var o = emitterify({})
    expect(typeof o.on).to.eql('function')
    expect(typeof o.once).to.eql('function')
    expect(typeof o.emit).to.eql('function')
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

  it('should not fail with no listeners', function() {
    var o = emitterify({})
    o.emit('change')
  })

  it('should not fail with exceptional listener', function() {
    var o = emitterify({})
      , fn = function(){ throw new Error('dafuq?') }

    o.on('change', fn)
    o.emit('change')
  })

  it('should return listeners if used as getter', function() {
    var o = emitterify({})

    o.on('change', String)
    o.on('change', Date)
    expect(o.on('change')).to.eql([String, Date])
  })

  it('should register duplicate listeners', function() {
    var o = emitterify({})

    o.on('change', String)
    o.on('change', String)
    expect(o.on('change')).to.eql([String, String])
  })

  it('should register only one listener for namespace', function() {
    var o = emitterify({})

    o.on('change.specific', String)
    o.on('change.specific', Date)
    expect(o.on('change.specific')).to.eql(Date)
  })

  it('should register only once listener for namespace', function() {
    var o = emitterify({})
      , called = 0
      , fn = function(){ called++ }

    o.once('change.specific', fn)
    o.emit('change.specific')
    o.emit('change.specific')
    expect(called).to.equal(1)
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
    expect(result).to.be.eql(body)
  })

  it('should allow changing default param', function() {
    var o = emitterify({}, -1)
      , result

    o.on('change', function(d){ result = d })

    o.emit('change')
    expect(result).to.be.eql(-1)

    o.emit('change', 1)
    expect(result).to.be.eql(1)

    o.emit('change', ['a'])
    expect(result).to.be.eql('a')
  })


})