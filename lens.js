var emitterify = require('./')

module.exports = body => (path = '') => emitterify()
  .on('subscribe', o => {
    o.parent
      .next({ type: 'update', key: path, value: key(path)(body) })

    o.lens = body
      .on('change')
      .filter(by('key', (d = '') => d.startsWith(path)))
      .map(o.parent.next)
  })
  .on('unsubscribe', o => o.lens
    .source
    .unsubscribe()
  )
  .on('value')