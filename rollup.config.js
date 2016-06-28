import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import bowerResolve from 'rollup-plugin-bower-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
    entry: 'src/main.js',
    plugins: [
        json(),
        babel({
            exclude: [
                'bower_components/**',
                'node_modules/**'
                ]
        }),
        bowerResolve({
            override: {
                jQuery: 'dist/jquery.js',
                lodash: 'dist/lodash.fp.js'
            }
        }),
        commonjs()
    ],
    moduleName: 'annotatorPlugin',
    targets: [
        {
            dest: 'build/js/annotator.js',
            format: 'iife'
        }
    ]
};