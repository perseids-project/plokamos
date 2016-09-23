import oaByUrnUserRetriever from './io/oaByUrnUserRetriever'
import SPARQL from './sparql'
import rdfstore from 'rdfstore'
import _ from 'lodash'
import $ from 'jquery'

class Model {

    constructor (app) {
        this.app = app
        this.defaultDataset = []
        this.namedDataset = []
        this.store = {};
        this.upstream = []
        /**
         * Runs one or more sparql queries (in order) against the local rdfstore
         * and returns an array with result of the shape
         * [{sparql:"original query",error:"error or undefined",result:"result or undefined"},...]
         * @param sparql
         * @returns {*} promise for ordered list
         */
        this.execute = (sparql) => {
            console.log((new Date()).getTime())
            var data = sparql.constructor === Array ? sparql : [sparql]
            var start = $.Deferred()
            var seq = _.map(data,(x) => {return {sparql:x,deferred:$.Deferred()}})
            var last = _.reduce(
                seq,
                (previous,current) => {
                    previous.then((acc) => {
                            this.store.executeWithEnvironment(current.sparql,this.defaultDataset,this.namedDataset,(e,r) => {
                                acc.push({sparql:current.sparql,error:e,result:r})
                                current.deferred.resolve(acc)
                            })
                    });
                    return current.deferred.promise()},
                start.promise()
            )
            start.resolve([])
            return last.then((result) => {
                var deferred = $.Deferred()
                this.store.registeredGraphs((e,g) => {
                    this.namedDataset = _.uniq(_.map(g,(x) => x.nominalValue))
                    this.defaultDataset = this.namedDataset
                    deferred.resolve(result)
                })
                return deferred.promise()
            })
        }
        this.reset = () => {
            var outer = $.Deferred();
            var inner = $.Deferred();
            rdfstore.create((err,store) => {
                this.store = store;
                inner.resolve();
            })
            inner.promise()
                .then(() => this.execute(_.flattenDeep(this.upstream)))
                .then(() => this.store.registeredGraphs(
                    (e,g) => {
                        this.namedDataset = _.uniq(_.map(g,(x) => x.nominalValue))
                        this.defaultDataset = this.namedDataset
                        outer.resolve()
                    }
                ))
            return outer.promise();
        }
    }

    load(endpoints, urn, user) {
        var source = endpoints.read || endpoints.query || "/"
        var promise = source.slice(-5)==='.json' ? $.getJSON(source) : oaByUrnUserRetriever(source, urn, user)
        // planned: should be done in its own class, resulting in promise for store, which gets assigned to this.store
        return promise
            .then((data) => SPARQL.bindingsToInsert(data.results.bindings))
            .then((data) => {
                this.upstream = data
                return this.reset()
            })
    }

    execute(sparql) {
        return this.execute(sparql)
    }

    reset() {
        this.reset();
    }

}

export default Model