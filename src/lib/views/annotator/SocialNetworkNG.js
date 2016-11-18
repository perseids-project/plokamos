import Plugin from './Plugin'
import OA from '../../models/ontologies/OA'
import Mustache from 'mustache'
import _ from 'lodash'
import $ from 'jquery'

class SocialNetwork extends Plugin {



    static uri () {
        return "http://data.perseus.org/graphs/persons"
    }

    static icon () {
        return "user"
    }

}

export default SocialNetwork