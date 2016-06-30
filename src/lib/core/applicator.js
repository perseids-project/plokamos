import $ from 'jQuery'

// I have a list of selector types
// I have a list of queries to get selector data
// I have a list of functions to apply
class Applicator {
    
    constructor() {
        this.escape = (s) => s.replace(/[-/\\^$*+?.()（）|[\]{}]/g, '\\$&').replace(/\$/g, '$$$$');
        this.apply = {
            "http://www.w3.org/na/oa#TextQuoteSelector": (selector, triple) => {
                var prefix = selector.prefix ? this.escape(selector.prefix.value).replace(/ /g,'\\s*') : ''
                var exact = selector.exact ? this.escape(selector.exact.value).replace(/ /g,'\\s*') : ''
                var suffix = selector.suffix ? this.escape(selector.suffix.value).replace(/ /g,'\\s*') : ''
                var ex = [prefix+'\\s*',exact,'\\s*'+suffix].map((x) => '('+x+')').join('')
                var rx = new RegExp(ex,"m")
                var ml = rx.exec($('article').text())
                if (ml) $(`:contains('${ml[0]}')`).html(function (i, o) {
                    return o.replace(rx, "$1<span data-desc='undefined'>$2</span>$3");
                })
                else console.log(ex); // Let's see what's the issue!
            }
        };
        this.selectors = {
            "http://www.w3.org/na/oa#TextQuoteSelector": (id) => [
                "SELECT ?id ?prefix ?exact ?suffix",
                "WHERE {",
                "GRAPH ?g {",
                `${id || "?id"} <http://www.w3.org/ns/oa#hasSelector> ?selector .`,
                "?selector <http://www.w3.org/ns/oa#prefix> ?prefix .",
                "?selector <http://www.w3.org/ns/oa#exact> ?exact .",
                "?selector <http://www.w3.org/ns/oa#suffix> ?suffix .",
                "}}"
            ].join("\n")
        };
    }

    annotate (model, id)  {
        model.execute(this.selectors["http://www.w3.org/na/oa#TextQuoteSelector"](id))
            .then((data) => _.map(data).map((x) => this.apply["http://www.w3.org/na/oa#TextQuoteSelector"](x)))
    }
    
}

export default Applicator
