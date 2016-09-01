import _ from 'lodash'

/**
 * Mostly utility functions to deal with SPARQL formats and operations
 * There are currently 3 formats in use:
 * GSPO is a lightweight quad object without data typing,
 * bindings are JSON serializations of SPARQL responses -> always keep GSPO notation!
 * SPARQL is string serialization for SPARQL STATEMENTS -> use GRAPH keyword!
 */

class SPARQL {
    static gspoToBinding(gspo) {return _.mapValues(gspo, (prop) => ""/* todo: switch for uri, literal, bnode with a regex (what about hypothesis?)*/)}
    static bindingToGspo(binding) {return _.mapValues(binding,(prop) => prop.value)}
    static bindingToSPARQL(binding) {
        var strings = _.mapValues(binding, (prop) => { switch (prop.type) {
            case "uri": return `<${prop.value}>`
            case "literal": return !prop.datatype ? `"${prop.value}"` : `"${prop.value}"^^<${prop.datatype}>`
            case "bnode": return prop.value.startsWith("_:") ? prop.value : `_:${prop.value}`
        }})
        return strings.g ? `GRAPH ${strings.g} {${strings.s} ${strings.p} ${strings.o} }` : `${strings.s} ${strings.p} ${strings.o} .`
    }
    static bindingsToDelete(bindings) {
        return _.flatten(["DELETE DATA {",bindings.map(this.bindingToSPARQL),"}"]).join("\n")
    }
    static bindingsToInsert(bindings) {
        return _.chain(bindings)
            .groupBy('g.value')
            .map((v,k) => _.concat("INSERT DATA { GRAPH <"+k+"> {",v.map((quad) => this.bindingToSPARQL(_.omit(quad,'g'))),"}}").join("\n"))
            .value()
    }
}

export default SPARQL