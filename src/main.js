import $ from 'jquery'
import jquery from 'jquery'
import _ from 'lodash'
import Model from './lib/core/model.js'
import Applicator from './lib/core/applicator.js'
import Annotator from './lib/core/annotator.js'
import TextQuoteAnchor from 'dom-anchor-text-quote'
window.$ = $
window.jQuery = jquery
window.jquery = jquery
window._ = _
import 'typeahead.js'


var applicator = new Applicator();
var annotator = new Annotator();

var initialize = () => {
    var getEndpoint = () => $('#annotator-main').data().sparqlEndpoint
    var getUrn = () => $('#annotator-main').data().urn
    var getUser = () => undefined // $('#annotator-main').dataset.user
    var model = new Model();
    var results = model
        .load( getEndpoint(), getUrn(),getUser() )
        .then( (success) => applicator.load(model) )
        .then( (success) => annotator.load(model,getUrn()) )
    
    // have document with urn, config
    // get urn & endpoint
    // query endpoint for urn annotations
    // insert annotations into rdfstore
    // retrieve selectors+ids from rdfstore and
    // create annotation markers in document
    // add triples to markers

    return [model, applicator, annotator]
}

// TODO: define clean interface for plugin, Annotator & Applicator
// TODO: RIP marginotes

export default {
    initialize: initialize,
    applicator: applicator,
    annotator: annotator,
    tqa: TextQuoteAnchor
}