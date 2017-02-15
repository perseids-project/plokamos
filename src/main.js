import './jquery-shim.js'
import 'bootstrap'
import _ from 'lodash'
import Model from './lib/models/model.js'
import Applicator from './lib/controllers/applicator.js'
import Annotator from './lib/controllers/annotator.js'
import History from './lib/models/history'
import OntologySet from './lib/models/ontologySet'
import SocialNetwork from './lib/views/annotator/SocialNetwork'
import Characterizations from './lib/views/annotator/Characterizations'
import CorpusDiagram from './lib/views/applicator/CorpusDiagram'
import 'typeahead.js'
window._ = _

class Plokamos {

    constructor (element) {
        var self = this
        this.body = $('body')
        this.anchor = $(element)
        this.anchor.raw = element
        window.onbeforeunload = (e) => {
            if ($('#plokamos-commit').length && !$('#plokamos-commit').attr('disabled')) {
                msg = "You have uncommitted data. Do you want to commit to the Perseids servers before leaving this page?";
                e.returnValue=msg;
                return msg
            }
        }
        // todo: replace with button
        this.ui = {}
        this.ui.bar = $(`<div class="plokamos-bar"/>`)
        this.ui.container = $(`<div class="plokamos-container"/>`)
        this.ui.button = $(`<div class="plokamos-button"><img src="/plokamos/assets/img/plokamos.svg" title="Plokamos Annotator"/></div>`)
        this.ui.navigation = $(`<div class="plokamos-navigation">`)
        this.ui.plugins = $(`<div class="plokamos-plugins">`)
        this.ui.container.append(this.ui.navigation)
        this.ui.container.append(this.ui.plugins)
        this.ui.bar.append(this.ui.container)
        this.ui.bar.append(this.ui.button)
        this.spinner = $(`<div class="spinner well" style="display: none;"><h2>Plokamos is loading</h2><div class="progress">
  <div class="progress-bar progress-bar-primary progress-bar-striped active" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%">
    <span class="sr-only">100% Complete</span>
  </div>
</div></div>`).appendTo(this.body)
        this.spinner.message = $('<span>Loading ...</span>').appendTo(this.spinner)
        this.loadMessage = (message) => {
            if (message) {
                self.spinner.message.html(message)
                self.spinner.css('display','inline-block')
            } else {
                self.spinner.css('display','none')
            }
        }

        this.body.append(this.ui.bar)
        this.model = new Model(self);
        // keep this dynamically loaded for now
        this.getEndpoint = () => {return {
            query: self.body.data('sparql-endpoint'),
            read: self.body.data('sparql-select-endpoint') || self.body.data('sparql-endpoint'),
            write: self.body.data('sparql-update-endpoint') || self.body.data('sparql-endpoint'),
            config: self.body.data('sparql-config-endpoint') || self.body.data('sparql-select-endpoint') || self.body.data('sparql-endpoint')
        }}
        this.getUrn = () => self.body.data('urn')
        this.getUser = () => self.body.data('user')

        this.initialize = (cfg) => {
            var config = cfg || {applicator: true, history: true, annotator: ["social-network", "characterizations"], corpusdiagram: true}
            if (self.getUser())
            self.model
                .load(self.getEndpoint(), self.getUrn(), self.getUser())
                // following setup should depend on configuration
                .then((success) => OntologySet.from(self, self.getEndpoint().config))
                .then((ontology) => self.ontology = ontology)
                .then((success) => { if (config.applicator) self.applicator = new Applicator(self) })
                .then((success) => { if (config.history) self.history = new History(self) })
                .then((success) => { if (config.annotator) self.annotator = new Annotator(self) })
                .then((success) => { if (config.annotator && config.annotator.indexOf('social-network')+1) self.socialnetwork = new SocialNetwork(self) })
                .then((success) => { if (config.annotator && config.annotator.indexOf('characterizations')+1) self.characterizations = new Characterizations(self) })
                .then((success) => { if (config.corpusdiagram) self.globalview = new CorpusDiagram(self) })
                .fail(() => self.spinner.css('display','inline-block').html(`<div class="btn btn-danger" onclick="$('.spinner').css('display','none');">Loading data failed, click to continue without annotations.</div>`))
        }

    }
}

window.Plokamos = Plokamos