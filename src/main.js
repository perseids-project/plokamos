import $ from 'jquery'
import jquery from 'jquery'
import _ from 'lodash'
import Model from './lib/core/model.js'
import Applicator from './lib/core/applicator.js'
import Annotator from './lib/core/annotator.js'
import History from './lib/core/history'
import Mustache from 'mustache.js'
window.$ = $
window.jQuery = jquery
window.jquery = jquery
window._ = _
window.Mustache = Mustache
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
    model: model
}