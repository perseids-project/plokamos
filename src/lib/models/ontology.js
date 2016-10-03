import _ from 'lodash'
import SNAP from './ontologies/SNAP'
// import smith from './ontologies/SMITH'
const all = Symbol()
const scoring = Symbol()


class Ontology {

    constructor() {
        this[all] = [SNAP]
        this[scoring] = () => {}
    }

    test(data, keepEnum) {
        _.chain(this[all])
            .map(_.test(data)) // run individual tests
            .zip(this[all]) // align with ontologies
            .sortBy(this[scoring]) // rank with a scoring function
            .head() // get the highest ranked result
            .map((res) => keepEnum || !res ? res : res[1]) // remove the test result ?
            .value() // return
    }

    simplify(data, ontology) {
        let simplifier = ontology && this[all].filter((o) => o.name === ontology).length ? this[all].filter((o) => o.name === ontology)[0] : test(data)
        return simplifier.simplify(data)

    }

    expand(data, ontology) {
        let expander = ontology && this[all].filter((o) => o.name === ontology).length ? this[all].filter((o) => o.name === ontology)[0] : test(data)
        return expander.expand(data)
    }

    label(data, ontology) {
        let labeler = ontology && this[all].filter((o) => o.name === ontology).length ? this[all].filter((o) => o.name === ontology)[0] : test(data)
        return labeler.label(data)

    }

    namespaces(ontology) {
        // todo: check for ontology, else return:
        _.chain(this[all]).map('namespaces').flatten().value()
    }

}

export default Ontology