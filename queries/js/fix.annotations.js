var result = []
var userQuery = "SELECT DISTINCT ?user WHERE { ?subject <http://www.w3.org/ns/oa#annotatedBy> ?user }"
var annotationQuery = (user) => `SELECT DISTINCT ?annotation WHERE { ?annotation <http://www.w3.org/ns/oa#annotatedBy> <${user}> }`
var selectEndpoint = "https://annotation.perseids.org/marmotta/sparql/select"
var updateEndpoint = "https://annotation.perseids.org/marmotta/sparql/update"
var selectPromise = (query) => $.ajax({ url:selectEndpoint, method:'POST', data:query, contentType:"application/sparql-query", headers:{ Accept:'application/sparql-results+json'} })
var updatePromise = (query) => $.ajax({ url:updateEndpoint, method:'POST', data:query, contentType:"application/sparql-update" })
selectPromise(userQuery)
    .then((data) => data.results.bindings.map((x) => x.user.value))
    .then((users) => users.map((user) => updatePromise(annotationQuery(user))))
    .then((results) => result = _.flatten(results.map((r) => r.responseJSON.results.bindings.map((b) => b.annotation.value))))



var userQuery = "SELECT DISTINCT ?annotation WHERE { ?annotation <http://www.w3.org/ns/oa#annotatedBy> ?body }"
var userQuery = "SELECT DISTINCT ?annotation WHERE { GRAPH ?annotation { ?s ?p ?o } }"