import $ from 'jquery'
import jquery from 'jquery'
import _ from 'lodash'
import Model from './lib/models/model.js'
import Applicator from './lib/controllers/applicator.js'
import Annotator from './lib/controllers/annotator.js'
import History from './lib/models/history'
import Mustache from 'mustache.js'
window.$ = $
window.jQuery = jquery
window.jquery = jquery
window._ = _
import TextQuoteAnchor from 'dom-anchor-text-quote'
import wrapRangeText from 'wrap-range-text'
import 'typeahead.js'

var model = new Model();

var initialize = () => {
    var getEndpoint = () => $('#annotator-main').data().sparqlEndpoint
    var getUrn = () => $('#annotator-main').data().urn
    var getUser = () => undefined // $('#annotator-main').dataset.user

    var results = model
        .load( getEndpoint(), getUrn(),getUser() )
        .then( (success) => window.perseids.applicator = new Applicator(model) )
        .then( (success) => window.perseids.history = new History(model, window.perseids.applicator) )
        .then( (success) => window.perseids.annotator = new Annotator(model,window.perseids.applicator, window.perseids.history) )
}

// TODO: define clean interface for plugin, Annotator & Applicator

export default {
    initialize: initialize,
    model: model,
    tqa: TextQuoteAnchor,
    wrapRangeText:wrapRangeText
}