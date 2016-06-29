import $ from 'jQuery'
import jQuery from 'jQuery'
import _ from 'lodash'
import Model from './lib/core/model.js'
window.$ = $
window.jQuery = jQuery
window._ = _

var getEndpoint = () => $('#annotator-main').data().sparqlEndpoint
var getUrn = () => $('#annotator-main').data().urn
var getUser = () => undefined // $('#annotator-main').dataset.user

var initialize = () => {
    var singleDoc = new Model();
    singleDoc.load(getEndpoint(), getUrn(),getUser())
    // TODO: have document with urn, config
    // TODO: get urn & endpoint
    // TODO: query endpoint for urn annotations
    // TODO: insert annotations into rdfstore
    // TODO: retrieve from rdfstore and
    // TODO: create annotation markers in document
    // TODO: show controls to create new annotations
    // TODO:
    return singleDoc
}

export default {
    initialize: initialize
}