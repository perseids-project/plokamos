import $ from 'jquery'
import _ from 'lodash'
import Selectors from '../models/queries/oa_selectors'
import Graph from '../models/queries/oa_bodies'
import TextQuoteAnchor from 'dom-anchor-text-quote'
import wrapRangeText from 'wrap-range-text'
import NodeLink from '../views/applicator/NodeLink'

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
         * Mark selector positions with triples
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

        this.tooltip = (jqElement) => {
            jqElement.hover(function (e) {
                function stringify(obj) {
                    return _.values(_.mapValues(obj,function(v,k) {
                        var bonds = v
                            .filter(function(o){
                                return o.p === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" && o.s.startsWith(k)
                            })
                            .map(function(o) {
                                return o.s
                            })
                        var expressions = bonds.map(function(bond) {
                            var subject = v.filter(function(o) {
                                return o.p.endsWith("has-bond") && o.o === bond
                            }).map(function(o) {return o.s})[0]
                            var predicate = v.filter(function(o) {
                                return o.p === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" && o.s === bond
                            }).map(function(o) {return o.o})[0]
                            var object = v.filter(function(o) {
                                return o.p.endsWith("bond-with") && o.s === bond
                            }).map(function(o) {return o.o})[0]
                            return subject.split("\/").slice(-1)[0]+"\n"+predicate+"\n"+object.split("\/").slice(-1)[0]
                        })
                        return expressions.join(";\n")
                    })).join("\n\n")
                }
                var description = stringify($(this).data())//attr(field)
                var tooltip = $('.margintooltip')

                var menuState = document.documentElement.clientWidth - parseInt($("#menu-container").css('width'))
                var deltaH = menuState ? 0 : parseInt($("#menu-container").css('height'));
                var deltaW = menuState ? parseInt($("#menu-container").css('width')) : 0;

                var parent = $(this.parentElement)
                var position = parent.position()
                var width = Math.min(100, position.left)

                if (width < 60 || !description) {
                    return
                }

                tooltip
                    .css({
                        'border-right': 'solid 2px #FF00FF',
                        'font-size': '13px',
                        'left': position.left - width - 5 + deltaW,
                        'min-height': parent.height(),
                        'padding-right': '7px',
                        'position': 'absolute',
                        'text-align': 'right',
                        'top': position.top + deltaH,
                        'width': width
                    })
                    .text(description)
                    .stop()
                    .fadeIn({
                        duration:100,
                        queue: false
                    })
            }, function () {
                $('.margintooltip').stop()
                $('.margintooltip').fadeOut({
                    duration: 100
                })
            })
        }

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
                    this.tooltip(element);
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
        var margintooltip = $('<div class="margintooltip" style="display: none;"></div>')
        var globalViewBtn = $('<div class="btn btn-circle" id="global-view-btn" style="position: fixed; top:15%; right:5%; z-index:1000; background-color:black;"/>')
        var globalView = $('<div class="well" id="global-view" style="position:fixed; top:10%; left:12.5%; width:75%; height:40%; z-index:1000; display:none;"/>');
        body.append(margintooltip);
        body.append(globalViewBtn);
        body.append(globalView);
        globalViewBtn.mouseleave(function(e) {if (!globalViewBtn.keep)$('#global-view').css('display','none')});
        globalViewBtn.mouseenter(function(e) {$('#global-view').css('display','block')});
        globalViewBtn.click(function(e) {
            globalViewBtn.keep = !globalViewBtn.keep
            $('#global-view').css('display','block')})
        globalViewBtn.keep = false;
        // prepare empty visualization
        // node links into model
         // $.getScript('/annotator-assets/js/pagegrid.js');
        this.nodelink = new NodeLink(globalView.get(0))
        this.load();
    }

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

    tooltip(element) {
        this.tooltip(element)
    }

    nodelink() {
        return this.nodelink
    }
}

export default Applicator
