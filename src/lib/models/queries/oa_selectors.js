/**
 * SPARQL Queries to retrieve
 * @type {{[http://www.w3.org/ns/oa#TextQuoteSelector]: ((p1?:*)=>string)}}
 */

var Selectors = {
    // planned: figure out if still used anywhere; move to ontologies/OA.js; i need a system to select queries depending on arguments
    "http://www.w3.org/ns/oa#hasSelector": (id) => [
        "SELECT ?id ?g ?s ?p ?o",
        "WHERE {",
        "GRAPH ?g {",
        `${id || "?id"} <http://www.w3.org/ns/oa#hasTarget> ?target .`,
        "?target <http://www.w3.org/ns/oa#hasSelector> ?s .",
        "?s ?p ?o",
        "}}"
    ].join("\n")}

export default Selectors