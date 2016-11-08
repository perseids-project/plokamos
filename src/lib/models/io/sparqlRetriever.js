import $ from 'jquery'

var sparqlQuery = (endpoint, query, mime) => {
    query = query || "SELECT * WHERE { GRAPH ? {?s ?p ?o}} LIMIT 1000"
    mime = mime || "application/sparql-query"
    return $.ajax( { url:endpoint, method:'POST', data:query, contentType:mime, headers:{ Accept:'application/sparql-results+json'} } )
}

export default sparqlQuery
