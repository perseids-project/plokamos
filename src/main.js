import './jquery-shim.js'
import 'bootstrap'
import _ from 'lodash'
import Model from './lib/models/model.js'
import Applicator from './lib/controllers/applicator.js'
import Annotator from './lib/controllers/annotator.js'
import History from './lib/models/history'
import OntologySet from './lib/models/ontologySet'
import 'typeahead.js'
window._ = _

class Plokamos {

    constructor (element) {
        var self = this
        this.anchor = $(element)
        window.onbeforeunload = (e) => {
            if (!$('#plokamos-commit').attr('disabled')) {
                msg = "You have uncommitted data. Do you want to commit to the Perseids servers before leaving this page?";
                e.returnValue=msg;
                return msg
            }
        }
        // todo: this.ui
        this.bar = $(`<div class="plokamos-bar"/>`)
        this.bar.navigation = $(`<div class="plokamos-navigation col-xs-6">`)
        this.bar.plugins = $(`<div class="plokamos-plugins col-xs-6">`)
        this.bar.append(this.bar.navigation)
        this.bar.append(this.bar.plugins)

        $('body').append(this.bar)
        this.model = new Model(self);
        // keep this dynamically loaded for now
        this.getEndpoint = () => {return {
            query: self.anchor.data('sparql-endpoint'),
            read: self.anchor.data('sparql-select-endpoint') || self.anchor.data('sparql-endpoint'),
            write: self.anchor.data('sparql-update-endpoint') || self.anchor.data('sparql-endpoint'),
            config: self.anchor.data('sparql-config-endpoint') || self.anchor.data('sparql-select-endpoint') || self.anchor.data('sparql-endpoint')
        }}
        this.getUrn = () => self.anchor.data('urn')
        this.getUser = () => self.anchor.data('user')

        this.initialize = () => {

            self.model
                .load(self.getEndpoint(), self.getUrn(), self.getUser())
                .then((success) => OntologySet.from(self.getEndpoint().config))
                .then((ontology) => self.ontology = ontology)
                .then((success) => self.applicator = new Applicator(self))
                .then((success) => self.history = new History(self))
                .then((success) => self.annotator = new Annotator(self))
        }

    }
}

window.Plokamos = Plokamos