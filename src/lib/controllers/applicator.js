import $ from 'jquery'
import _ from 'lodash'
import TextQuoteAnchor from 'dom-anchor-text-quote'
import wrapRangeText from 'wrap-range-text'
import NodeLink from '../views/applicator/NodeLink'
import Tooltip from '../views/applicator/Tooltip'
import SocialNetwork from '../views/annotator/SocialNetworkNG'
import Characterizations from '../views/annotator/CharacterizationsNG'
import OA from '../models/ontologies/OA'

/**
 * Class for visualization of annotations.
 *
 */
class Applicator {

    constructor (app) {

        var Id = {
            fromSelector: (selector) => ((selector.prefix||"")+selector.exact+(selector.suffix||"")) // planned: remove TQS specific code, use Utils & OA, but make sure it's consistent between marking and retrieving spans
        }

        var model = app.model;

        this.spinner = $(`<div class="spinner"><span class="glyphicon glyphicon-refresh glyphicon-spinning"></span><br><span>Loading ...</span></div>`).appendTo(app.anchor)
        // planned: move this to an utility class, note: var escape = (s) => s.replace(/[-/\\^$*+?.()（）|[\]{}]/g, '\\$&').replace(/\$/g, '$$$$');
        this.spinner.css('display','inline-block')
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
            model.execute(OA.query("byIdentifier")(id)) // todo:
            .then((bindings) =>
                _.groupBy(_.last(bindings).result,'id.value')
            ).then((grouped) => {
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
                    this.socialnetwork.register(element); // todo: this can probably be removed or moved to Annotator
                    this.characterizations.register(element); // todo: MOVE IT TO ANNOTATOR
                    return element
                })
            )
            .then((elements) => {
                    var grouped = elements.reduce((object, element) => _.merge(object,element.data('annotations')), {})
                    var snap = _.mapValues(grouped, (v,k) => OA.getBodies(v).map((b) => app.ontology.simplify(b,k))) // planned: move into nodelink, specify API for document plugins
                    var input = _.flatMapDeep(snap,(v,k)=>v.map((o) => o.map((p) => Object.assign(p,{g:k}))))
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
            // todo: generalize to reset all plugins
            // note: is this superfluous if we reset on edit anyways?
        };

        this.reset = () => {
            this.spinner.css('display','inline-block')
            this.unload()
            this.load().then(() => this.spinner.css('display','none'))
        }

        // var body = $('body');
        this.tooltip = new Tooltip(app)
        this.socialnetwork = new SocialNetwork(app)
        this.characterizations = new Characterizations(app)
        this.nodelink = new NodeLink(app)
        this.load().then(() => this.spinner.css('display','none'));
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

    nodelink() {
        return this.nodelink
    }
}

export default Applicator
