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
        // the method may receive chained queries which depend upon each other
        // this is why it's important to run them as a chained sequence of promises
        // as well as the accumulation of the resuts
        // whenever you are running a query, for whatever reason, execute is called
        this.execute = (sparql) => {
            console.log((new Date()).getTime())
            var data = sparql.constructor === Array ? sparql : [sparql]
            var start = $.Deferred()
            // creates a sequence of deferred object, one for each sparql query
            var seq = _.map(data,(x) => {return {sparql:x,deferred:$.Deferred()}})
            // executes each sparql command and pushes the objects with the command and error or result
            // into accumulated object
            var last = _.reduce(
                seq,
                (previous,current) => {
                    previous.then((acc) => {
                            this.store.executeWithEnvironment(current.sparql,this.defaultDataset,this.namedDataset,(e,r) => {
                                acc.push({sparql:current.sparql,error:e,result:r})
                                // this calls the next then function with the accumulator in the data
                                current.deferred.resolve(acc)
                            })
                    });
                    return current.deferred.promise()},
                start.promise()
            )
            // starts the execution of the queries
            start.resolve([])
            return last.then((result) => {
                var deferred = $.Deferred()
                this.store.registeredGraphs((e,g) => {
                    this.namedDataset = _.uniq(_.map(g,(x) => x.nominalValue))
                    this.defaultDataset = this.namedDataset
                    deferred.resolve(result)
                })
                // returns a promise for the last state
                // which has an accumulator for all the sparql commands that have run
                return deferred.promise()
            })
        }
        this.reset = () => {
            // whoever is calling function receives outer
            var outer = $.Deferred();
            // inner is what is triggering the call on execute
            // has to wait until the rdfstore is ready
            var inner = $.Deferred();
            rdfstore.create((err,store) => {
                this.store = store;
                inner.resolve();
            })
            // this gets executed when the rdfstore is finished being created
            inner.promise()
                .then(() => this.execute(_.flattenDeep(this.upstream)))
                // the following code stores the labels of any new named graphs
                // so they can be queried against by rdfstore.js
                // without those labels the results will be empty
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
