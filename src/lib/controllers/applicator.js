import $ from 'jquery'
import _ from 'lodash'
import TextQuoteAnchor from 'dom-anchor-text-quote'
import wrapRangeText from 'wrap-range-text'
//import NodeLink from '../views/applicator/NodeLink'
import Tooltip from '../views/applicator/Tooltip'
import SocialNetwork from '../views/annotator/SocialNetwork'
import Characterizations from '../views/annotator/Characterizations'
import OA from '../models/ontologies/OA'

/**
 * Class for visualization of annotations.
 *
 */
class Applicator {

    constructor (app) {

        var base = app.anchor.raw

        var Id = {
            fromSelector: (selector) => ((selector.prefix||"")+selector.exact+(selector.suffix||"")) // planned: remove TQS specific code, use Utils & OA, but make sure it's consistent between marking and retrieving spans
        }

        var model = app.model;

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
                var textquote = TextQuoteAnchor.fromSelector(base,selector)
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
            model.execute(OA.query("byIdentifier")(id)) // todo:
            .then((bindings) =>
                _.groupBy(_.last(bindings).result,'id.value')
            ).then((grouped) => {
                app.loadMessage("Apply annotation marks ...")
                var store = {}
                var spans = _.map(grouped, (v, k) => {
                        var selectorURI = _.find(v, (obj) => obj.p.value.endsWith("hasSelector")).o.value
                        var selectorTriples = v.filter((obj) => obj.s.value === selectorURI)
                        var selectorType = _.find(selectorTriples,(t) => t.p.value.endsWith("type")).o.value // planned: replace as many endsWith as possible with tests on qualified names
                        var selectorObject = OA.simplify(selectorType)(selectorTriples)
                        var idFromSelector = Id.fromSelector(selectorObject)
                        var span = document.getElementById(idFromSelector) || this.mark[selectorType](selectorObject)
                        if (!store[idFromSelector]) {store[idFromSelector] = {}}
                        store[idFromSelector][k] = v
                        return span
                    })

                return _.uniqBy(spans.map((span) => {
                    var data = store[span.getAttribute('id')]
                    var element = document.getElementById(span.getAttribute('id'))
                    element.setAttribute('data-annotations',JSON.stringify(data))
                    return $(element)
                }), (j) => j.attr('id'))
                }
            )
            .then((elements) =>
                elements.map((element) => {
                    this.tooltip.register(element); // todo: (though we might want to adjust markers based on existing annotations)
                    app.loadMessage()
                    return element
                })
            ).then((elements) => {
                    if (app.globalview) app.globalview.reset()
                })

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
            // if(!id) {this.nodelink.reset()}
            // todo: generalize to reset all plugins
            // note: is this superfluous if we reset on edit anyways?
        };

        this.reset = () => {
            app.loadMessage("Resetting Applicator ...")
            this.unload()
            this.load()
        }

        this.tooltip = new Tooltip(app)
        this.load()
        // todo: Should I move this to an init function? At least it's not returning the promise
    }

    // planned: move plugins into lists for elements (e.g. tooltip) and document (e.g. nodelink)

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

}

export default Applicator
