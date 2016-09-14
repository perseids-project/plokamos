import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import bowerResolve from 'rollup-plugin-bower-resolve';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
    entry: 'src/main.js',
    plugins: [
        json(),
        babel({
            exclude: [
                'bower_components/lodash/**',
                'bower_components/jquery/**',
                'bower_components/bootstrap/**',
                'bower_components/jsonld/**',
                'bower_components/d3/**',
                'node_modules/**'
                ]
        }),
        bowerResolve({
            skip: ['rdfstore'],
            override: {
                jquery: 'dist/jquery.js',
                lodash: 'dist/lodash.js',
                'typeahead.js': 'dist/typeahead.bundle.js',
                bootstrap: 'dist/js/bootstrap.js'
            }
        }),
        nodeResolve({
            jsnext:true,
            main:true,
            skip:['rdfstore']
        }),
        commonjs()
    ],
    globals: {
        rdfstore: 'rdfstore'
    },
    moduleName: 'plokamos',
    targets: [
        {
            dest: 'build/js/annotator.js',
            useStrict: false,
            format: 'iife'
        }
    ]
};