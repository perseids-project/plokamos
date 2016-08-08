/**
 * SPARQL Queries to retrieve
 * @type {{[http://www.w3.org/ns/oa#TextQuoteSelector]: ((p1?:*)=>string)}}
 */

var Selectors = {
    "http://www.w3.org/ns/oa#TextQuoteSelector": (id) => [
        "SELECT ?id ?prefix ?exact ?suffix",
        "WHERE {",
        "GRAPH ?g {",
        `${id || "?id"} <http://www.w3.org/ns/oa#hasTarget> ?target .`,
        "?target <http://www.w3.org/ns/oa#hasSelector> ?selector .",
        "?selector <http://www.w3.org/ns/oa#prefix> ?prefix .",
        "?selector <http://www.w3.org/ns/oa#exact> ?exact .",
        "?selector <http://www.w3.org/ns/oa#suffix> ?suffix .",
        "}}"
    ].join("\n")
}

export default Selectors