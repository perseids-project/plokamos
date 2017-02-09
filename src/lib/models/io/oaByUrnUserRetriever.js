import sparqlQuery from './sparqlRetriever.js'

var sparqlSelect = (urn,user) =>  `
        PREFIX oa: <http://www.w3.org/ns/oa#>
        SELECT DISTINCT ?s ?p ?o ?g
        WHERE {
        # retrieve relevant direct and indirect properties
            {
                ?annotation oa:hasTarget ?s .
                GRAPH ?g {?s ?p ?o}
            }
            UNION
            {
                BIND(?annotation AS ?s)
                GRAPH ?g {?s ?p ?o}
            }
            UNION
            {
                ?annotation oa:serializedBy ?s .
                GRAPH ?g {?s ?p ?o}
            }
            UNION
            {
                ?annotation oa:hasTarget/oa:hasSelector ?s .
                GRAPH ?g {?s ?p ?o}
            }
            UNION
            {
                ?annotation oa:hasBody ?g .
                GRAPH ?g {?s ?p ?o}
            }
            # select annotations
            {
                SELECT ?annotation
                WHERE {
                    ?annotation oa:annotatedBy <${user}> .
                    ?annotation oa:hasTarget/oa:hasSource ?address.
                    FILTER regex(?address, "^${urn}")
                }
            }
        }`

var oaQuery = (endpoint, urn, user) => {
    var query = urn && user ? sparqlSelect(urn, user) : undefined
    return sparqlQuery(endpoint, query)
};

export default oaQuery