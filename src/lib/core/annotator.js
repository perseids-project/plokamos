import $ from 'jquery';
import TextQuoteAnchor from 'dom-anchor-text-quote';
import sparql from './sparql'

class Annotator {

    constructor(model) {

        this.model = model;

        this.hash = (str) => str.split("").reduce((a,b) => {a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);

        this.acquire = {
            "cite": (pre,post) => "http://data.perseus.org/collections/urn:cite:perseus:pdljann."+this.hash(pre)+this.hash(post),
            "user": () => "http://data.perseus.org/sosol/users/Nate%20Krantz", // TODO: implement
            "urn": () => $('#annotator-main').data().urn,
            "date": () => (new Date()).toISOString(),
            "triple": () => {
                var subject_url = $("#subject_prefixes").data('url');
                var subject_val = $("#create_subject > span > input").last().val();
                return {
                subject: subject_url+subject_val,
                    predicate: $("#predicate_prefixes > button").data('url')+$("#create_predicate > input").val(),
                    object: $("#object_prefixes > button").data('url')+$("#create_object > input").val()
            }},
            "selector": () => $('#create_range').data('selector')
        }

        this.prefixes = ['http://','oa:','snap:','perseidsrdf:','smith:'];

        this.selector = {
            "http://www.w3.org/ns/oa#TextQuoteSelector" : () => {
                var selection = document.getSelection();
                return TextQuoteAnchor.fromRange(document.getElementById("annotator-main"),selection.getRangeAt(0)).toSelector()
            }
        };
        this.starter = {
            "http://www.w3.org/ns/oa#TextQuoteSelector" : (event) => {
                var selection = document.getSelection();
                var starter = $('#starter');
                if (selection && !selection.isCollapsed && starter.css('display')==='none') {
                    var selector = this.selector["http://www.w3.org/ns/oa#TextQuoteSelector"]();

                    $('#create_range').html(selector.prefix+"<u>"+selector.exact+"</u>"+selector.suffix);
                    $('#create_range').data('selector',selector)
                    starter.css({display:"block",position:"absolute",left:event.clientX+10,top:event.clientY+15});
                    
                } else starter.css({display:"none"});
            }

        };
    }

    load (id) {
        var substringMatcher = function(strs) {
            return function findMatches(q, cb) {
                var matches, substrRegex;
                matches = [];
                substrRegex = new RegExp(q, 'i');
                $.each(strs, function(i, str) { if (substrRegex.test(str)) { matches.push(str); } });
                cb(matches);
            };
        };
        var app = $('[data-urn="'+id+'"]');
        $.get('createInterface.html')
            // then inject user interface html
        .then((html) => app.append(html))
            // then inject selection event listener
        .then(app.mouseup(perseids.annotator.starter["http://www.w3.org/ns/oa#TextQuoteSelector"]))
            // then get namespaces
        .then(() => $.getJSON('namespaces.json'))
            // then inject typeahead for namespaces
        .then((json) => {
            // NOTE: PARSE AND INSERT PREFIXES
            // NOTE: (RDF OBJECTS)
            var ks = _.keys(json.entities);
            json.entities["http:"]["resources"] = _.reduce(json.entities,(acc,e) => _.concat(acc,e.resources.map((x) => e.uri+x)),[]);
            ks.forEach((k) => {
                var l = json.entities[k];
                $(`<li><a href="#" data-url="${l.uri}" >${k}</a></li>`).on('click',(event) => {
                    $('#subject_prefixes > button').html(k+' <span class="caret"/>');
                    $('#subject_prefixes').data('url',event.target.dataset.url || "");
                    $('#create_subject > input').typeahead('destroy');
                    $('#create_subject > input').typeahead({minLength:3,highlight:true},{source:substringMatcher(json.entities[k].resources)})
                }).appendTo('#subject_prefixes > ul');
                $(`<li><a href="#" data-url="${l.uri}" >${k}</a></li>`).on('click',(event) => {
                    $('#object_prefixes > button').html(k+' <span class="caret"/>');
                    $('#object_prefixes').data('url',event.target.dataset.url || "");
                    $('#create_object > input').typeahead('destroy');
                    $('#create_object > input').typeahead({minLength:3,highlight:true},{source:substringMatcher(json.entities[k].resources)})
                }).appendTo('#object_prefixes > ul');
            });
            // NOTE: (RDF PROPERTIES)
            var ks = _.keys(json.properties);
            json.properties["http:"]["resources"] = _.reduce(json.properties,(acc,e) => _.concat(acc,e.resources.map((x) => e.uri+x)),[]);
            ks.forEach((k) => {
                var l = json.properties[k];
                $(`<li><a href="#" data-url="${l.uri}" >${k}</a></li>`).on('click',(event) => {
                    $('#predicate_prefixes > button').html(k+' <span class="caret"/>');
                    $('#predicate_prefixes').data('url',event.target.dataset.url || "");
                    $('#create_predicate > input').typeahead('destroy');
                    $('#create_predicate > input').typeahead({minLength:3,highlight:true},{source:substringMatcher(json.properties[k].resources)})
                }).appendTo('#predicate_prefixes > ul');
            });
            return json;
        })
            // then initialize typeahead
        .then((json) => {
            ['#create_predicate'].forEach((id) => $(id).typeahead({minLength:3,highlight:true},{source:substringMatcher(json.properties[k].resources)}))
            ['#create_subject','#create_object'].forEach((id) => $(id).typeahead({minLength:3,highlight:true},{source:substringMatcher(json.entities[k].resources)}))
            // todo: fix 'k' error and refactor
        })
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
                "o": { "type":"uri", "value":"http://data.perseus.org/people/smith:tecmessa-1#this identifies Tecmessa as snap:IntimateRelationship in urn:cts:pdlrefwk:viaf88890045.003.perseus-eng1:A.ajax_1" }},
            {"p": { "type":"uri", "value":"oa:motivatedBy" },
                "g": { "type":"uri", "value":graph||"http://data.perseus.org/graphs/people" },
                "s": { "type":"uri", "value":cite },
                "o": { "type":"uri", "value":"oa:identifying" }},
            {"p": { "type":"uri", "value":"oa:hasBody" },
                "g": { "type":"uri", "value":graph||"http://data.perseus.org/graphs/people" },
                "s": { "type":"uri", "value":cite },
                "o": { "type":"uri", "value":cite }},
            {"p": { "type":"uri", "value":"rdf:type" },
                "g": { "type":"uri", "value":cite },
                "s": { "type":"uri", "value":cite+"#bond-1" },
                "o": { "type":"uri", "value":triple.s }},
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

        insert.map((sparql) => this.model.execute(sparql))
    }
}

export default Annotator