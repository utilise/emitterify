var expect = require('chai').expect
  , emitterify = require('./')

describe('emitterify', function() {
  it('should add api to object', function() {
    var o = emitterify({})
    expect(typeof o.on).to.eql('function')
    expect(typeof o.once).to.eql('function')
    expect(typeof o.emit).to.eql('function')
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
})