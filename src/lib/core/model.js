import oaByUrnRetriever from '../io/oaByUrnRetriever'
import sparql from './sparql'
import rdfstore from 'rdfstore'
import _ from 'lodash'
import $ from 'jquery'

class Model {

    constructor () {
        this.defaultDataset = []
        this.namedDataset = []
        this.store = {};
    }

    load(endpoint, urn, user) {
        var promise = endpoint.slice(-5)==='.json' ? $.getJSON(endpoint) : oaByUrnRetriever(endpoint, urn)
        // TODO: should be done in its own class, resulting in promise for store, which gets assigned to this.store
        return promise
            .then((data) => {
                var deferred = $.Deferred()
                rdfstore.create((err,store) => {
                    this.store = store
                    deferred.resolve(data)
                })
                return deferred.promise()
            })
            .then((data) => sparql.bindings2insert(data.results.bindings))
            .then((data) => {
                var start = $.Deferred()
                var end = $.Deferred()
                var seq = _.map(data,(x) => {return {sparql:x,deferred:$.Deferred()}})
                seq.push({sparql:undefined,deferred:end})
                _.reduce(
                    seq,
                    (previous,current) => {
                        previous.then(() => {
                            if (current.sparql) {
                                this.store.execute(current.sparql,current.deferred.resolve)
                            } else {
                                this.store.registeredGraphs((e,g) => current.deferred.resolve(g))
                            }
                        });
                        return current.deferred.promise()},
                    start.promise()
                )
                start.resolve()
                return end.promise()
            })
            .then((data) => {
                this.namedDataset = _.uniq(_.map(data,(x) => x.nominalValue))
                this.defaultDataset = this.namedDataset[0]
            })
    }


    
    execute(sparql) {
        var deferred = $.Deferred()
        this.store.executeWithEnvironment(sparql,this.defaultDataset,this.namedDataset,(error, graph) => deferred.resolve(graph))
        return deferred.promise()
    }

    update(triple) {

    }

    save(endpoint) {

    }

    persist(endpoint) {

    }

}

export default Model