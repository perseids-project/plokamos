import Plugin from './Plugin'
import OA from '../../models/ontologies/OA'
import Mustache from 'mustache'
import _ from 'lodash'
import $ from 'jquery'

class SocialNetwork extends Plugin {

    constructor(app) {

        var config = {
            titleFn: (bindings, annotationId) => {

                // todo: this part is plugin specific
                var object = _.find(bindings, (binding) => binding.p.value.endsWith("bond-with")).o.value
                var bond = _.find(bindings, (binding) => binding.p.value.endsWith("has-bond")).o.value
                var predicate = _.find(bindings, (binding) => binding.s.value === bond && binding.p.value.endsWith("bond-with")).o.value

                let title = `${object} identifies ${object.replace('http://data.perseus.org/people/smith:', '').split('-')[0]} as ${predicate} in ${this.urn}`

                return OA.makeTitle(annotationId, SocialNetwork.uri(), title)
            },
            activateFn: (self) => (el) => {
                el.find('div.btn-delete').click((e) => {
                    var triple = $(e.target).closest('.triple')
                    triple.animate({'height':'0px', 'margin-top':'0px', 'margin-bottom':'0px' },{duration:150, complete:() =>{$(e.target).closest('.triple').hide()}})
                    triple.addClass('delete')
                    if (!triple.siblings(':not(.delete)').length) triple.closest('.graph.old').addClass('delete')
                })
                el.find('.btn-accept').click((e) => {
                    var triple = $(e.target).closest('.triple')
                    var text = triple.find('.tt-input').val()
                    var editing = triple.find('a.editing')
                    if (text.trim()) {
                        editing.text(this.ontology.label(text)) // <-- planned: generalize for other ontologies
                        triple.addClass('update')
                        triple.get().forEach((elem) => elem.setAttribute("data-" + editing.data('token'),text))
                    }
                    editing.removeClass('editing')
                })
                // todo: rewrite btn-accept to apply label to entered values
                // todo: fix self. references
                el.find('#new_button').click((e) => {
                    var triple = $('.graph.new').find('.triple:not(.delete):last')
                    // the following prevents the button from creating a new triple before the previous one has been completed
                    if (!triple.length || (triple.attr('data-subject') && triple.attr('data-predicate') && triple.attr('data-object'))) {
                        var list = $(Mustache.render("{{> triple}}",Object.assign({},{g:"",s:"",p:"",o:""},self.view),self.partials)) // todo: self
                        list.appendTo($('.graph.new'))
                        self.activate(list)
                    }
                })
                el.find('input').each((i,e) => $(e).typeahead({minLength:3,highlight:true},{source:self.substringMatcher(self.names)})) // todo: self

                el.find('.token').on('typeahead:selected',self.updateValue) // todo: self
                el.find('.token').on('typeahead:autocompleted', self.updateValue) // todo: self
                el.find('.token').on('keyup', (e) => { if (e.key.length===1 || e.key==="Backspace") { self.updateValue(e,e.target.value) }}) // todo: self

                return el
            },
            partials: {
                triple: `
              <div class="triple" title="Graph:{{g}} Subject:{{s}} Predicate:{{p}} Object:{{o}}" data-original-subject="{{s}}" data-original-predicate="{{p}}" data-original-object="{{o}}" data-subject="{{s}}" data-predicate="{{p}}" data-object="{{o}}">
                <div class="sentence well container">
                  <div class="token subject col-xs-12 col-md-4" data-token="subject">
                    <input class="typeahead" placeholder="Subject" value="{{#label}}{{s}}{{/label}}">
                  </div>
                  <div class="token predicate col-xs-12 col-md-4" data-token="predicate">
                    <input class="typeahead" placeholder="Predicate" value="{{#label}}{{p}}{{/label}}">
                  </div>
                  <div class="token object col-xs-12 col-md-4" data-token="object">
                    <input class="typeahead" placeholder="Object" value="{{#label}}{{o}}{{/label}}">
                  </div>
                </div>
                <div class="btn-delete" title="Delete triple"><span class="glyphicon glyphicon-trash"/></div>
              </div>
            `
            },
            validateMp: {
                subject: ["http://data.perseus.org/people/smith:","smith:"],
                predicate: ["http://data.snapdrgn.net/ontology/snap#","snap:","http://data.perseus.org/rdfvocab/addons/","perseusrdf:"],
                object: ["http://data.perseus.org/people/smith:","smith:"]
            },
            validateFn: (map) => (token, text) => (token && text) ? _.reduce(map[token], (acc, x) => acc || text.startsWith(x), false) : $('.graph.old').find('.invalid').length||$('.graph.new').find('.typeahead.tt-input.valid').length!=$('.graph.new').find('.typeahead.tt-input').length
        }

        super(app,config)

    }

    static uri () {
        return "http://data.perseus.org/graphs/persons"
    }

    static icon () {
        return "user"
    }

}

export default SocialNetwork