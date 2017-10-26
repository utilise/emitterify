# Emitterify

## [![Coverage Status](https://coveralls.io/repos/utilise/emitterify/badge.svg?branch=master)](https://coveralls.io/r/utilise/emitterify?branch=master) [![Build](https://api.travis-ci.org/utilise/emitterify.svg)](https://travis-ci.org/utilise/emitterify)

* Enhance any object into an event stream
* Consistent paradigm across callbacks, promises and observables
* Supports unique listener per namespace and wildcard event (`*`)
* Tiny (~700b min+gzip no dependencies)
* Small and intuitive API: `.on`, `.once`, `.off`, `.emit`, etc

#### Callbacks

```js
const foo = emitterify()
foo.on('event', result => result == 'foo')
foo.once('event', result => result == 'foo')
foo.emit('event', 'foo')
```

#### Promises

If you omit the callback in `.on`/`.once`, you can `await` the same result you normally get in the callback:

```js
result = await foo.on('event')
result = await foo.once('event')
```

#### Observables

If you are interested in more than a single event, you can omit the callback and use `.map`/`.filter`/`.reduce`:

```js
foo
  .on('event')
  .map(result => ...)
  .filter(result => ...)
  .reduce(result => ...)
```

It can be really useful to mix approaches too, for example to manipulate a stream of events until a certain condition is fulfilled:

```js
await cluster.on('changes').filter(d => peers.every(isStable)) 
// cluster now stabilised

await node.on('click').reduce(acc => ++acc).filter(d => d == 10) 
// node clicked 10 times 
```

#### Signals 

When you do `emitter.on(event)` it returns a channel through which events flow. The channel itself is emitterified so it can be used to communicate and respond to various events. There are few common ones such as `start`, `stop` for lazy subscriptions, but in contrast to other implementations, these are not hardcoded, which means you can also communicate other signals, such as the completion `progress` of a channel, whether the original request for a stream of server responses has been `sent` yet, etc. This affords much greater flexibility without any extra API, and the design becomes obvious when you realise that these are all _qualities of the channel itself_, and since they are _events_, they have the same reactive interface as other stream of events.

```js
foo
  .on('value')
  .on('start', () => {})      // stream of meta-events, orthogonal to original channel ---->  
  .on('stop', () => {})       // stream of meta-events, orthogonal to original channel ----> 
  .on('progress', () => {})   // stream of meta-events, orthogonal to original channel ----> 
  // |
  // ↓
  // values flow down through the main channel
```

#### CSP 

Observables (FRP) "push" values, whereas streams with backpressure or channels (CSP) will generally allow the consumer to process values according to it's own pace or "pull" values. This is important for certain types of operations where you don't want to overwhelm consumers. This is a natural fit here too, since channels implement the async iterator Symbol and so allow producers to respond to consumers that are already waiting and push new values only as they are requested. This is done via the stream of `pull` events on the channel. Using the canonical example, let's say we create `chan = o.on('foo')` and then pass this to the following threads:

```js
async producer(chan, i = 0) => {
  for await (const d of chan.on('pull'))
    chan.next(++i)
}

async consumer (chan) => {
  for await (const d of chan)
    if (results.push(d) == 10) break
}
```

These two functions work co-operatively: the consumer is "pulling" values from the channel, whilst the producer is pushing them when requested. 

## Operators 

The only observable operators included are `.map`/`.filter`/`.reduce`, everything else can be implemented as a separate operator outside the core - similar to how [utilise](https://github.com/utilise/utilise#lean-javascript-utilities-as-micro-libraries) complements the native Array operators in contrast to lodash which attempts to replace them. Below is a few example operators. They are so small, that's it probably not even worth publishing these to npm.

* #### Sum (18 chars)

  ```js
  sum = (acc = 0) => ++acc
  events.reduce(sum)
  ```

  We just increment `acc` on every event and return it, which becomes the value of `acc` on the next event.

* #### Flatmap (26 chars) - [see full test example]()

  ```js
  flatten = (d, i, n) => { d.map(n.next) }
  events.filter(flatten)
  ```

  We don't return anything so the stream stops at this operator. However, we can use `n.next` to continue directly publishing events. Instead of continuing with the current value which we expect to be a stream, we subscribe to it instead to unwrap  the _values_ of the stream and then publish those.

* #### Switchmap (2 lines) - [see full test example]()

  See [this description](https://github.com/tc39/proposal-observable/blob/14007f54b20a3cc49d29e3a9c2b764c3a2c4acdb/ObservableEventTarget.md#use-case-browsing-the-images-in-a-news-aggregator) for an exaplanation of switchmap.

  ```js
  latest = (d, i, n) => {
    if (n.prev) n.prev.off(n.next)
    ;(n.prev = d).map(n.next)
  }

  events.filter(latest)
  ```

  This is similar to the previous flatmap case, however when we receive a new stream, we stop emitting values from the previous stream. This is why we store a reference to the stream in `n.prev` so we can unsubscribe from it next time.

* #### Until (38 chars)

  See [the ES6 Observable repo](https://github.com/tc39/proposal-observable/blob/master/Why%20error%20and%20complete.md#declarative-concurrency-in-async-functions-using-takeuntil) for an explanation of how you might want to use two infinite streams to create a single finite stream. 

  This operator is now built-in so you can do things like:

  ```js
  node
    .on('click')
    .map(..)
    .filter(...)
    .until(node.once('removed'))
  ```

* #### Pipe

  Instead of abusing the `.filter` operator, if your custom operator needs to do things on startup, a better way to write them would be (all the following are equivalent):

  ```js
  buffer(stream)
  stream |> buffer
  stream.pipe(buffer)
  ```

  This essentially takes in a stream, and returns a new stream, controlling the flow between them (e.g. buffering) and proxying signals back upstream as necessary (e.g. unsubscription). This is the best way to write operators, especially if you also want to encapsulate the underlying input stream. The built-in operators (`map`/`filter`/`reduce`) are written in the same way so you could also write `stream.pipe(map(...)).pipe(filter(...)).pipe(reduce(...))` if you prefer.

## Related Libraries

The events in the following libraries all use this interface:

* Remote Resources in browser with [ripple](https://github.com/rijs/fullstack): `ripple('resource').on('change').map(...)`
* DOM Elements with [once](https://github.com/utilise/once): `element.on('click').map(...)` 
* Distributed Services with [fero](https://github.com/pemrouz/fero): `await peer.on('connected')`, `peer.on('change').map(...)`

## API

* `emitter = `**`emitterify`**`(something = {})`

  Enhances the specified object with the hidden (non-enumerable) methods `.on`, `.once`, `.emit`, `.off`.

* `emitter`**`.on`**`('event'[, `_`callback`_`])`

  Subscribe the `callback` function to the specified `event` type. 
  
  If there is no callback, it returns a stream object which you can either use as a promise or the map/filter/reduce operators.
  
  If the event has a namespace (e.g. `foo.bar`), the callback will uniquely replace any previous callback on that namespace.

* `emitter`**`.once`**`('event'[, `_`callback`_`])`

  Subscribe the `callback` function to the specified `event` type which is then unsubscribed after it is invoked. 
  
  If there is no callback, it returns a stream object which you can either use as a promise or the map/filter/reduce operators.
  
  If the event type has a namespace (e.g. `foo.bar`), the callback will uniquely replace any previous callback on that namespace.

* `emitter`**`.emit`**`('event'[, `_`value`_`[, `_`filter`_`]])`

  Emits an event on some type with an optional value. If the value is an array, they will be spread on the callback function and passed directly to promises/streams.

  `filter` is a function that allows filtering of handlers with namespaces that should be invoked. This has been useful in some advanced cases to prevent positive feedback loops.

* `emitter`**`.off`**`('event'[, `_`callback`_`])`

  Unsubscribes the `callback` function from the specified `event` type. 

  If there is no callback, all callbacks are unsubscribed.

* `stream`**`.map`**`((d, i, n) => ...)`

  Creates a new stream object, using the specified function to transform the input stream of values. The return value of the function is the input to any listeners.

  * `d` - The input value 
  * `i` - The index of the current event
  * `n` - This gives you access to the current stream object for complete control to implement your own operators

* `stream`**`.filter`**`((d, i, n) => ...)`

  Creates a new stream object, using the specified function to determine whether to emit the current value. 

  * `d` - The input value 
  * `i` - The index of the current event
  * `n` - This gives you access to the current stream object for complete control to implement your own operators

* `stream`**`.reduce`**`((acc, d, i, n) => ..., seed = 0)`

  Creates a new stream object, using the specified function to transform the input stream of values, with an additional variable (`acc`) for stateful computations. The return value of the function becomes the next value of `acc`, which is initially set to `seed`.

  * `acc` - A variable that can be used for stateful computations across events
  * `d` - The input value 
  * `i` - The index of the current event
  * `n` - This gives you access to the current stream object for complete control to implement your own operators

* `stream`**`.next`**`(value)`

  Invoke all listeners with the specified value. Returns the same `stream`.

* `stream`**`.off`**`([`_`stream`_`])`

  Unsubscribe the specified stream object. If no stream is specified, unsubscribe all listeners. Returns the same `stream`.

* `stream`**`.unsubscribe`**`()`

  Unsubscribes the stream from the parent stream.

* `stream`**`.source`**

  This refers to the root source, so if you for example build a pipeline like `pipeline = foo.on('event').map(d => d).map(d => d).map(d => d)`, then `pipeline.source` is equal to that initial `foo.on('event')`. This is convenient for tearing down an entire pipeline by doing `pipeline.source.unsubscribe()` .