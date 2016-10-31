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
    "http://www.w3.org/ns/oa#TextQuoteSelector": (selector, defaultGraph) =>
        _.chain(["prefix","exact","suffix"])
            .map((pos) => selector[pos] ? {
                g:{type:"uri",value:defaultGraph || "http://data.perseus.org/graphs/persons"},
                s:{type:"uri",value:selector.id},
                p:{type:"uri",value:`http://www.w3.org/ns/oa#${pos}`},
                o:{type:"literal",value:selector[pos]}
            } : undefined)
            .concat({
                g:{type:"uri",value:defaultGraph || "http://data.perseus.org/graphs/persons"},
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

    static getBodies(xs) {
        let ids = xs.filter((x) => (x.p.value || x.p).replace("oa:","http://www.w3.org/ns/oa#") === "http://www.w3.org/ns/oa#hasBody").map((x) => (x.o.value || x.o))
        let annotation = xs.filter((x) => ((x.o.value || x.o) === "http://www.w3.org/ns/oa#Annotation")).map((x) => (x.s.value || x.s))
        let partition = _.groupBy(ids,(id) => _.find(xs,(x) => annotation.indexOf(id)+1) ? "graphs" : "resources")

        let result1 = (partition.graphs || []).map((id) => _.filter(xs,(x) => (x.g.value || x.g) === id))
        let result2 = (partition.resources || []).map((id) => _.filter(xs,(x) => (x.s.value || x.s) != id))
        return _.concat(result1,result2)
    }

    static getTargets(xs) {
        let targetObjs = _.filter(xs,(x) => (x.p.value || x.p).replace("oa:","http://www.w3.org/ns/oa#") === "http://www.w3.org/ns/oa#hasTarget")
        return targetObjs.map((targetObj) => _.filter(xs, (x) => (x.s.value || x.s) === (targetObj.o.value || targetObj.o)))
    }

    static getSelectors(xs) {
        let selectorObjs = _.filter(xs,(x) => (x.p.value || x.p).replace("oa:","http://www.w3.org/ns/oa#") === "http://www.w3.org/ns/oa#hasSelector")
        return selectorObjs.map((selectorObj) => _.filter(xs, (x) => (x.s.value || x.s) === (selectorObj.o.value || selectorObj.o)))
    }

    static getAnnotator(xs) {
        let annotatorObj = _.find(xs,(x) => (x.p.value || x.p).replace("oa:","http://www.w3.org/ns/oa#") === "http://www.w3.org/ns/oa#annotatedBy")
        return annotatorObj.o.value || annotatorObj.o
    }

    static makeTitle(annotationId, defaultGraph, title) {
        return [{
            "g": {"type": "uri", "value": defaultGraph},
            "s": {"type": "uri", "value": annotationId},
            "p": {"type": "uri", "value": "http://purl.org/dc/terms/title"},
            "o": {"type": "literal", "value": title}
        }]
    }

    // todo: make these higher-order functions

    static makeMotivation(annotationId, defaultGraph, motivation) {
        return [{
            "g": {"type": "uri", "value": defaultGraph},
            "s": {"type": "uri", "value": annotationId},
            "p": {"type": "uri", "value": "http://www.w3.org/ns/oa#motivatedBy"},
            "o": {"type": "literal", "value": motivation}
        }]
    }

    static makeAnnotatedAt(annotationId, defaultGraph) {
        return [{
            "p": {"type": "uri", "value": "http://www.w3.org/ns/oa#annotatedAt"},
            "g": {"type": "uri", "value": defaultGraph},
            "s": {"type": "uri", "value": annotationId},
            "o": {
                "datatype": "http://www.w3.org/2001/XMLSchema#dateTimeStamp",
                "type": "literal",
                "value": (new Date()).toISOString()
            }
        }]
    }

    static makeAnnotatedBy(annotationId, defaultGraph, userId) {
        return [{
            "p": {"type": "uri", "value": "http://www.w3.org/ns/oa#annotatedBy"},
            "g": {"type": "uri", "value": defaultGraph},
            "s": {"type": "uri", "value": annotationId},
            "o": {"type": "uri", "value": userId}
        }] // NOTE: describe <o> query
    }

    static makeCore(annotationId, defaultGraph) {
        return [{
            "g": {"type": "uri", "value": defaultGraph},
            "s": {"type": "uri", "value": annotationId},
            "p": {"type": "uri", "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"},
            "o": {"type": "uri", "value": "http://www.w3.org/ns/oa#Annotation"}
        },
        {
            "g": {"type": "uri", "value": defaultGraph},
            "s": {"type": "uri", "value": annotationId},
            "p": {"type": "uri", "value": "http://purl.org/dc/terms/source"},
            "o": {"type": "uri", "value": "https://github.com/perseids-project/plokamos"}
        },
        {
            "g": {"type": "uri", "value": defaultGraph},
            "s": {"type": "uri", "value": annotationId},
            "p": {"type": "uri", "value": "http://www.w3.org/ns/oa#serializedBy"},
            "o": {"type": "uri", "value": "https://github.com/perseids-project/plokamos"} // todo: add version
        },
        {
            "g": {"type": "uri", "value": defaultGraph},
            "s": {"type": "uri", "value": annotationId},
            "p": {"type": "uri", "value": "http://www.w3.org/ns/oa#motivatedBy"},
            "o": {"type": "uri", "value": "http://www.w3.org/ns/oa#identifying"}
        },
        {
            "g": {"type": "uri", "value": defaultGraph},
            "s": {"type": "uri", "value": annotationId},
            "p": {"type": "uri", "value": "http://www.w3.org/ns/oa#hasBody"},
            "o": {"type": "uri", "value": annotationId}
        }
    ]}

    static makeTarget(annotationId, defaultGraph, targetId, selectorId, urn) {
        return [{
            "p": {"type": "uri", "value": "http://www.w3.org/ns/oa#hasTarget"},
            "g": {"type": "uri", "value": defaultGraph},
            "s": {"type": "uri", "value": annotationId},
            "o": {"type": "uri", "value": targetId}
        },
        {
            "p": {"type": "uri", "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"},
            "g": {"type": "uri", "value": defaultGraph},
            "s": {"type": "uri", "value": targetId},
            "o": {"type": "uri", "value": "http://www.w3.org/ns/oa#SpecificResource"}
        }, // planned: figure out alternatives for non-text targets
        {
            "p": {"type": "uri", "value": "http://www.w3.org/ns/oa#hasSource"},
            "g": {"type": "uri", "value": defaultGraph},
            "s": {"type": "uri", "value": targetId},
            "o": {"type": "uri", "value": urn}
        },
        {
            "p": {"type": "uri", "value": "http://www.w3.org/ns/oa#hasSelector"},
            "g": {"type": "uri", "value": defaultGraph},
            "s": {"type": "uri", "value": targetId},
            "o": {"type": "uri", "value": selectorId}
        }]
    }

    static expand(type) { return expandMap[type] || expandMap.default(type) }

    static simplify(type) { return simplifyMap[type] || simplifyMap.default(type) }

    static create(type) {return createMap[type] || createMap.default(type)}

    static query(type) {return queryMap[type]}

}

export default OA