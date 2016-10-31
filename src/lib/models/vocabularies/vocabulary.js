import _ from 'lodash'
import sparqlQuery from '../io/sparqlRetriever'

const URI = Symbol()
const PREFIX = Symbol()
const TERMS = Symbol()

class Vocabulary {

    constructor(uri,prefix,terms) {
        this[URI] = uri
        this[PREFIX] = prefix
        this[TERMS] = terms
    }

    namespace() {
        return {uri:this[URI],prefix:this[PREFIX]}
    }

    test(resource) {
        return this[TERMS][resource] || this[TERMS][resource.replace(this[PREFIX],this[URI])] || _.values(this[TERMS]).indexOf(resource)+1// todo: test for prefixed and labeled resources
    }

    label(resource) {
        return this[TERMS][resource] || this[TERMS][resource.replace(this[PREFIX],this[URI])] || resource
    }

    unlabel(string) {
        return _.invert(this[TERMS])[string]
    }

    description() {
        //todo: retrieve from endpoint
    }

    resources() {
        return _.keys(this[TERMS])
    }

    static get(uri) {
        let query = `
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            PREFIX pmeta: <http://data.perseids.org/meta#>
            SELECT DISTINCT ?prefix ?resource ?label WHERE {
                GRAPH <http://data.perseids.org/namespaces> {
                    BIND(<${uri}> AS ?uri)
                    ?uri rdf:type pmeta:namespace .
                    ?uri pmeta:prefix ?prefix .
                    ?uri pmeta:member ?resource .
  	                ?resource rdfs:label ?label
                }
            }
        `
        return {
            from: (endpoint) => {
                return sparqlQuery(endpoint, query)
                    .then((data) => {
                        let prefix = _.uniq(data.results.bindings.map((binding) => (binding.prefix || {}).value))[0]||""
                        let terms = {}
                        data.results.bindings.forEach((binding) => {
                            terms[`${binding.resource.value}`] = binding.label ? binding.label.value : binding.resource.value.replace(uri,prefix)
                        })
                        return new Vocabulary(uri,prefix,terms)
                    })
            }
        }
    }

}

export default Vocabulary