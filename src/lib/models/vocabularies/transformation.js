import SPARQL from '../sparql'

var pmetaMap = {
    "" : "s",
    "" : "p",
    "" : "o"
}

var simplification = (rules) => (id,v) => {
    let subjectRule = _.find(rules, (r) => r.target==="http://.../Subject")
    let predicateRule = _.find(rules, (r) => r.target==="http://.../Predicate")
    let objectRule = _.find(rules, (r) => r.target==="http://.../Object")
    let subject = _.find(v, (o) => o[pmetaMap[subjectRule.constraint]] === subjectRule.value)[pmetaMap[subjectRule.source]].value
    let predicate = _.find(v, (o) => o[pmetaMap[predicateRule.constraint]] === predicateRule.value)[pmetaMap[predicateRule.source]].value
    let object = _.find(v, (o) => o[pmetaMap[objectRule.constraint]] === objectRule.value)[pmetaMap[objectRule.source]].value

    return {s: subject, p: predicate, o: object}
}

var expansion = (rules) => (id,v) => {
    
}

class Transformation {

    constructor() {

    }

    simplify(grouped) {
        // grouped has graph uris as keys and bindings as values
        // need to determine which rules to use
        return _.mapValues(grouped,this[simplify])
    }

    expand(list) {

    }

    static get() {
        let query = `
            prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            prefix pmeta: <http://data.perseids.org/meta#>
            
            SELECT ?transformation ?target ?constraint ?value ?source WHERE {
              GRAPH <http://data.perseids.org/namespaces> {
                BIND(<${uri}> AS ?uri)
                ?uri rdf:type pmeta:namespace .
                ?uri pmeta:hasTransformation ?transformation.
                ?transformation pmeta:hasTarget ?t .
                ?t rdf:type ?target .
                ?t pmeta:hasConstraint ?c .
                ?c rdf:type ?constraint .
                ?c pmeta:hasURI ?value .
                ?t pmeta:hasSource ?source 
              }
            }
        `
        return {
            from: (endpoint) => {
                return $.ajax()
                    .then((data) => {
                        let transformations = _.chain(data.results.bindings)
                            .map(SPARQL.bindingToGspo)
                            .groupBy('transformation')
                            .keys()
                            .map((rules) => expression(rules))
                            .value()

                        return new Vocabulary(uri,prefix,terms)
                    })
            }
        }

    }

}