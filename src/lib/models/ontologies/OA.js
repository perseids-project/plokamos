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

var queryMap = {
    "byIdentifier": (id) => {
        var id_phrase = id ? "BIND(<"+id+"> AS ?id)" : "?id rdf:type oa:Annotation ."
        return [
            "PREFIX oa: <http://www.w3.org/ns/oa#>",
            "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>",
            "SELECT DISTINCT ?id ?g ?s ?p ?o",
            "WHERE {",
            id_phrase,
            "{",
            "?id oa:hasTarget ?s .",
            "GRAPH ?g {?s ?p ?o}",
            "}",
            "UNION",
            "{",
            "?id oa:hasTarget/oa:hasSelector ?s .",
            "GRAPH ?g {?s ?p ?o}",
            "}",
            "UNION",
            "{",
            "?id oa:hasBody ?g .",
            "GRAPH ?g {?s ?p ?o}",
            "}",
            "UNION",
            "{",
            "?id oa:hasTarget ?t .",
            "?s oa:hasTarget ?t .",
            "GRAPH ?g {?s ?p ?o}",
            "}",
            "}"
        ].join("\n")
    },
    "http://www.w3.org/ns/oa#hasSelector": (id) => [
        "SELECT ?id ?g ?s ?p ?o",
        "WHERE {",
        "GRAPH ?g {",
        `${id || "?id"} <http://www.w3.org/ns/oa#hasTarget> ?target .`,
        "?target <http://www.w3.org/ns/oa#hasSelector> ?s .",
        "?s ?p ?o",
        "}}"
    ].join("\n"),
    "http://www.w3.org/ns/oa#hasBody": (id) => [
        "SELECT ?id ?subject ?predicate ?object ?graph",
        "WHERE {",
        "GRAPH ?g {?id <http://www.w3.org/ns/oa#hasBody> ?graph } .",
        "GRAPH ?graph {?subject ?predicate ?object}",
        "}"
    ].join("\n")
}

class OA {

    static expand(type) { return expandMap[type] || expandMap.default(type) }

    static simplify(type) { return simplifyMap[type] || simplifyMap.default(type) }

    static create(type) {return createMap[type] || createMap.default(type)}

    static query(type) {return queryMap[type]}

}

export default OA