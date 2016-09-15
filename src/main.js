import './jquery-shim.js'
import 'bootstrap'
import _ from 'lodash'
import Model from './lib/models/model.js'
import Applicator from './lib/controllers/applicator.js'
import Annotator from './lib/controllers/annotator.js'
import History from './lib/models/history'
import 'typeahead.js'
window._ = _

class Plokamos {

    constructor (element) {
        var self = this
        this.anchor = $(element)
        this.bar = $(`<div class="plokamos-bar"/>`)
        this.bar.navigation = $(`<div class="plokamos-navigation col-xs-6">`)
        this.bar.plugins = $(`<div class="plokamos-plugins col-xs-6">`)
        this.bar.append(this.bar.navigation)
        this.bar.append(this.bar.plugins)
        $('body').append(this.bar)
        this.model = new Model(self);
        // keep this dynamically loaded for now
        this.getEndpoint = () => {return { query: self.anchor.data('sparql-endpoint'),read: self.anchor.data('sparql-select-endpoint'), write: self.anchor.data('sparql-update-endpoint')}}
        this.getUrn = () => self.anchor.data('urn')
        this.getUser = () => self.anchor.data('user')

        this.initialize = () => {

            self.model
                .load(self.getEndpoint(), self.getUrn(), self.getUser())
                .then((success) => self.applicator = new Applicator(self))
                .then((success) => self.history = new History(self))
                .then((success) => self.annotator = new Annotator(self))
        }

    }
}

window.Plokamos = Plokamos