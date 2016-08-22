var Annotation = {
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
    }
};

export default Annotation