import _ from 'lodash'
import $ from 'jquery'
import OA from './ontologies/OA'
import SNAP from './ontologies/SNAP'
// import smith from './ontologies/SMITH'

/**
 * Symbols for private class members
 * @type {Symbol}
 */
const all = Symbol()
const scoring = Symbol()
const endpoint = Symbol()

class Ontology {

    constructor(app) {
        let endpoint = app.getEndpoint()
        endpoint = endpoint.config || endpoint.read || endpoint.query
        this[all] = [new SNAP(endpoint), new OA(endpoint)]
        this[scoring] = () => {}
    }

    /**
     * Do async initialization of individual ontologies
     * @returns {*} Promise that resolves when ontologies are ready
     */
    init() {
        return $.when(...this[all].map((o) => o.load(this[endpoint])))
    }

    /**
     * Determine which ontology to use
     * @param data
     * @param keepEnum
     * @returns {*}
     */
    test(data, keepEnum) {
        return _.chain(this[all])
            .map(_.test(data)) // run individual tests
            .zip(this[all]) // align with ontologies
            .sortBy(this[scoring]) // rank with a scoring function
            .head() // get the highest ranked result
            .map((res) => keepEnum || !res ? res : res[1]) // remove the test result ?
            .value() // return
    }

    /**
     * Simplify a graph from a general, indirect form into a human-readable one
     * @param data
     * @param ontology
     * @returns {*}
     */
    simplify(data, ontology) {
        let simplifier = ontology && this[all].filter((o) => o.name === ontology).length ? this[all].filter((o) => o.name === ontology)[0] : test(data)
        return simplifier.simplify(data)

    }

    /**
     * Expand a simplified graph
     * @param data
     * @param ontology
     * @returns {*}
     */
    expand(data, ontology) {
        let expander = ontology && this[all].filter((o) => o.name === ontology).length ? this[all].filter((o) => o.name === ontology)[0] : test(data)
        return expander.expand(data)
    }

    /**
     * Get a human-readable, descriptive string for a resource or graph
     * @param data
     * @param ontology
     * @returns {*}
     */
    label(data, ontology) {
        let labeler = ontology && this[all].filter((o) => o.name === ontology).length ? this[all].filter((o) => o.name === ontology)[0] : test(data)
        return labeler.label(data)

    }

    /**
     * Get a list of namespaces with URI & canonical prefix
     * @param ontology
     */
    namespaces(ontology) {
        // todo: check for ontology, else return:
        _.chain(this[all]).map('namespaces').flatten().value()
    }

    /**
     * Get a list of URIs, e.g. for autocomplete
     * @param ontology
     */
    resources(ontology) {
        // todo: check for ontology, else return:
        _.chain(this[all]).map('namespaces').flatten().value()
    }

}

export default Ontology