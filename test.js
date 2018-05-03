var expect = require('chai').expect
  , update = require('utilise.update')
  , delay = require('utilise.delay')
  , clone = require('utilise.clone')
  , time = require('utilise.time')
  , key = require('utilise.key')
  , by = require('utilise.by')
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
    expect(o.on.change[0].isOnce).to.be.ok
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

  it('should separate namespaced and non-namespaced listeners', function() {
    var o = emitterify({})

    o.on('change', String)
    o.on('change.foo', Date)
    expect(o.on.change.length).to.eql(2)
    expect(o.on.change[0]).to.eql(String)
    expect(o.on.change[1]).to.eql(Date)
    expect(o.on.change.$foo).to.eql(Date)
  })

  it('should register only one listener for namespace', function() {
    var o = emitterify({})
    o.on('change.specific', String)
    o.on('change.specific', Date)

    expect(o.on.change.length).to.eql(1)
    expect(o.on.change[0]).to.eql(Date)
    expect(o.on.change.$specific).to.eql(Date)
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
    /* istanbul ignore next */
    o.on('change.o-not-called').map(d => results.push('not-called'))
    o.on('change.o-called').map(d => results.push('o-called'))

    o.emit('change', 'x', ns => ns != 'not-called' && ns != 'o-not-called')
    expect(results).to.eql(['called', 'o-called'])
  })

  it('should invoke namespaced listeners on generic call', function() {
    var o = emitterify({})
      , called = 0
      , fn = function(){ called++ }

    o.once('change.specific', fn)
    expect(called).to.equal(0)
    o.emit('change')
    expect(called).to.equal(1)
  })

  it('should not conflate namespaces with native', function() {
    var o = emitterify({})
      , called = 0
      , fn = function(){ called++ }

    o.once('change.push', fn)
    expect(called).to.equal(0)
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

    o.on('test', fn1)
    o.on('test', fn2)
    expect(o.on.test.length).to.be.eql(2)

    expect(o.off('test', fn1)).to.be.eql(o)
    expect(o.on.test.length).to.be.eql(1)
    
    o.emit('test', 1)
    expect(result1).to.be.not.ok
    expect(result2).to.be.eql(1)

    expect(o.off('test')).to.be.eql(o)

    o.emit('test', 2)
    expect(result1).to.be.not.ok
    expect(result2).to.be.eql(1)
    expect(o.on.test.length).to.be.eql(0)
  })

  it('should remove namespaced listeners', function() {
    var o = emitterify({})
      , cb = function(){}

    o.on('foo.bar', cb)
    expect(o.on.foo.length).to.be.eql(1)
    expect(o.on.foo.$bar).to.be.eql(cb)
    o.off('foo', cb)
    expect(o.on.foo.length).to.be.eql(0)
    expect(o.on.foo.$bar).to.be.not.ok
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

  it('should unsubscribe namespaced observables', function() {
    var results = []
      , o = emitterify({})
      , foo = o.on('foo.bar')

    expect(o.on.foo.length).to.be.eql(1)
    expect(o.on.foo.$bar).to.be.eql(foo)
    o.off('foo', foo)
    expect(o.on.foo.length).to.be.eql(0)
    expect(o.on.foo.$bar).to.be.not.ok
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

  it('should allow signals on observable (once)', function(done) {
    var o = emitterify({}).on('foo')
    o.once('done').map(done)
    o.emit('done')
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

    numbers.emit('test', even.on('number'))
    numbers.emit('test', odd.on('number'))

    odd.emit('number', 1)
    even.emit('number', 2)
    odd.emit('number', 3)
    even.emit('number', 4)
    odd.emit('number', 5)
    even.emit('number', 6)

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

    var stream = numbers
      .on('number')
      .pipe(latest)
      .map(d => results.push(d))

    numbers.emit('number', even.on('number'))

    odd.emit('number', 1)
    even.emit('number', 2)
    
    numbers.emit('number', odd.on('number'))
    
    odd.emit('number', 3)
    even.emit('number', 4)
    
    expect(results).to.be.eql([2,3])

    stream.source.emit('stop')

    expect(odd.on.number.length).to.be.not.ok
    expect(even.on.number.length).to.be.not.ok
    expect(numbers.on.number.length).to.be.not.ok
    
    function latest(input) {
      var inner
      input
        .source
        .on('stop')
        .filter(d => inner)
        .each(d => inner.emit('stop'))

      return input.each((d, i, n) => {
        if (inner) {
          inner.off(n.next)
          inner.source.emit('stop')
        }
        ;(inner = d).each(n.next)
      }) 
    }     
  })

  it('buffer operator (stream-esque)', function(){
    const buffer = (fn, buffer = []) => (d, i, n) => {
      n.on('subscribe.flush', () => {
        while (buffer.length)
          n.next(fn(buffer.shift(), 0, n))
        n.subscribed = true
      })

      n.subscribed ? n.next(fn(d, i, n)) : buffer.push(d)
    }

    const o = emitterify()
        , results = []
        , buffered = o.on('number').filter(buffer(d => d * 2))

    o.emit('number', 1)
    o.emit('number', 2)
    o.emit('number', 3)

    buffered.map(d => results.push(d))
    buffered.emit('subscribe')

    o.emit('number', 4)

    expect(results).to.be.eql([2, 4, 6, 8])
  })

  it('lens (subset)', function(){
    const lens = body => (path = '') => emitterify()
      .on('number')
      .on('subscribe', function(){
        this.next({ type: 'update', key: path, value: key(path)(body) })
        this.source.lens = body
          .on('change')
          .filter(by('key', (d = '') => d.startsWith(path)))
          .map(this.next)
      })
      .on('unsubscribe', function(){
         this.source.lens
          .source
          .unsubscribe()
      })

    const o = emitterify({ foo: 'bar' })
        , results = { all: [], foo: [] }
        , all = lens(o)()
        , foo = lens(o)('foo')

    all.map(d => results.all.push(clone(d))).source.emit('subscribe')
    foo.map(d => results.foo.push(clone(d))).source.emit('subscribe')

    update('foo', 'baz')(o)
    update('bar', 'foo')(o)

    expect(results).to.be.eql({
      all: [
        { type: 'update', key: '', value: { foo: 'bar' }}
      , { type: 'update', key: 'foo', value: 'baz' }
      , { type: 'update', key: 'bar', value: 'foo' }
      ]
    , foo: [
        { type: 'update', key: 'foo', value: 'bar' }
      , { type: 'update', key: 'foo', value: 'baz' }
      ]
    })
  })

  it('should not reuse observables by default (once)', function(){
    var o = emitterify()
      , foo = o.once('foo')
      , bar = o.once('foo')
      , noop = function(){}

    expect(foo).to.not.be.equal(bar)

    foo.each(noop)
    bar.each(noop)

    expect(foo.li.map(function(d){ return d.fn })).to.be.eql([noop])
    expect(bar.li.map(function(d){ return d.fn })).to.be.eql([noop])
    expect(o.once('foo').li).to.be.eql([])
  })

  it('should not reuse observables by default (on)', function(){
    var o = emitterify()
      , foo = o.on('foo')
      , bar = o.on('foo')
      , noop = function(){}

    expect(foo).to.not.be.equal(bar)

    foo.each(noop)
    bar.each(noop)

    expect(foo.li.map(function(d){ return d.fn })).to.be.eql([noop])
    expect(bar.li.map(function(d){ return d.fn })).to.be.eql([noop])
    expect(o.on('foo').li).to.be.eql([])
  })

  it('should reuse observables by namespace (once)', function(){
    var o = emitterify()
      , foo = o.once('foo.specific')
      , bar = o.once('foo.specific')
      , noop = function(){}

    expect(foo).to.be.equal(bar)

    foo.each(noop)
    bar.each(noop)

    expect(
      o.once('foo.specific').li.map(function(d){ return d.fn })
    ).to.be.eql([noop, noop])
  })

  it('should reuse observables by namespace (on)', function(){
    var o = emitterify()
      , foo = o.on('foo.specific')
      , bar = o.on('foo.specific')
      , noop = function(){}

    expect(foo).to.be.equal(bar)

    foo.each(noop)
    bar.each(noop)

    expect(
      o.on('foo.specific').li.map(function(d){ return d.fn })
    ).to.be.eql([noop, noop])
  })

  it('should allow observable unsubscribing from another observable', function(){
    var o = emitterify()
      , foo = o.on('foo')
      , bar = foo.map(function(){ result++ })
      , result = 0

    expect(bar.parent).to.be.eql(foo)

    o.emit('foo')
    bar.emit('stop', 'reason')
    o.emit('foo')

    expect(result).to.be.eql(1)
    expect(bar.done).to.be.eql('reason')
    expect(foo.li.length).to.be.not.ok
    // expect(bar.parent).to.be.not.ok
  })

  it('should allow observable unsubscribing from another observable from grandchildren', function(){
    var o = emitterify()
      , foo = o.on('foo')
      , bar = foo.map(d => d).map(d => d).map(d => result++)
      , result = 0

    o.emit('foo')
    bar.emit('stop')
    o.emit('foo')

    expect(result).to.be.eql(1)
    // expect(bar.parent).to.be.not.ok
    // expect(bar.source).to.be.not.ok
  })

  it('should allow observable unsubscribing from another observable internally', function(){
    var o = emitterify()
      , result = 0

    o.on('foo').filter((m, i, n) => n.emit('stop')).map(d => result++)

    o.emit('foo')
    o.emit('foo')
    o.emit('foo')

    expect(result).to.be.eql(1)
  })

  it('should allow observable unsubscribing from source', function(){
    var o = emitterify()
      , foo = o.on('foo')
      , result = 0

    foo.map(function(){ result++ })
    expect(foo.parent).to.be.eql(o)

    o.emit('foo')
    foo.emit('stop')
    o.emit('foo')

    expect(result).to.be.eql(1)
    expect(o.on.foo.length).to.be.not.ok
    // expect(foo.parent).to.be.not.ok
  })

  it('should allow observable unsubscribing from source from grandchildren', function(){
    var o = emitterify()
      , source = o.on('foo')
      , foo = source.map(d => d).map(d => d).map(d => result++)
      , result = 0

    expect(source.source).to.be.eql(source)
    expect(foo.source).to.be.eql(source)

    o.emit('foo')
    foo.source.emit('stop')
    o.emit('foo')

    expect(result).to.be.eql(1)
    expect(o.on.foo.length).to.be.not.ok
    // expect(foo.parent).to.be.ok // TODO: unsub all parents in between too?
    // expect(foo.source).to.be.not.ok
  })

  it('should allow observable unsubscribing from namespaced source', function(){
    var o = emitterify()
      , foo = o.on('foo.ns')
      
    expect(o.on.foo.$ns).to.be.eql(foo)
    expect(o.on.foo.length).to.be.eql(1)
    foo.emit('stop')
    expect(o.on.foo.$ns).to.be.not.ok
    expect(o.on.foo.length).to.be.eql(0)
  })

  it('should allow custom handling of unsubscribe signal', function(){
    var o = emitterify()
      , source = o.on('foo.ns')
      , foo = source.map(d => d).map(d => result++)
      , result = 0

    source.on('stop').each(function(reason, i, n) {
      expect(reason).to.be.eql('reason')
      expect(o.on.foo.length).to.be.not.ok
      return 'ack'
    })

    expect(o.on.foo.length).to.be.ok
    expect(foo.source.emit('stop', 'reason')).to.be.eql(['reason', 'ack'])
  })

  it('should allow creating lazy subscriptions', function(){
    var o = emitterify({ foo: 'bar' })
      , results = []
      , n = o.on('value')
      , l = n.on('start', function(){
          this.next({ type: 'update', value: o })
          o.on('change')
            .map(this.next)
            .source
            .until(this.once('stop'))
        })
        .map(d => results.push(d))
    
    // before start (ignore)
    o.emit('change', { type: 'update', key: 'baz', value: '1' })
    expect(results).to.be.eql([])

    // start and resend
    l.source.emit('start')
    o.emit('change', { type: 'update', key: 'baz', value: '2' })

    // stop and resend (ignore)
    l.source.emit('stop')
    o.emit('change', { type: 'update', key: 'baz', value: '3' })

    expect(results).to.be.eql([
      { type: 'update', value: { foo: 'bar' }}
    , { type: 'update', key: 'baz', value: '2' }
    ])
  })

  it('asyncIterator: should consume without buffering', async function(done) {
    const o = emitterify({})
        , results = []
        , thread = async () => {
            for await (const d of o.on('foo')) {
              results.push(d)
            }
          }

    thread()
    time(10, d => o.emit('foo', 10))
    time(20, d => o.emit('foo', 20))
    time(30, d => o.emit('foo', 30))
    time(40, d => { 
      expect(results).to.be.eql([10, 20, 30])
      done() 
    })
  })

  it('asyncIterator: should (not?) drop values without buffering', async function(done) {
    const o = emitterify({})
        , results = []
        , thread = async () => {
            for await (const d of o.on('foo')) {
              results.push(d)
            }
          }

    thread()
    o.emit('foo', 10)
    o.emit('foo', 20)
    o.emit('foo', 30)
    time(10, d => { 
      // expect(results).to.be.eql([10])
      expect(results).to.be.eql([10,20,30])
      done() 
    })
  })

//   it('asyncIterator: should buffer synchronous pushes (buffer operator)', async function(done) {
//     const o = emitterify({})
//         , results = []
//         , buffer = (d, i, n) => {
//             n.buffer = n.buffer || []
//             n.pull = n.pull || n.on('pull')
//               .filter(d => n.buffer.length)
//               .map(d => n.next(n.buffer.shift()))

//             if (n.waiting)
//               n.next(d)
//             else
//               n.buffer.push(d)
//           }
//         , thread = async () => {
//             for await (const d of o.on('foo').filter(buffer)) 
//               results.push(d)
//           }

//     thread()
//     o.emit('foo', 10)
//     o.emit('foo', 20)
//     o.emit('foo', 30)
//     time(d => { 
//       expect(results).to.be.eql([10, 20, 30])
//       done()
//     })
//   })

//   it('asyncIterator: should buffer synchronous pushes (declarative)', async function(done) {
//     const o = emitterify()
//         , results = []
//         , buffer = input => {
//             const output = emitterify().on('bar') //input.filter(d => false)
//                 , buffer = []

//             output
//               .on('pull')
//               .filter(o => buffer.length)
//               .map(o => o.next(buffer.shift()))

//             input
//               .filter(d => buffer.push(d))
//               .filter(d => output.waiting)
//               .filter(d => output.next(buffer.shift()))
              
//             return output
//           }
//         , thread = async () => {
//             for await (const d of o.on('foo').pipe(buffer))
//               results.push(d)
//           }

// // o.on('foo').pipe(buffer)
// //   , buffer = input => {
// //       const output = emitterify().on('bar')
// //           , buffer = []

// //       output
// //         .on('pull')
// //         .filter(o => buffer.length)
// //         .map(o => o.next(buffer.shift()))

// //       input
// //         .filter(d => buffer.push(d))
// //         .filter(d => output.wait)
// //         .filter(d => output.next(buffer.shift()))
        
// //       return output
// //     }


//     thread()
//     o.emit('foo', 10)
//     o.emit('foo', 20)
//     o.emit('foo', 30)
//     time(d => { 
//       expect(results).to.be.eql([10, 20, 30])
//       done()
//     })
//   })

  // it('asyncIterator: should csp', async function(done) {
  //   const o = emitterify({})
  //       , threads = {
  //           consumer: async chan => {
  //             for await (const d of chan)
  //               if (results.push(d) == 10) break
  //           }
  //         , producer: async (chan, i = 0) => {
  //             for await (const d of chan.on('pull'))
  //               chan.next(++i)
  //           }
  //         }
  //       , results = []

  //   const chan = o.on('foo')
  //   threads.producer(chan)
  //   threads.consumer(chan)

  //   time(d => { 
  //     expect(results).to.be.eql([1,2,3,4,5,6,7,8,9,10])
  //     done()
  //   })
  // })

  it('asyncIterator: should csp', async function(done) {
    const o = emitterify({})
        , threads = {
            consumer: async chan => {
              for await (const value of chan) {
                if (results.push(value) == 10) return
              }
            }
          , producer: async (chan, i = 0) => {
              while (!chan.done) {
                await Promise.all(chan.next(++i))
              }
            }
          }
        , results = []

    const chan = o.on('foo')
    threads.consumer(chan)
    threads.producer(chan)

    time(d => { 
      expect(results).to.be.eql([1,2,3,4,5,6,7,8,9,10])
      done()
    })
  })

  it('should allow unpromisifying', done => {
    const results = []
        , o = emitterify()

    const a = o.on('foo').map(d => d * 2)
        , asyncFnA = () => a

    Promise
      .resolve()
      .then(asyncFnA)
      .then(d => results.push(d))

    const b = o.on('foo').map(d => d * 3).unpromise()
        , asyncFnB = () => b

    Promise
      .resolve()
      .then(asyncFnB)
      .then(d => results.push(d))

    o.emit('foo', 2)

    time(d => {
      expect(results).to.be.eql([b, 4])
      done()
    })
  })

  it('should correctly chain stop signal', () => {
    const results = []
        , o = emitterify()
        , n = emitterify()

    o.on('foo')
      .on('stop', reason => 'stopped ' + reason)
      .map(d => d)
      .until(n.once('stop'))

    expect(n.emit('stop', 'reason'))
      .to.be.eql(['reason', 'stopped reason'])
  })

  it('should stop via condition function', done => {
    const o = emitterify()
    
    o.on('foo.bar')
      .on('stop', reason => 'stopped at: ' + reason)
      .until(d => d > 3)
      .then(d => {
        expect(d).to.be.eql([4, 'stopped at: 4'])
        done()
      })

    expect(o.on.foo.length).to.be.eql(1)
    expect(o.on.foo.$bar.li.length).to.be.eql(1)
    o.emit('foo', 2)
    o.emit('foo', 3)
    o.emit('foo', 4)
    expect(o.on.foo.length).to.be.eql(0)
  })

  it('should work with transducers', async () => {
    const map = fn => next => (acc,v) => next(acc,fn(v)) 
        , filter = fn => next => (acc,v) => fn(v) && next(acc,v)
        , until = (hi, lo = 0) => (next,o) => (acc,v) => ++lo > hi ? o.stop() : next(acc,v)
        , o = emitterify()
        , results = []
        , input = [0,1,2,3,4,5,6,7,8,9]

    o.on('foo')
      .transform(
        map(v => v * 3)
      , filter(v => v % 2)
      , until(3)
      )
      .each(v => results.push(v))


    expect(o.on.foo.length).to.be.eql(1) 
    await Promise.all(input.map(async d => await Promise.all(o.emit('foo', await d))))
    expect(o.on.foo.length).to.be.eql(0) 
    expect(results).to.be.eql([3,9,15])
  })
})