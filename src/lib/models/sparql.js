import _ from 'lodash'

/**
 * Mostly utility functions to deal with SPARQL formats and operations
 * There are currently 3 formats in use:
 * GSPO is a lightweight quad object without data typing,
 * bindings are JSON serializations of SPARQL responses -> always keep GSPO notation!
 * SPARQL is string serialization for SPARQL STATEMENTS -> use GRAPH keyword!
 */

class SPARQL {
    static gspoToBinding(gspo) {return _.mapValues(gspo, (prop) => {
        if ((prop.startsWith("http://") || prop.startsWith("urn:")) && !(prop.indexOf(' ')+1)) {
            return {type:"uri",value:prop}
        } else if (prop.startsWith("_:")) {
            return {type:"bnode",value:prop}
        } else { // planned: come back and use regex properly
            if (!prop.replace(/\d+/g,'')) {
                return {type:"literal",datatype:"http://www.w3.org/2001/XMLSchema#int",value:prop}
            } else if (prop.replace(/\d+/g,'').startsWith("--T::.")) {
                return {type:"literal",datatype:"http://www.w3.org/2001/XMLSchema#dateTimeStamp",value:prop}
            } else {
                return {type:"literal",value:prop}
            }
        }
    }/* planned: switch for uri, literal, bnode with a regex (what about hypothesis?)*/)
    }
    static bindingToGspo(binding) {return _.mapValues(binding,(prop) => prop.value)}
    static bindingToSPARQL(binding) {
        var strings = _.mapValues(binding, (prop) => { switch (prop.token || prop.type) {
            case "uri": return `<${prop.value}>`
            case "literal": return !(prop.datatype || (prop.token && prop.type)) ? `"${prop.value}"` : `"${prop.value}"^^<${prop.datatype || prop.type}>`
            case "bnode": return prop.value.startsWith("_:") ? prop.value : `_:${prop.value}`
        }})
        return strings.g ? `GRAPH ${strings.g} {${strings.s} ${strings.p} ${strings.o} }` : `${strings.s} ${strings.p} ${strings.o} .`
    }
    static bindingsToDelete(bindings) {
        return _.chain(bindings)
            .flatten()
            .groupBy('g.value')
            .map((v,k) => _.concat("DELETE DATA { GRAPH <"+k+"> {",v.map((quad) => SPARQL.bindingToSPARQL(_.omit(quad,'g'))),"}}").join("\n"))
            .value()
    }

    static bindingsToInsert(bindings) {
        return _.chain(bindings)
            .flatten()
            .groupBy('g.value')
            .map((v,k) => _.concat("INSERT DATA { GRAPH <"+k+"> {",v.map((quad) => SPARQL.bindingToSPARQL(_.omit(quad,'g'))),"}}").join("\n"))
            .value()
    }
}

export default SPARQL