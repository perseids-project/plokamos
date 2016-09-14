import SNAP from '../../models/ontologies/SNAP'

class Tooltip {
    constructor(app) {
        this.register = (jqElement) => {
            // planned: stringify should check ontology and select simplifier or stringify raw (.value)
            function stringify(obj) {
                var simplified = SNAP.simplify()(obj)
                return _.flatten(_.values(simplified)).map((o) => "<span class='tt-label tt-subject'>"+SNAP.label(o.s)+"</span><span class='tt-label tt-predicate'>"+SNAP.label(o.p)+"</span><span class='tt-label tt-object'>"+SNAP.label(o.o)+"</span>").join("<br>")
            }
            var graphs = jqElement.data('annotations')
            var description = stringify(graphs)//attr(field)
            jqElement.popover({
                container:"body",
                html:"true",
                trigger: "hover | click",
                placement: "auto top",
                title: jqElement.data('selector').exact,
                content: description
            })
        }
    }
}

export default Tooltip