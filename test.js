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
    expect(o.on.change).to.eql([{ fn: String }])
  })

  it('should add a once listener', function() {
    var o = emitterify({})
    o.once('change', String)
    expect(o.on.change).to.eql([{ fn: String, once: true }])
  })

  it('should add emit an event', function() {
    var o = emitterify({})
      , called = 0
      , fn = function(){ called++ }

    o.on('change', fn)
    o.emit('change')
    o.emit('change')
    expect(called).to.equal(2)
  })

  it('should add emit an event', function() {
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
})