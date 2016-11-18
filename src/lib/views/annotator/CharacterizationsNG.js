import Plugin from './Plugin'
import OA from '../../models/ontologies/OA'
import Mustache from 'mustache'
import _ from 'lodash'
import $ from 'jquery'

class Characterizations extends Plugin {

    constructor(app) {

        var config = {
            titleFn: (bindings, annotationId) => {
                // todo: Use ontologies to figure out title? == app.ontology.makeTitle(bindings)
                // todo: also figure out motivation in ontology

                // map bindings to subjects, map subject with hasCharacter, hasEnglish, hasGreek

                let xs = _.chain(bindings).groupBy((gspo) => gspo.s.value || gspo.s)
                    .mapValues((list) => {
                        return {
                            character: _.find(list, (binding) => binding.p.value.endsWith("hasCharacter")).o.value,
                            english: _.find(list, (binding) => binding.p.value.endsWith("hasEnglish")).o.value,
                            greek: _.find(list, (binding) => binding.p.value.endsWith("hasGreek")).o.value
                        }
                    })
                    .values()
                    .value()

                return _.flatten(xs.map((x) => OA.makeTitle(annotationId, Characterizations.uri(), `${x.character} is described as '${x.english.split('@')[1]}' in ${x.english}`)))
            },
            activateFn: (self) => (el) => {
                el.find('div.btn-delete').click((e) => {
                    var triple = $(e.target).closest('.triple')
                    triple.animate({'height': '0px', 'margin-top': '0px', 'margin-bottom': '0px'}, {
                        duration: 150,
                        complete: () => {
                            $(e.target).closest('.triple').hide()
                        }
                    })
                    triple.addClass('delete')
                    if (!triple.siblings(':not(.delete)').length) triple.closest('.graph.old').addClass('delete')
                })
                el.find('#new_button').click((e) => {
                    var split = _.last($("#annotator-main").data('urn').split("."))
                    var character = split ? "http://data.perseus.org/people/smith:" + split.replace(new RegExp('_', 'gi'), "-") + "#this" : ""
                    var triple = $('.graph.new').find('.triple:not(.delete):last')
                    // the following prevents the button from creating a new triple before the previous one has been completed
                    if (!triple.length || (triple.attr('data-subject') && (triple.attr('data-predicate') || triple.attr('data-object')))) {
                        var list = $(Mustache.render("{{> triple}}", Object.assign({}, {
                            g: "",
                            s: character,
                            p: "",
                            o: ""
                        }, self.view), self.partials))
                        list.appendTo($('.graph.new'))
                        self.activate(list)
                    }
                })
                el.find('input').each((i, e) => $(e).typeahead({
                    minLength: 3,
                    highlight: true
                }, {source: self.substringMatcher(self.names)}))

                el.find('.token').on('paste', self.updateValue)
                el.find('.token').on('typeahead:selected', self.updateValue)
                el.find('.token').on('typeahead:autocompleted', self.updateValue)
                el.find('.token').on('keyup', (e) => {
                    if (e.key.length === 1 || e.key === "Backspace") {
                        self.updateValue(e, e.target.value)
                    }
                })

                return el
            },
            partials: {
                triple: `
                  <div class="triple" title="Graph:{{g}} Subject:{{s}} Predicate:{{p}} Object:{{o}}" data-original-subject="{{s}}" data-original-predicate="{{p}}" data-original-object="{{o}}" data-subject="{{s}}" data-predicate="{{p}}" data-object="{{o}}">
                   <div class="sentence well container">
                      <div class="token subject col-xs-12 col-md-4" data-token="subject">
                      <div class="input-group">
                          <span class="input-group-addon" title="Person ID" id="basic-addon1"><span class="glyphicon glyphicon-user"></span></span>
                        <input class="typeahead" placeholder="Character" value="{{#label}}{{s}}{{/label}}">
                      </div>
                      </div>
                      <div class="token predicate col-xs-12 col-md-4" data-token="predicate">
                      <div class="input-group">
                          <span class="input-group-addon" title="English URN" id="basic-addon1">aA</span></span>
                        <input class="typeahead" placeholder="English" value="{{#label}}{{p}}{{/label}}">
                        </div>
                      </div>
                      <div class="token object col-xs-12 col-md-4" data-token="object">
                      <div class="input-group">
                          <span class="input-group-addon" title="Greek URN" id="basic-addon1">αΑ</span></span>
                        <input class="typeahead" placeholder="Greek / Latin" value="{{#label}}{{o}}{{/label}}">
                        </div>
                      </div>
                    </div>
                    <div class="btn-delete" title="Delete triple"><span class="glyphicon glyphicon-trash"/></div>
                  </div>
                `
            },
            validateMp: {
                subject: ["http://data.perseus.org/people/smith:","smith:"],
                predicate: [""],
                object: [""]
            },
            validateFn: (map) => (token, text) => (token && text) ?
                text.trim() && _.reduce(map[token], (acc, x) => acc || text.startsWith(x), false) :
            $('.graph').find('.invalid').length
            || !$('.graph.new').find('.triple').map((i,e) => $(e).find('.predicate .valid').length+$(e).find('.object .valid').length).toArray().reduce((acc,e) => acc&&e, true)
            // todo: getting there, needs to deal with empty or blank strings
        }

        super(app,config)

    }

    static ns () {
        return "http://data.perseids.org/characterization#"
    }

    static uri () {
        return "http://data.perseus.org/graphs/characterizations"
    }

    static icon () {
        return "transfer"
    }
}

export default Characterizations