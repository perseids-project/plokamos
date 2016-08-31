import _ from 'lodash'
class OA {

    static knowResources = []
    static labels = {}

    static namespaces = [
        {
            uri:"http://www.w3.org/ns/oa#",
            prefix:"oa:"
        }
    ]

    static expandMap = {
        "http://www.w3.org/ns/oa#TextQuoteSelector": (selector) =>
            _.chain(["prefix","exact","suffix"])
            .map((pos) => selector[pos] ? {
                g:{type:"uri",value:"http://data.perseus.org/graphs/persons"},
                s:{type:"uri",value:selector.id},
                p:{type:"uri",value:`http://www.w3.org/ns/oa#${pos}`},
                o:{type:"literal",value:selector[pos]}
                } : undefined)
            .concat({
                g:{type:"uri",value:"http://data.perseus.org/graphs/persons"},
                s:{type:"uri",value:selector.id},
                p:{type:"uri",value:"http://www.w3.org/1999/02/22-rdf-syntax-ns#type"},
                o:{type:"uri",value:"http://www.w3.org/ns/oa#TextQuoteSelector"}
                })
            .compact()
            .value(),
        "default": (obj) => {
            var ns = obj.replace ? _.find(this.namespaces,(ns) => this.expandMap[obj.replace(ns.prefix,ns.uri)]) : undefined
            var resolved = ns ? this.expandMap[obj.replace(ns.prefix,ns.uri)] : undefined
            return resolved ? resolved : (x) => x
        }
    }

    static simplifyMap = {
        "http://www.w3.org/ns/oa#TextQuoteSelector": (selectorTriples) => { // todo: rename to bindings
            var selectorObject = {}
            selectorObject.type = _.find(selectorTriples,(t) => t.p.value.endsWith("type")).o.value
            selectorObject.prefix = _.find(selectorTriples,(t) => t.p.value.endsWith("prefix")).o.value
            selectorObject.exact = _.find(selectorTriples,(t) => t.p.value.endsWith("exact")).o.value
            selectorObject.suffix = _.find(selectorTriples,(t) => t.p.value.endsWith("suffix")).o.value
            return selectorObject
        },
        "default": (obj) => {
            var ns = obj.replace ? _.find(this.namespaces,(ns) => this.simplifyMap[obj.replace(ns.prefix,ns.uri)]) : undefined
            var resolved = ns ? this.simplifyMap[obj.replace(ns.prefix,ns.uri)] : undefined
            return resolved ? resolved : (x) => x
        }
    }

    static expand(type) { return _.result(this.expandMap,type,this.expandMap.default(type)) }

    static simplify(type) { return _.result(this.simplifyMap,type,this.simplifyMap.default(type)) }

}

export default OA