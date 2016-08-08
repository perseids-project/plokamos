var Graph = {
    "http://www.w3.org/ns/oa#hasBody": (id) => [
        "SELECT ?id ?subject ?predicate ?object ?graph",
        "WHERE {",
        "GRAPH ?g {?id <http://www.w3.org/ns/oa#hasBody> ?graph } .",
        "GRAPH ?graph {?subject ?predicate ?object}",
        "}"
    ].join("\n")
};

export default Graph