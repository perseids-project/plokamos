import $ from 'jquery';
import TextQuoteAnchor from 'dom-anchor-text-quote';

class Annotator {

    constructor() {
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
                    starter.css({display:"block",position:"absolute",left:event.clientX+10,top:event.clientY+15});
                    
                } else starter.css({display:"none"});
            }

        }
        
    }

    load (model, id) {
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
        .then((html) => app.append(html))
        .then(app.mouseup(perseids.annotator.starter["http://www.w3.org/ns/oa#TextQuoteSelector"]))
        .then(() => $.getJSON('namespaces.json'))
        .then((json) => {
            // NOTE: PARSE AND INSERT PREFIXES
            // NOTE: (OBJECTS)
            var ks = _.keys(json.entities);
            json.entities["http:"]["resources"] = _.reduce(json.entities,(acc,e) => _.concat(acc,e.resources.map((x) => e.uri+x)),[]);
            ks.forEach((k) => {
                var l = json.entities[k];
                $(`<li><a href="#" data-url="${l.uri}" >${k}</a></li>`).on('click',() => {
                    $('#subject_prefixes > button').html(k+' <span class="caret"/>')
                    $('#create_subject').typeahead('destroy');
                    $('#create_subject').typeahead({minLength:3,highlight:true},{source:substringMatcher(json.entities[k].resources)})
                }).appendTo('#subject_prefixes > ul');
                $(`<li><a href="#" data-url="${l.uri}" >${k}</a></li>`).on('click',() => {
                    $('#object_prefixes > button').html(k+' <span class="caret"/>')
                    $('#create_object').typeahead('destroy');
                    $('#create_object').typeahead({minLength:3,highlight:true},{source:substringMatcher(json.entities[k].resources)})
                }).appendTo('#object_prefixes > ul');
            });
            // NOTE: (PROPERTIES)
            var ks = _.keys(json.properties);
            json.properties["http:"]["resources"] = _.reduce(json.properties,(acc,e) => _.concat(acc,e.resources.map((x) => e.uri+x)),[]);
            ks.forEach((k) => {
                var l = json.properties[k];
                $(`<li><a href="#" data-url="${l.uri}" >${k}</a></li>`).on('click',() => {
                    $('#predicate_prefixes > button').html(k+' <span class="caret"/>')
                    $('#create_predicate').typeahead('destroy');
                    $('#create_predicate').typeahead({minLength:3,highlight:true},{source:substringMatcher(json.properties[k].resources)})
                }).appendTo('#predicate_prefixes > ul');
            });
            return json;
        })
        .then((json) => {
            // todo: refactor, intialize: typeahead & onclick
        })
    }
}

export default Annotator