import $ from 'jquery';
import TextQuoteAnchor from 'dom-anchor-text-quote';
import SPARQL from '../models/sparql'
import Utils from '../utils'

// todo: think about api - stacking commands, then executing them, in order to facilitate single step history?

/**
 * Class for creation of annotations
 *
 */
class Annotator {

    // API: create(fragment), update(fragments), delete(fragment), drop(graph)

    constructor(app) {
        // TODO: add controls for history, save at bottom of anchor
        this.anchor = app.anchor
        this.model = app.model;
        this.applicator = app.applicator;
        this.history = app.history;
        this.currentRange = undefined;

        /**
         * Acquire variables for Open Annotations
         * @type {{cite: ((p1?:*, p2?:*)=>string), user: (()=>string), urn: (()), date: (()=>string), triple: (()), selector: (()=>(any))}}
         */
        this.acquire = {
            "cite": (pre,post) => "http://data.perseus.org/collections/urn:cite:perseus:pdljann."+Utils.hash(pre)+Utils.hash(post),
            "user": () => $('#annotator-main').data().user,
            "urn": () => $('#annotator-main').data().urn,
            "date": () => ,
            "triple": () => {
                return {
                    subject: ($("#subject_prefixes").data('url')|"")+$("#create_subject > span > input").last().val(),
                    predicate: ($("#predicate_prefixes").data('url')|"")+$("#create_predicate > span > input").last().val(),
                    object: ($("#object_prefixes").data('url')|"")+$("#create_object > span > input").last().val()
            }},
            "selector": () => $('#create_range').data('selector')
        }

        this.selector = {
            "http://www.w3.org/ns/oa#TextQuoteSelector" : () => {
                var selection = document.getSelection();
                return TextQuoteAnchor.fromRange(document.getElementById("annotator-main"),selection.getRangeAt(0)).toSelector()
            }
        };
        /**
         * Event handlers for processing selections and showing/hiding starter button,
         *
         * @type {{[http://www.w3.org/ns/oa#TextQuoteSelector]: ((p1:*))}}
         */
        this.starter = {
            "http://www.w3.org/ns/oa#TextQuoteSelector" : (event) => {
                var selection = document.getSelection();
                var starter = $('#starter');
                if (selection && !selection.isCollapsed && starter.css('display')==='none') {
                    this.currentRange = selection.getRangeAt(0).cloneRange();
                    var selector = this.selector["http://www.w3.org/ns/oa#TextQuoteSelector"]();
                    var menuState = document.documentElement.clientWidth - parseInt($("#menu-container").css('width'))
                    var deltaH = menuState ? window.scrollY+15 : window.scrollY-parseInt($("#menu-container").css('height'))+15;
                    var deltaW = menuState ? window.scrollX+parseInt($("#menu-container").css('width'))-10 : window.scrollX-10;
                    starter.css({display:"block",position:"absolute",left:event.clientX-deltaW,top:event.clientY+deltaH});

                    // TODO: USE TEMPLATE [DONE PROBABLY]
                    // TODO: MAKE STARTER OPEN TEMPLATE (data-target) [DONE PROBABLY]
                    // TODO: template.init() with selector [DONE PROBABLY]
                } else starter.css({display:"none"});
            }

        };

        this.init = (id) => {
            var id = id ? id : this.acquire.urn();
            var app = $('[data-urn="'+id+'"]');
            app.append('<div class="btn btn-circle" id="starter" style="display:none;" data-toggle="modal" data-target="#edit_modal"><span class="glyphicon glyphicon-paperclip"></span></div>')
                // then inject selection event listener
            app.mouseup(this.starter["http://www.w3.org/ns/oa#TextQuoteSelector"])
        }

        this.init();

        /*
        Editing functions below, they take bindings, create and run sparql queries, and post results back as promise
         */

        /**
         * DROP: delete entire annotations including metadata
         * Takes the ids in list.drop and
         * @param graphs Object where graphs.triples (Array[Object]) is a list of GSPOs to delete and graphs.ids (Array[String]) is the list of annotation ids to be cleared
         */
        this.drop = (graphs) => this.model.execute(_.concat(
            SPARQL.bindingsToDelete(_.flatten(graphs.triples)),
            graphs.ids.map((id) => `DROP GRAPH <${annotation}>`)
        ))
        // TODO: check if quads are gspo or binding, convert to binding if necessary

        /**
         *
         * @param deletions () is the list
         */
        this.delete = (deletions) => this.model.execute(SPARQL.bindingsToDelete(_.flatten(deletions)))
        // TODO: check if deletions are gspo or binding, convert to binding if necessary

        /**
         *
         * @param deletions
         * @param insertions
         */
        this.update = (deletions, insertions) => this.model.execute([
            SPARQL.bindingsToDelete(_.flatten(deletions)),
            SPARQL.bindingsToInsert(_.flatten(insertions.map((triples) => triples.concat([{}])/* include user & date */)))
        ])
        // TODO: check if input is gspo or binding, convert to binding if necessary

        /**
         *
         * @param list
         */
        this.create = (annotationId, bindings) => {
            var defaultGraph = "http://data.perseus.org/graphs/people"
            // todo: figure out default graph for use cases (maybe motivatedBy, by plugin or manual in anchor?)
            var selectorId = _.find(bindings,(binding) => binding.p.value === "http://www.w3.org/ns/oa#exact").s.value
            // todo: make independent of selector type
            var targetId = annotationId+"#target-"+Utils.hash(JSON.stringify(selectorId)).slice(0, 4)
            var userId = app.anchor.data('user')
            var urn = app.anchor.data('urn')
            var oa =[
                {"g": { "type":"uri", "value": defaultGraph },
                    "s": { "type":"uri", "value": annotationId },
                    "p": { "type":"uri", "value": "rdf:type" },
                    "o": { "type":"uri", "value": "oa:Annotation" }},
                {"g": { "type":"uri", "value": defaultGraph },
                    "s": { "type":"uri", "value": annotationId },
                    "p": { "type":"uri", "value": "dcterms:source" },
                    "o": { "type":"uri", "value": "https://github.com/fbaumgardt/perseids-annotator" }},
                {"g": { "type":"uri", "value": defaultGraph },
                    "s": { "type":"uri", "value": annotationId },
                    "p": { "type":"uri", "value": "oa:serializedBy" },
                    "o": { "type":"uri", "value": "https://github.com/fbaumgardt/perseids-annotator" }}
            ]

            var target = [
                {"p": { "type":"uri", "value":"oa:hasTarget" },
                    "g": { "type":"uri", "value":defaultGraph },
                    "s": { "type":"uri", "value":annotationId },
                    "o": { "type":"uri", "value":targetId }},
                {"p": { "type":"uri", "value":"rdf:type" },
                    "g": { "type":"uri", "value":defaultGraph },
                    "s": { "type":"uri", "value":targetId },
                    "o": { "type":"uri", "value":"oa:SpecificResource" }}, // todo: figure out alternatives for non-text targets
                {"p": { "type":"uri", "value":"oa:hasSource" },
                    "g": { "type":"uri", "value":defaultGraph },
                    "s": { "type":"uri", "value":targetId },
                    "o": { "type":"uri", "value":urn}},
                {"p": { "type":"uri", "value":"oa:hasSelector" },
                    "g": { "type":"uri", "value":defaultGraph },
                    "s": { "type":"uri", "value":targetId },
                    "o": { "type":"uri", "value":selectorId }}
            ]

            var date = [{
                "p": { "type":"uri", "value":"oa:annotatedAt" },
                "g": { "type":"uri", "value": defaultGraph},
                "s": { "type":"uri", "value":annotationId },
                "o": { "datatype": "http://www.w3.org/2001/XMLSchema#dateTimeStamp", "type":"literal", "value": (new Date()).toISOString()}
            }]


            var user = [
                {"p": { "type":"uri", "value":"oa:annotatedBy" },
                "g": { "type":"uri", "value": defaultGraph },
                "s": { "type":"uri", "value": annotationId },
                "o": { "type":"uri", "value": userId }} // NOTE: describe <o> query
                ]

            this.model.execute(SPARQL.bindingsToInsert(_.flatten(oa,date,user,target,bindings)))

        }
    }
}

export default Annotator