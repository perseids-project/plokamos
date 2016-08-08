import _ from 'lodash'

var bindings2insert = (bindings) => {
    // check head length, decide whether everything goes into default or split for named graphs
    // if named graphs,
    // groupBy named graphs
    var grouped = _.groupBy(bindings, (triple) => triple.g.value);
    // mapped bindings to triples
    var mapped = _.mapValues(grouped, (graph) => graph.map((triple) => {
            _.unset(triple, 'g');
            var simple_triple = _.mapValues(triple, (element) => {
                switch (element.type) {
                    case "uri":
                        return "<" + element.value + ">";
                    case "bnode":
                        return "<_:" + element.value + ">";
                    case "literal":
                        return element.datatype ? "\"" + element.value + "\"^^<" + element.datatype + ">" : "\"" + element.value + "\"";
                }
            });
            return simple_triple.s + " " + simple_triple.p + " " + simple_triple.o + " .";
        })
    );
    // return SPARQL INSERT queries
    return _.map(_.keys(mapped), (k) => {
        var graph = k.indexOf(":") + 1 ? k : "_:" + k
        return "INSERT DATA { GRAPH <" + graph + "> {\n" + mapped[k].join("\n") + "\n}}";
    });
}

export default {
    bindings2insert: bindings2insert
}