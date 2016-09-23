import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import buble from 'rollup-plugin-buble';

export default {
  entry: 'index.js',
  plugins: [
    nodeResolve(),
    commonjs(),
    buble({objectAssign: 'Object.assign'})
  ],
  format: 'umd',
  moduleName: 'd3'
}
