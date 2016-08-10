import $ from 'jquery'
import _ from 'lodash'
import Selectors from '../models/queries/oa_selectors'
import Graph from '../models/queries/oa_bodies'
import TextQuoteAnchor from 'dom-anchor-text-quote'
import wrapRangeText from 'wrap-range-text'
import NodeLink from '../views/applicator/NodeLink'
import Tooltip from '../views/applicator/Tooltip'

// I have a list of selector types
// I have a list of queries to get selector data
// I have a list of functions to apply
/**
 * Class for visualization of annotations.
 *
 */
class Applicator {
    
    constructor (model) {
        this.model = model;
        this.escape = (s) => s.replace(/[-/\\^$*+?.()（）|[\]{}]/g, '\\$&').replace(/\$/g, '$$$$');

        /**
         * Mark selector positions with span tag and add quads to data
         * @type {{[http://www.w3.org/ns/oa#TextQuoteSelector]: ((p1:*, p2:*))}}
         */
        this.mark = {
            "http://www.w3.org/ns/oa#TextQuoteSelector": (sel) => {
                var selector = {}
                if(sel.prefix) selector.prefix = sel.prefix.value
                if (sel.exact) selector.exact = sel.exact.value
                if (sel.suffix) selector.suffix = sel.suffix.value

                var span = document.createElement('span')
                span.setAttribute("id",sel.id.value)
                    span.classList.add("perseids-annotation")

                var textquote = TextQuoteAnchor.fromSelector(document.getElementById("annotator-main"),selector)
                var range = textquote.toRange()

                wrapRangeText(span,range)
            }
        };

        /**
         * Load annotations and add markers to frontend
         * id is optional, loads all annotations if undefined
         * @private
         * @param id (optional) annotation id to query
         */
        this.load = (id) => {
            // get TextSelectors
            this.model.execute(Selectors["http://www.w3.org/ns/oa#TextQuoteSelector"](id))
            // mark positions in HTML
                .then((selectors) => _.last(selectors).result.map((x) => this.mark["http://www.w3.org/ns/oa#TextQuoteSelector"](x)))
                // get triples
                .then((data) => this.model.execute(Graph["http://www.w3.org/ns/oa#hasBody"](id)))

                .then((data) => _.last(data).result.map((x) => {
                    var element = $(document.getElementById(x.id.value))
                    var array = element.data(x.graph.value) || []
                    element.data(x.graph.value,_.concat(array,{s:x.subject.value, p:x.predicate.value,o:x.object.value}))
                    this.tooltip.register(element);
                    return {g: x.graph.value, s:x.subject.value, p:x.predicate.value,o:x.object.value}
                }))
            // then add global view
        };

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
