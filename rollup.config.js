import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'index.js'
, dest: 'client.bundle.js'
, format: 'iife'
, moduleName: 'emitterify'
, plugins: [
    nodeResolve({ browser: true })
  , commonjs()
  ]
}