import $ from 'jQuery'

var sparqlQuery = (endpoint, query, mime) => {
    query = query || "SELECT * WHERE { GRAPH ? {?s ?p ?o}} LIMIT 1000"
    mime = mime || "application/sparql-query"
    return $.ajax( { url:endpoint, type:'POST', data:query, contentType:mime, dataType:"json" } )
}

export default sparqlQuery
