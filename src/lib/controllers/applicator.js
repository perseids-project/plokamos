import $ from 'jquery'
import _ from 'lodash'
import Selectors from '../models/queries/oa_selectors'
import Annotation from '../models/queries/oabyId'
import TextQuoteAnchor from 'dom-anchor-text-quote'
import wrapRangeText from 'wrap-range-text'
import NodeLink from '../views/applicator/NodeLink'
import Tooltip from '../views/applicator/Tooltip'
import Editor from '../views/applicator/Editor'
import SNAP from '../models/ontologies/SNAP'

class Marker {

}
// I have a list of selector types
// I have a list of queries to get selector data
// I have a list of functions to apply
/**
 * Class for visualization of annotations.
 *
 */
class Applicator {

    constructor (app) {

        // todo: hash selector in Id class
        var Id = {
            fromSelector: (selector) => ((selector.prefix||"")+selector.exact+(selector.suffix||""))
        }

        var model = app.model;

        // todo: move this to an utility class, note: var escape = (s) => s.replace(/[-/\\^$*+?.()（）|[\]{}]/g, '\\$&').replace(/\$/g, '$$$$');

        /**
         * Mark selector positions with span tag and add quads to data
         * @type {{[http://www.w3.org/ns/oa#TextQuoteSelector]: ((p1:*, p2:*))}}
         */
        this.mark = {
            "http://www.w3.org/ns/oa#TextQuoteSelector": (selector) => {
                var span = document.createElement('span')
                span.setAttribute("id",Id.fromSelector(selector))
                span.classList.add("perseids-annotation")
                span.setAttribute("data-selector",JSON.stringify(selector))
                var textquote = TextQuoteAnchor.fromSelector(document.getElementById("annotator-main"),selector)
                var range = textquote.toRange()
                wrapRangeText(span,range)
                return span;
            }
        };

        /**
         * Load annotations and add markers to frontend
         * id is optional, loads all annotations if undefined
         * @private
         * @param id (optional) annotation id to query
         */
        this.load = (id) =>
            model.execute(Annotation.byIdentifier(id))
            .then((bindings) =>
                _.groupBy(_.last(bindings).result,'id.value')
            ).then((grouped) => {
                var store = {}
                    var spans = _.map(grouped, (v, k) => {
                        var selectorURI = _.find(v, (obj) => obj.p.value.endsWith("hasSelector")).o.value
                        var selectorTriples = v.filter((obj) => obj.s.value === selectorURI)
                        var selectorType = Selectors["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"](selectorTriples)
                        var selectorObject = Selectors[selectorType](selectorTriples)
                        var idFromSelector = Id.fromSelector(selectorObject)
                        var span = document.getElementById(idFromSelector) || this.mark[selectorType](selectorObject)
                        if (!store[idFromSelector]) {store[idFromSelector] = {}}
                        store[idFromSelector][k] = v
                        return span
                    })

                return _.uniq(spans).map((span) => {
                    var data = store[span.getAttribute('id')]
                    var element = document.getElementById(span.getAttribute('id'))
                    element.setAttribute('data-annotations',JSON.stringify(data))
                    return $(element)
                })
                }
            ) // todo: describe next step
            .then((elements) =>
                elements.map((element) => {
                    this.tooltip.register(element);
                    this.delete.register(element);
                    return element
                })
            ) // todo: describe next step
            // todo: group data by id
            .then((elements) => {
                    var grouped = elements.reduce((object, element) => _.merge(object,element.data('annotations')), {})
                    var snap = SNAP.simplify(grouped)
                    var input = _.flatMap(snap,(v,k)=>v.map((o) => Object.assign(o,{g:k})))
                    this.nodelink.add(input)
                }
            )

        /**
         * Remove annotation markers from frontend
         * id is optional, unloads all annotations if undefined
         * @param id
         */
        this.unload = (id) => {
            var p = id ? [document.getElementById(id)] : document.getElementsByClassName('perseids-annotation');
            while(p.length) {
                var parent = p[ 0 ].parentNode;
                while( p[ 0 ].firstChild ) {
                    parent.insertBefore(  p[ 0 ].firstChild, p[ 0 ] );
                }
                if (parent) parent.removeChild( p[ 0 ] );
            }
        };

        var body = $('body');
        this.tooltip = new Tooltip(body)
        this.delete = new Delete(body)
        this.nodelink = new NodeLink(body)
        this.load();
    }

    // TODO: move plugins into lists for elements (e.g. tooltip) and document (e.g. nodelink)

    load (id)  {
        this.load(id);
    }

    unload(id) {
        this.unload(id);
    }

    reset() {
        this.unload();
        this.load();
    }

    nodelink() {
        return this.nodelink
    }
}

export default Applicator
