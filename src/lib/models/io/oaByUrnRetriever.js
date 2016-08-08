import sparqlQuery from './sparqlRetriever.js'

var sparqlSelect = (urn) => [
    "PREFIX oa: <http://www.w3.org/ns/oa#>",
    "SELECT DISTINCT ?s ?p ?o ?g",
    "WHERE {",
    "# bind parameters",
    `BIND(<${urn}> AS ?urn)`,
    "# select annotations",
    "?annotation oa:hasTarget/oa:hasSource ?urn .",
    "# retrieve relevant direct and indirect properties",
    "{",
    "?annotation oa:hasTarget ?s .",
    "GRAPH ?g {?s ?p ?o}",
    "}",
    "UNION",
    "{",
    "?annotation oa:annotatedBy ?s .",
    "GRAPH ?g {?s ?p ?o}",
    "}",
    "UNION",
    "{",
    "?annotation oa:serializedBy ?s .",
    "GRAPH ?g {?s ?p ?o}",
    "}",
    "UNION",
    "{",
    "?annotation oa:hasTarget/oa:hasSelector ?s .",
    "GRAPH ?g {?s ?p ?o}",
    "}",
    "UNION",
    "{",
    "?annotation oa:hasBody ?g .",
    "GRAPH ?g {?s ?p ?o}",
    "}",
    "UNION",
    "{",
    "BIND(?annotation AS ?s)",
    "GRAPH ?g {?s ?p ?o}",
    "}",
    "}"
].join("\n")

var oaQuery = (endpoint, urn) => {
    var query = urn ? sparqlSelect(urn) : undefined
    return sparqlQuery(endpoint, query)
};

export default oaQuery