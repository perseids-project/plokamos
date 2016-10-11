import $ from 'jquery'
import _ from 'lodash'
import Vocabulary from './vocabulary'
import Transformation from './transformation'

const vocabulary = Symbol()
const transformation = Symbol()

class Ontology {
    constructor(voc, trans) {
        this[vocabulary] = voc
        this[transformation] = trans
    }

    // transform:

    simplify(id, graph){
        this[transformation].simplify(id, graph)
    }

    expand(gspo, graphs){
        this[transformation].expand(gspo, graphs)
    }

    // vocab:

    namespace() {
        return this[vocabulary].namespace()
    }

    test(resource) {
        return _.chain(typeof resource === 'Array' ? resource : [resource]).map(_.values).reduce((result,obj) => result || this[vocabulary].test(obj), false).value()
    }

    label(resource) {
        return this[vocabulary].label(resource)
    }

    unlabel(string) {
        return this[vocabulary].unlabel(string)
    }

    description() {
        //todo: retrieve from endpoint
    }

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