import $ from 'jQuery'
import jQuery from 'jQuery'
import _ from 'lodash'
import Model from './lib/core/model.js'
import Applicator from './lib/core/applicator.js'
window.$ = $
window.jQuery = jQuery
window._ = _

var getEndpoint = () => $('#annotator-main').data().sparqlEndpoint
var getUrn = () => $('#annotator-main').data().urn
var getUser = () => undefined // $('#annotator-main').dataset.user

var initialize = () => {
    var model = new Model();
    var applicator = new Applicator();
    var results = model
        .load(getEndpoint(), getUrn(),getUser())
        .then( (sucess) => applicator.annotate(model) )
    
    // have document with urn, config
    // get urn & endpoint
    // query endpoint for urn annotations
    // insert annotations into rdfstore
    
    // TODO: retrieve from rdfstore and
    // TODO: create annotation markers in document
    // TODO: show controls to create new annotations
    // TODO:
    return [model, applicator, results]
}

export default {
    initialize: initialize
}