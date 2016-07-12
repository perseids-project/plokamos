import $ from 'jquery';
import TextQuoteAnchor from 'dom-anchor-text-quote';
import Bloodhound from '../../../bower_components/typeahead.js/dist/bloodhound'

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
                    $('#subject_prefixes').append(`<li> <a href="#" data-url="${l.uri}" >${k}</a></li>`);
                    $('#object_prefixes').append(`<li> <a href="#" data-url="${l.uri}" >${k}</a></li>`);
                });
                // NOTE: (PROPERTIES)
                var ks = _.keys(json.properties);
                json.properties["http:"]["resources"] = _.reduce(json.properties,(acc,e) => _.concat(acc,e.resources.map((x) => e.uri+x)),[]);
                ks.forEach((k) => {
                    var l = json.properties[k];
                    $('#predicate_prefixes').append(`<li> <a href="#" data-url="${l.uri}" >${k}</a></li>`);
                });
                return json;
            })
            .then((json) => {
                // note: 
            }).then((obj) => {
            window.stuff = obj;
        })
    }

}

export default Annotator