# Emitterify

## [![Coverage Status](https://coveralls.io/repos/utilise/emitterify/badge.svg?branch=master)](https://coveralls.io/r/utilise/emitterify?branch=master) [![Build](https://api.travis-ci.org/utilise/emitterify.svg)](https://travis-ci.org/utilise/emitterify)

* Enhance any object into an event stream
* Consistent paradigm across callbacks, promises and observables
* Supports unique listener per namespace
* Tiny (~900b min+gzip)
* Small and intuitive API: `.on`, `.once`, `.off`, `.emit`

```js
const ob = emitterify({})

// # callbacks
ob.on('event', ...)
ob.once('event', ...)

// # promises
ob.on('event')
  .then(...)
  .catch(...)

ob.once('event')
  .then(...)
  .catch(...)

await ob.on('event')
await ob.once('event')

// # observables
ob.on('event')
  .map(...)
  .filter(...)
  .reduce(...)

// # mix
await ob
  .on('event')
  .map(...)
  .reduce(...)

// # emit event
ob.emit('event', detail)  // emit event with extra detail
```

#### Differences with RxJS:

* The only observable operators included are `.map`/`.filter`/`.reduce`, everything else can be implemented as a separate operator outside the core imho - similar to [utilise vs lodash](). For example, [the ES6 Observable repo](https://github.com/tc39/proposal-observable/blob/master/Why%20error%20and%20complete.md#declarative-concurrency-in-async-functions-using-takeuntil) explains how you might want to use two infinite streams to create a single finite stream à la `.takeUntil`. This can be easily implemented as `stream1.map(until(stream2))`.

* See ["hot" vs "cold"](https://medium.com/@benlesh/hot-vs-cold-observables-f8094ed53339) observables: Given the extra complexity, I don't see much benefit in cold observables. The examples usually given e.g. creating and tearing down a websocket connection, per observable, don't seem very useful/common. 

* If any `.map`/`.filter`/`.reduce` throws an error, it will jump to the next `.catch` handler (like promises). Nothing is automatically unsubscribed, unless you explicitly do so yourself in the error handler.

* You can remove any listener(s) with `.off`. This won't be necessary a lot of the time by for example using `.once` or namespaces to prevent leaking resources.

### Notes

You will need to `npm i emitterify@next` or `npm i utilise/emitterify` to try this out for now. 

Once this is moves to the `latest` channel, you will be able to automatically use all events in the following as observables and promises, as well as callbacks:

* Remote Resources with [ripple](https://github.com/rijs/fullstack): `ripple('resource').on('change').map(...)`
* DOM Elements with [once](https://github.com/utilise/once): `element.on('click').map(...)` 
* Distributed Services with [fero](https://github.com/pemrouz/fero): `await cluster.on('connected')`, `consumer.on('change').map(...)`