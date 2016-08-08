import oaByUrnRetriever from './io/oaByUrnRetriever'
import sparql from './sparql'
import rdfstore from 'rdfstore'
import _ from 'lodash'
import $ from 'jquery'

class Model {

    constructor () {
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
            var data = sparql.constructor === Array ? sparql : [sparql]
            var start = $.Deferred()
            var seq = _.map(data,(x) => {return {sparql:x,deferred:$.Deferred()}})
            _.reduce(
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
            seq.slice
            return _.last(seq).deferred.promise()
        }
        this.reset = () => {
            var outer = $.Deferred();
            var inner = $.Deferred();
            rdfstore.create((err,store) => {
                this.store = store;
                inner.resolve();
            })
            inner.promise()
                .then(() => this.execute(this.upstream))
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

    load(endpoint, urn, user) {
        var promise = endpoint.slice(-5)==='.json' ? $.getJSON(endpoint) : oaByUrnRetriever(endpoint, urn)
        // TODO: should be done in its own class, resulting in promise for store, which gets assigned to this.store
        return promise
            .then((data) => sparql.bindings2insert(data.results.bindings))
            .then((data) => {
                this.upstream = data
                return this.reset()
            })
    }


    
    execute(sparql) { return this.execute(sparql) }

    update(triple) {

    }

    save(endpoint) {

    }

    persist(endpoint) {

    }

    reset() {
        this.reset();
    }

}

export default Model