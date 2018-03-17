var emitterify = require('./')

module.exports = Observable

function Observable(subscribe) {
  var unsubscribe 
    , o = emitterify()
        .on('unsubscribe', function(){
          if (unsubscribe) unsubscribe()
        })
        .on('value')

  return { subscribe: function(){
    console.log("here")
    unsubscribe = subscribe(o)
    return o
  }}
}

  // it('should allow Observable syntax', function(done){
  //   var subscribed = false

  //   var o = new Observable(observer => {
  //     console.log("2", 2)
  //     subscribed = true
  //     observer.next('foo')
  //     return () => { subscribed = false }
  //   })

  //   o.subscribe()
  //    .map(d => console.log("wat", d))
  //    .map(d => d + 'bar')
  //    .filter(d => d == 'foobar')
  //    .reduce((acc = 0, d) => acc = d.length)
  //    .map(function(value){
  //       expect(value).to.be.eql(6)
  //       expect(subscribed).to.be.ok
  //       o.source.unsubscribe()
  //       expect(subscribed).to.be.not.ok
  //       done()
  //    })
  // })
