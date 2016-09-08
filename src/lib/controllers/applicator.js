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
import OA from '../models/ontologies/OA'

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

        var Id = {
            fromSelector: (selector) => ((selector.prefix||"")+selector.exact+(selector.suffix||"")) // todo: remove TQS specific code, use Utils & OA, but make sure it's consistent between marking and retrieving spans
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
                        var selectorType = _.find(selectorTriples,(t) => t.p.value.endsWith("type")).o.value // todo: replace as many endsWith as possible with tests on qualified names
                        var selectorObject = OA.simplify(selectorType)(selectorTriples)
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
            )
            .then((elements) =>
                elements.map((element) => {
                    this.tooltip.register(element);
                    this.delete.register(element);
                    return element
                })
            )
            .then((elements) => {
                    var grouped = elements.reduce((object, element) => _.merge(object,element.data('annotations')), {})
                    var snap = SNAP.simplify()(grouped) // todo: move into nodelink, specify API for document plugins
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
            if(!id) {this.nodelink.reset()}
            // TODO: remove from nodelink / graph plugins?
        };

        this.reset = () => {
            this.unload()
            this.load()
        }

        // var body = $('body');
        this.tooltip = new Tooltip(app)
        this.delete = new Editor(app)
        this.nodelink = new NodeLink(app)
        this.load();
    }

    // todo: move plugins into lists for elements (e.g. tooltip) and document (e.g. nodelink)

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
