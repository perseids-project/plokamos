import SNAP from '../../models/ontologies/SNAP'

class Tooltip {
    constructor(app) {

        $(document).on('click', '.popover-footer > .btn', (e) => {
            $('.popover').map((i,j) => $(document.querySelectorAll(`[aria-describedby="${j.id}"]`)).click())
            $('#popover-selection').popover('destroy')
        })

        this.register = (jqElement) => {
            // planned: stringify should check ontology and select simplifier or stringify raw (.value)
            function stringify(obj) {
                var simplified = SNAP.simplify()(obj)
                return "<span class='popover-source' data-source-id='"+jqElement.attr('id')+"'></span><div class='popover-list'>"+_.flatten(
                    _.values(simplified)).map((o) =>
                `<span class='tt-label tt-subject' title='${o.s}'>${SNAP.label(o.s)}</span> 
                <span class='tt-label tt-predicate' title='${o.p}'>${SNAP.label(o.p)}</span> 
                <span class='tt-label tt-object' title='${o.o}'>${SNAP.label(o.o)}</span>`)
                        .join("<br>")+
                "</div><div class='popover-footer'/>"
            }
            var graphs = jqElement.data('annotations')
            var content = stringify(graphs)//attr(field)
            jqElement.popover({
                container:"body",
                html:"true",
                trigger: "hover | click",
                placement: "auto top",
                title: jqElement.data('selector').exact,
                content: content
            })
        }
    }
}

export default Tooltip