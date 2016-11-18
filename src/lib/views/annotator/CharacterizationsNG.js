import Plugin from './Plugin'
import OA from '../../models/ontologies/OA'
import Mustache from 'mustache'
import _ from 'lodash'
import $ from 'jquery'

class Characterizations extends Plugin {

    static ns () {
        return "http://data.perseids.org/characterization#"
    }

    static uri () {
        return "http://data.perseus.org/graphs/characterizations"
    }

    static icon () {
        return "transfer"
    }
}

export default Characterizations