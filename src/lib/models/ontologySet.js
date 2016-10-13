import _ from 'lodash'
import $ from 'jquery'
import Ontology from './vocabularies/ontology'
import sparqlQuery from './io/sparqlRetriever'

/**
 * Symbols for private class members
 * @type {Symbol}
 */
const all = Symbol()
const scoring = Symbol()
const endpoint = Symbol()
var self;


class OntologySet {

    constructor(ontologies) {
        self = this
        self[all] = _.map(ontologies,(x) => x)
        self[scoring] = (matrix) => {
            let elements = _.chain(matrix).flattenDeep()
            return elements.sum().value() / elements.value().length
        }
    }

    /**
     * Determine which ontology to use
     * @param data The resource, triple or motif to test
     * @param keepEnum Flag for requesting the test result
     * @returns {*} The highest scoring ontology
     */
    test(data, keepEnum) {
        /*let res = _.chain(self[all])
            .map((o) => o.test(data)) // run individual tests
            .zip(self[all]) // align with ontologies
            .sortBy((a) => self[scoring](a[0])) // rank with a scoring function
            .head() // get the highest ranked result
            .value() // return*/
        let flt = _.filter(self[all], (o) => o.simplify().length)
        let tst = _.map(flt,(o) => o.test(data))
        let zpd = _.zip(tst,flt)
        let srt = _.sortBy(zpd,(a) => self[scoring](a[0]))
        let res = _.head(srt)
        return keepEnum || !res ? res : res[1] // remove the test result ?
    }

    /**
     * Simplify a graph from a general, indirect form into a human-readable one
     * @param data
     * @param ontology
     * @returns {*}
     */
    simplify(data, ontology) {
        let simplifier = ontology && this[all].filter((o) => o.name === ontology).length ? _.head(this[all].filter((o) => o.name === ontology)) : test(data)
        return simplifier.simplify(data)

    }

    /**
     * Expand a simplified graph
     * @param data
     * @param ontology
     * @returns {*}
     */
    expand(data, ontology) {
        let expander = ontology && this[all].filter((o) => o.name === ontology).length ? _.head(this[all].filter((o) => o.name === ontology)) : test(data)
        return expander.expand(data)
    }

    /**
     * Get a human-readable, descriptive string for a resource or graph
     * @param data
     * @param ontology
     * @returns {*}
     */
    label(data, ontology) {
        let labeler = ontology && this[all].filter((o) => o.name === ontology).length ? _.head(this[all].filter((o) => o.name === ontology)) : test(data)
        return labeler.label(data)

    }

    /**
     * Get a list of namespaces with URI & canonical prefix
     * @param ontology
     */
    namespaces(ontology) {
        // todo: check for ontology, else return:
        _.chain(this[all]).filter((o) => !ontology || o.name === ontology).map('namespace').flatten().value()
    }

    /**
     * Get a list of URIs, e.g. for autocomplete
     * @param ontology
     */
    resources(ontology) {
        // todo: check for ontology, else return:

        _.chain(this[all]).filter((o) => !ontology || o.name === ontology).map('resources').flatten().value()
    }

    /**
     * Do async initialization of individual ontologies
     * @returns {*} Promise that resolves when ontologies are ready
     */
    static from(ep) {
        this[endpoint] = ep
        let query = `
            prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            prefix pmeta: <http://data.perseids.org/meta#>
            
            SELECT ?uri WHERE {
              GRAPH <http://data.perseids.org/namespaces> {
                ?uri rdf:type pmeta:namespace 
              }
            }
        `
        sparqlQuery(this[endpoint], query)
            .then((data) => $.when(...data.results.bindings.map((binding) => Ontology.get(binding.uri.value).from(this[endpoint]))))
            .then(function() {return new OntologySet(arguments)})
    }

}

export default OntologySet