import $ from 'jquery';
import TextQuoteAnchor from 'dom-anchor-text-quote';
import sparql from '../models/sparql'


/**
 * Class for creation of annotations
 *
 */
class Annotator {

    constructor(model,applicator,history) {

        this.model = model;
        this.applicator = applicator;
        this.history = history;
        this.currentRange = undefined;
        this.hash = (str) => str.split("").reduce((a,b) => {a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);

        /**
         * Acquire variables for Open Annotations
         * @type {{cite: ((p1?:*, p2?:*)=>string), user: (()=>string), urn: (()), date: (()=>string), triple: (()), selector: (()=>(any))}}
         */
        // TODO: FIX ACQUIRE WITH NEW SELECTORS
        this.acquire = {
            "cite": (pre,post) => "http://data.perseus.org/collections/urn:cite:perseus:pdljann."+this.hash(pre)+this.hash(post),
            "user": () => $('#annotator-main').data().user,
            "urn": () => $('#annotator-main').data().urn,
            "date": () => (new Date()).toISOString(),
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

                    // TODO: USE TEMPLATE
                    // TODO: MAKE STARTER OPEN TEMPLATE (data-target)
                    // TODO: template.init() with selector
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
    }
    
    save () {

        // acquire insert parameters
        var selector = this.acquire.selector();
        selector.urn = this.acquire.urn();
        var date = this.acquire.date();
        var triple = {s:this.acquire.triple().subject,p:this.acquire.triple().predicate,o:this.acquire.triple().object};
        var user = this.acquire.user(); // agent -> nemo or oauth
        var cite = this.acquire.cite(user+selector.urn,date+selector.prefix+selector.exact+selector.suffix+triple.s+triple.p+triple.o)
        triple.g = cite

        // bindings2insert -> model.execute

        // annotation -> get from input fields
        var binds = ((cite, graph) => { return {
            "oa":() => [
            {"g": { "type":"uri", "value": graph || "http://data.perseus.org/graphs/people" },
                "s": { "type":"uri", "value": cite },
                "p": { "type":"uri", "value": "rdf:type" },
                "o": { "type":"uri", "value": "oa:Annotation" }},
            {"g": { "type":"uri", "value": graph || "http://data.perseus.org/graphs/people" },
                "s": { "type":"uri", "value": cite },
                "p": { "type":"uri", "value": "dcterms:source" },
                "o": { "type":"uri", "value": "https://hypothes.is/api/annotations/oM3uKsoSRXmPfg1vsNSfxw" }},
            {"g": { "type":"uri", "value": graph || "http://data.perseus.org/graphs/people" },
                "s": { "type":"uri", "value": cite },
                "p": { "type":"uri", "value": "oa:serializedBy" },
                "o": { "type":"uri", "value": "https://github.com/fbaumgardt/perseids-annotator" }}],
            "date": (date) => [
            {"p": { "type":"uri", "value":"oa:annotatedAt" },
                "g": { "type":"uri", "value": graph || "http://data.perseus.org/graphs/people" },
                "s": { "type":"uri", "value":cite },
                "o": { "datatype": "http://www.w3.org/2001/XMLSchema#dateTimeStamp", "type":"literal", "value":date }}
        ],
            "user": (group) => [
            {"p": { "type":"uri", "value":"oa:annotatedBy" },
                "g": { "type":"uri", "value":graph || "http://data.perseus.org/graphs/people" },
                "s": { "type":"uri", "value": cite },
                "o": { "type":"uri", "value":group }} // NOTE: describe <o> query
        ],
            "target": (target) => [
            {"p": { "type":"uri", "value":"oa:hasTarget" },
                "g": { "type":"uri", "value":graph || "http://data.perseus.org/graphs/people" },
                "s": { "type":"uri", "value":cite },
                "o": { "type":"uri", "value":cite+"#target-1" }},
            {"p": { "type":"uri", "value":"rdf:type" },
                "g": { "type":"uri", "value":graph || "http://data.perseus.org/graphs/people" },
                "s": { "type":"uri", "value":cite+"#target-1" },
                "o": { "type":"uri", "value":"oa:SpecificResource" }},
            {"p": { "type":"uri", "value":"oa:hasSource" },
                "g": { "type":"uri", "value":graph||"http://data.perseus.org/graphs/people" },
                "s": { "type":"uri", "value":cite+"#target-1" },
                "o": { "type":"uri", "value":target.urn }},
            {"p": { "type":"uri", "value":"oa:hasSelector" },
                "g": { "type":"uri", "value":graph||"http://data.perseus.org/graphs/people" },
                "s": { "type":"uri", "value":cite+"#target-1" },
                "o": { "type":"uri", "value":cite+"#target-1-sel-1" }},
            {"p": { "type":"uri", "value":"rdf:type" },
                "g": { "type":"uri", "value":graph||"http://data.perseus.org/graphs/people" },
                "s": { "type":"uri", "value":cite+"#target-1-sel-1" },
                "o": { "type":"uri", "value":"oa:TextQuoteSelector" }},
            {"p": { "type":"uri", "value":"oa:prefix" },
                "g": { "type":"uri", "value":graph||"http://data.perseus.org/graphs/people" },
                "s": { "type":"uri", "value":cite+"#target-1-sel-1" },
                "o": { "type":"literal", "value":target.prefix }},
            {"p": { "type":"uri", "value":"oa:exact" },
                "g": { "type":"uri", "value":graph||"http://data.perseus.org/graphs/people" },
                "s": { "type":"uri", "value":cite+"#target-1-sel-1" },
                "o": { "type":"literal", "value":target.exact }},
            {"p": { "type":"uri", "value":"oa:suffix" },
                "g": { "type":"uri", "value":graph||"http://data.perseus.org/graphs/people" },
                "s": { "type":"uri", "value":cite+"#target-1-sel-1" },
                "o": { "type":"literal", "value":target.suffix }}
        ],
            "annotation": (triple) => [ // note: SNAP ONTOLOGY + how to do title??
            {"p": { "type":"uri", "value":"dcterms:title" },
                "g": { "type":"uri", "value":graph||"http://data.perseus.org/graphs/people" },
                "s": { "type":"uri", "value":cite },
                "o": { "type":"literal", "value":"http://data.perseus.org/people/smith:tecmessa-1#this identifies Tecmessa as snap:IntimateRelationship in urn:cts:pdlrefwk:viaf88890045.003.perseus-eng1:A.ajax_1" }},
            {"p": { "type":"uri", "value":"oa:motivatedBy" },
                "g": { "type":"uri", "value":graph||"http://data.perseus.org/graphs/people" },
                "s": { "type":"uri", "value":cite },
                "o": { "type":"uri", "value":"oa:identifying" }},
            {"p": { "type":"uri", "value":"oa:hasBody" },
                "g": { "type":"uri", "value":graph||"http://data.perseus.org/graphs/people" },
                "s": { "type":"uri", "value":cite },
                "o": { "type":"uri", "value":cite }},
            {"p": { "type":"uri", "value":"http://www.w3.org/1999/02/22-rdf-syntax-ns#type" },
                "g": { "type":"uri", "value":cite },
                "s": { "type":"uri", "value":cite+"#bond-1" },
                "o": { "type":"uri", "value":triple.p }},
            {"p": { "type":"uri", "value":"snap:has-bond" },
                "g": { "type":"uri", "value":cite },
                "s": { "type":"uri", "value":triple.s },
                "o": { "type":"uri", "value":cite+"#bond-1" }},
            {"p": { "type":"uri", "value":"snap:bond-with" },
                "g": { "type":"uri", "value":cite },
                "s": { "type":"uri", "value":cite+"#bond-1" },
                "o": { "type":"uri", "value":triple.o }}
        ]
        }})(cite);

        var bindings = {head:{vars:["s","p","o","g"]},results:{bindings:_.concat(
            binds.oa(cite),
            binds.date(date),
            binds.user(user),
            binds.target(selector),
            binds.annotation(triple)
        )}}

        var insert = sparql.bindings2insert(bindings.results.bindings);

        insert.forEach((sparql) => this.model.execute(sparql).then(
            (r) => {

                // clear inputs

                $('#create_subject > span > input').last().val('');
                $('#create_predicate > span > input').last().val('');
                $('#create_object > span > input').last().val('');

                // remove modal
                $('#create_modal').toggle();
                $('body').removeClass('modal-open');
                $('.modal-backdrop').remove();
                $('#create_modal').removeClass('in');

                // add span
                var span = document.createElement('span');
                span.setAttribute('class','perseids-annotation');
                span.setAttribute('id',cite);
                this.currentRange.surroundContents(span);
                var annotation_body = [
                    {s:cite+"#bond-1",p:"http://www.w3.org/1999/02/22-rdf-syntax-ns#type",o:triple.p},
                    {s:triple.s,p:"snap:has-bond",o:cite+"#bond-1"},
                    {s:cite+"#bond-1",p:"snap:bond-with",o:triple.o}
                ]
                $(span).data(cite,annotation_body)
                // applicator.load(id)
                this.applicator.tooltip($(span))
                // add command to history

            }
        ));
    }
}

export default Annotator