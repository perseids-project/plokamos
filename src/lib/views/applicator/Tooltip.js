import _ from 'lodash'
import OA from '../../models/ontologies/OA'

class Tooltip {
    constructor(app) {

        $(document).on('click', '.popover-footer > .btn', (e) => {
            $('.popover').map((i,j) => $(document.querySelectorAll(`[aria-describedby="${j.id}"]`)).click())
            $('#popover-selection').popover('destroy')
        })

        this.register = (jqElement) => {
            // planned: stringify should check ontology and select simplifier or stringify raw (.value)
            function stringify(obj) {
                var simplified = _.mapValues(obj,(graph,id) => OA.getBodies(graph).map((body) => app.ontology.simplify(body,id)))
                return "<span class='popover-source' data-source-id='"+jqElement.attr('id')+"'></span><div class='popover-list'>"+_.flattenDeep(
                    _.values(simplified)).map((o) =>
                `<span class='tt-label tt-subject' title='${o.s}'>${app.ontology.label(o.s)}</span> 
                <span class='tt-label tt-predicate' title='${o.p}'>${app.ontology.label(o.p)}</span> 
                <span class='tt-label tt-object' title='${o.o}'>${app.ontology.label(o.o)}</span>`)
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
            jqElement.click((e) => $('#'+e.target.getAttribute('aria-describedby')).toggleClass('fixed'))
        }
    }
}

export default Tooltip