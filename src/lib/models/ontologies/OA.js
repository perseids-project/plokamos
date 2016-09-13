import _ from 'lodash'
import TextQuoteAnchor from 'dom-anchor-text-quote';

var knowResources = []
var labels = {}

var namespaces = [
    {
        uri:"http://www.w3.org/ns/oa#",
        prefix:"oa:"
    }
]

var expandMap = {
    "http://www.w3.org/ns/oa#TextQuoteSelector": (selector) =>
        _.chain(["prefix","exact","suffix"])
            .map((pos) => selector[pos] ? {
                g:{type:"uri",value:"http://data.perseus.org/graphs/persons"},
                s:{type:"uri",value:selector.id},
                p:{type:"uri",value:`http://www.w3.org/ns/oa#${pos}`},
                o:{type:"literal",value:selector[pos]}
            } : undefined)
            .concat({
                g:{type:"uri",value:"http://data.perseus.org/graphs/persons"},
                s:{type:"uri",value:selector.id},
                p:{type:"uri",value:"http://www.w3.org/1999/02/22-rdf-syntax-ns#type"},
                o:{type:"uri",value:"http://www.w3.org/ns/oa#TextQuoteSelector"}
            })
            .compact()
            .value(),
    "default": (obj) => {
        var ns = obj.replace ? _.find(namespaces,(ns) => expandMap[ns.uri+obj.replace(ns.prefix,'')]) : undefined
        var resolved = ns ? expandMap[ns.uri+obj.replace(ns.prefix,'')] : undefined
        return resolved ? resolved : (x) => x
    }
}

var simplifyMap = {
    "http://www.w3.org/ns/oa#TextQuoteSelector": (selectorTriples) => { // planned: rename to bindings
        var selectorObject = {}
        selectorObject.type = _.find(selectorTriples,(t) => t.p.value.endsWith("type")).o.value
        selectorObject.prefix = _.find(selectorTriples,(t) => t.p.value.endsWith("prefix")).o.value
        selectorObject.exact = _.find(selectorTriples,(t) => t.p.value.endsWith("exact")).o.value
        selectorObject.suffix = _.find(selectorTriples,(t) => t.p.value.endsWith("suffix")).o.value
        return selectorObject
    },
    "default": (obj) => {
        var ns = obj.replace ? _.find(namespaces,(ns) => simplifyMap[obj.replace(ns.prefix,ns.uri)]) : undefined
        var resolved = ns ? simplifyMap[obj.replace(ns.prefix,ns.uri)] : undefined
        return resolved ? resolved : (x) => x
    }
}

var createMap = {
    "http://www.w3.org/ns/oa#TextQuoteSelector" : (element, selection) => TextQuoteAnchor.fromRange(element.tagName ? element : element.get(0),selection.getRangeAt(0)).toSelector(),
    "default": () => {} // planned: figure out sane default
}

class OA {

    static expand(type) { return expandMap[type] || expandMap.default(type) }

    static simplify(type) { return simplifyMap[type] || simplifyMap.default(type) }

    static create(type) {return createMap[type] || createMap.default(type)}

}

export default OA