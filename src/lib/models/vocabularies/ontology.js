import $ from 'jquery'
import _ from 'lodash'
import Vocabulary from './vocabulary'
import Transformation from './transformation'

const vocabulary = Symbol()
const transformation = Symbol()

/**
 * Individual ontology class
 *
 * Ontologies bundle a number of functions based in a single namespace.
 * Vocabularies provide services to list and transform resource URIs and labels.
 * Transformations map between more and less direct representations of semantic motifs.
 */
class Ontology {
    /**
     * Constructor with submodules.
     * Empty arguments are substituted with Noop versions of the modules.
     *
     * @param voc The vocabulary service to use.
     * @param trans The transformation service to use.
     */
    constructor(voc, trans) {
        this[vocabulary] = voc
        this[transformation] = trans
    }

    // transform:
    /**
     * Transform a graph to a more direct representation, remove intermediary structures. Commonly used to prepare statements for user interactions.
     *
     * @param id The annotation id
     * @param graph The annotation graph, including OA frame
     */
    simplify(body, id){
        return this[transformation].simplify(body, id)
    }

    /**
     * Expand a graph to its canonical, machine-actionable representation. Generally this is a more indirect and explicit structure than then one presented to humans.
     *
     * @param gspo The graph to transform.
     * @param graphs The complete list of graphs.
     */
    expand(gspo, graphs){
        return this[transformation].expand(gspo, graphs)
    }

    // vocab:
    /**
     * Returns namespace object
     *
     * @returns {*} An object with uri and prefix fields
     */
    namespace() {
        return this[vocabulary].namespace()
    }

    /**
     * Test if ontology is adequate for use on resource
     *
     * @param resource A resource, triple or motif.
     * @returns {*} A matrix describing the matching between ontology and data.
     */
    test(resource) {
        let coefficients = {g:0,s:1,p:3,o:1}
        switch (JSON.stringify(resource)[0]) {
            case "[":
                return resource.map((x) => this.test(x))
                break;
            case "{":
                return _.map(resource,(v,k) => this.test(v.value || v) ? coefficients[k]: 0)
                break;
            default:
                return this[vocabulary].test(resource)
        }
    }

    /**
     * Map between URIs and human-readable labels. Returns the (shortened) URI if no matching label was found.
     *
     * @param resource A URI.
     * @returns {*} A human-readable string or the unchanged URI
     */
    label(resource) {
        return this[vocabulary].label(resource)
    }

    /**
     * Returns the long-form URI for a label or shortened URI.
     *
     * @param string Human-readable label or shortened URI.
     * @returns {*} Long-form URI.
     */
    unlabel(string) {
        return this[vocabulary].unlabel(string)
    }

    /**
     * Returns a description that can support disambiguation or correct usage.
     *
     * @param string A URI or label to explain.
     * @returns {*} Description for input string or string itself if no matching description available.
     */
    description(resource) {
        //todo: retrieve from endpoint
        return resource
    }

    resources() {
        return this[vocabulary].resources()
    }

    /**
     * Factory function
     * @param uri
     */
    static get(uri) {
        return {
            from: (endpoint) => $.when(
                Vocabulary.get(uri).from(endpoint),
                Transformation.get(uri).from(endpoint)
            ).then((voc, trans) => {
                return new Ontology(voc, trans)
            })
        }
    }
}

export default Ontology