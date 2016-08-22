/**
 * SPARQL Queries to retrieve
 * @type {{[http://www.w3.org/ns/oa#TextQuoteSelector]: ((p1?:*)=>string)}}
 */

var Selectors = {
    "http://www.w3.org/ns/oa#hasSelector": (id) => [
        "SELECT ?id ?g ?s ?p ?o",
        "WHERE {",
        "GRAPH ?g {",
        `${id || "?id"} <http://www.w3.org/ns/oa#hasTarget> ?target .`,
        "?target <http://www.w3.org/ns/oa#hasSelector> ?s .",
        "?s ?p ?o",
        "}}"
    ].join("\n"),
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type": (selectorTriples) => _.find(selectorTriples,(t) => t.p.value.endsWith("type")).o.value,
    "http://www.w3.org/ns/oa#TextQuoteSelector": (selectorTriples) => {
        var selectorObject = {}
        selectorObject.type = _.find(selectorTriples,(t) => t.p.value.endsWith("type")).o.value
        selectorObject.prefix = _.find(selectorTriples,(t) => t.p.value.endsWith("prefix")).o.value
        selectorObject.exact = _.find(selectorTriples,(t) => t.p.value.endsWith("exact")).o.value
        selectorObject.suffix = _.find(selectorTriples,(t) => t.p.value.endsWith("suffix")).o.value
        return selectorObject
    }
}

export default Selectors