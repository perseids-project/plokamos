import _ from 'lodash'

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

    static get(uri) {
        let query = `
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            SELECT ?prefix ?resource ?label WHERE {
                GRAPH <http://data.perseids.org/namespaces> {
                    BIND(<${uri}> AS ?uri)
                    ?uri rdf:type perseidsmeta:namespace .
                    ?uri perseidsmeta:prefix ?prefix
                    ?uri perseidsmeta:member ?resource .
  	                ?resource rdfs:label ?label
                }
            }
        `
        return {
            from: (endpoint) => {
                return $.ajax()
                    .then((bindings) => {
                        let prefix = _.uniq(data.results.bindings.map((binding) => (binding.prefix || {}).value))[0]||""
                        let terms = {}
                        data.results.bindings.forEach((binding) => {
                            obj[`${binding.resource.value}`] = binding.label ? binding.label.value : binding.resource.value.replace(uri,prefix)
                        })
                        return new Vocabulary(uri,prefix,terms)
                    })
            }
        }
    }

}