import _ from 'lodash'
import $ from 'jquery'
import Mustache from 'mustache'
import OA from '../../models/ontologies/OA'
import Utils from '../../utils'
import Plugin from './Plugin'

class View {
    constructor(ontology,labels) {
        this.substringMatcher = Utils.substringMatcher
        this.names = ontology.resources() // todo: get from the vocabulary/ies in ontology; it's a simple list of uris
        var self = this
        self.ontology = ontology
        this.decodeHTML = Utils.decodeHTML

        this.updateValue = (event, text) => {
            var map = {
                subject: ["http://data.perseus.org/people/smith:","smith:"],
                predicate: ["http://data.snapdrgn.net/ontology/snap#","snap:","http://data.perseus.org/rdfvocab/addons/","perseusrdf:"],
                object: ["http://data.perseus.org/people/smith:","smith:"]
            }
            var triple = $(event.target).closest('.triple').get(0)
            var token = $(event.target).closest('.token').data('token')
            triple.setAttribute('data-' + token, text)
            if (triple.dataset[token] != triple.dataset[token + '-original']) $(triple).addClass('update')
            if (_.reduce (map[token], (acc, x) => acc || text.startsWith(x), false)) {
                $(event.target).removeClass('invalid')
                $(event.target).addClass('valid')
            }
            else {
                $(event.target).removeClass('valid')
                $(event.target).addClass('invalid')
            }
            $('#btn-apply').prop('disabled',$('.graph.old').find('.invalid').length||$('.graph.new').find('.typeahead.tt-input.valid').length!=$('.graph.new').find('.typeahead.tt-input').length)
        }

        this.view = {
            label: () => {
                return (uri, render) => {
                    var rendered = this.decodeHTML(render(uri))
                    return self.ontology.label(rendered) || rendered
                }
            }
        }

        this.partials = {
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
            `,
            graph: `<div class="graph old" data-graph="{{g}}">{{#triples}}{{> triple}}{{/triples}}</div>`,
            graphs: `{{#annotations}}{{> graph}}{{/annotations}}`,
            // done: add empty graph container to create template and add new triples to it.
            new: `<div class="graph new"/><div style="text-align: center; z-index:5;"><div id="new_button" class="btn btn-info btn-circle" title="Add triple">+</div></div>`,
            anchor: `<div class='anchor'><span class="prefix selector">{{selector.prefix}}</span><span class="exact selector">{{selector.exact}}</span><span class="suffix selector">{{selector.suffix}}</span></div>`
        } // planned: add selector and display anchor

        this.init = (jqElement, data) => {
            jqElement.html(Mustache.render("{{> graphs}}{{> new}}{{> anchor}}",Object.assign({},data,self.view),self.partials))
            jqElement.closest('.modal').find()
            function activate(el) {
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
                el.find('#new_button').click((e) => {
                    var triple = $('.graph.new').find('.triple:not(.delete):last')
                    // the following prevents the button from creating a new triple before the previous one has been completed
                    if (!triple.length || (triple.attr('data-subject') && triple.attr('data-predicate') && triple.attr('data-object'))) {
                        var list = $(Mustache.render("{{> triple}}",Object.assign({},{g:"",s:"",p:"",o:""},self.view),self.partials))
                        list.appendTo($('.graph.new'))
                        activate(list)
                    }
                })
                el.find('input').each((i,e) => $(e).typeahead({minLength:3,highlight:true},{source:self.substringMatcher(self.names)}))

                el.find('.token').on('typeahead:selected',self.updateValue)
                el.find('.token').on('typeahead:autocompleted', self.updateValue)
                el.find('.token').on('keyup', (e) => { if (e.key.length===1 || e.key==="Backspace") { self.updateValue(e,e.target.value) }})

                return el
            }
            // jqElement.find('.tt-menu').insertAfter(this.closest('.group'))
            // planned: move autocomplete element (possibly have to add another container on the outside)
            return activate(jqElement)
        }

    }


}

class Reporter {

    constructor(ontologies,annotator, urn){
        this.urn = urn
        this.ontologies = ontologies
        this.annotator = annotator
    }

    title(bindings, annotationId) {

        // todo: Use ontologies to figure out title? == app.ontology.makeTitle(bindings)
        var object = _.find(bindings, (binding) => binding.p.value.endsWith("bond-with")).o.value
        var bond = _.find(bindings, (binding) => binding.p.value.endsWith("has-bond")).o.value
        var predicate = _.find(bindings, (binding) => binding.s.value === bond && binding.p.value.endsWith("bond-with")).o.value

        let title = `${object} identifies ${object.replace('http://data.perseus.org/people/smith:','').split('-')[0]} as ${predicate} in ${this.urn}`

        // todo: figure out default graph for use cases (maybe motivatedBy, by plugin or manual in anchor?) BY PLUGIN
        return OA.makeTitle(annotationId, SocialNetwork.uri(),title)
    }

    delete_graphs() {
        var dG = this.annotator().modal.find('.graph.old.delete')
        var delete_graphs = dG.map((i,el) => $(el).data('graph')).get()
        dG.remove()
        return delete_graphs
    }

    delete_triples(annotations) {
        var dT = this.annotator().modal.find('.graph.old .triple.delete')
        var delete_triples = _.flatten(
            _.zip(dT.closest('.graph.old').map((i,el) => $(el).data('graph')), dT.map((i,el) => $(el).data('original-subject')), dT.map((i,el) => $(el).data('original-predicate')), dT.map((i,el) => $(el).data('original-object')))
                .map((zipped) => {return {g:zipped[0],s:zipped[1],p:zipped[2],o:zipped[3]}})
                .map((gspo) => this.ontologies.expand(gspo, annotations))
        )
        dT.remove()
        return delete_triples
    }

    update_triples() {
        var uT = this.annotator().modal.find('.graph.old .triple.update')
        var update_triples = _.zip(uT.closest('.graph.old').map((i,el) => $(el).data('graph')), uT.map((i,el) => $(el).data('original-subject')), uT.map((i,el) => $(el).data('original-predicate')), uT.map((i,el) => $(el).data('original-object')), uT.map((i,el) => $(el).attr('data-subject')), uT.map((i,el) => $(el).attr('data-predicate')), uT.map((i,el) => $(el).attr('data-object')))
        return update_triples
    }

    create_triples(annotations, cite, selector) {
        var cT = this.annotator().modal.find('.graph.new .triple:not(.delete)')
        var new_triples = _.flatten(_.zip(cT.map((i,el) => $(el).attr('data-subject')), cT.map((i,el) => $(el).attr('data-predicate')), cT.map((i,el) => $(el).attr('data-object')))
            .filter((t)=> t[0] && t[1] && t[2])
            .map((t) => {return {g:cite,s:t[0],p:t[1],o:t[2]}})
            .map((t) => this.ontologies.expand(t,annotations)))
        _.assign(selector,{id:cite+"#sel-"+Utils.hash(JSON.stringify(selector)).slice(0, 4)})
        var selector_triples = OA.expand(selector.type)(_.mapValues(selector,(v) => v.replace(new RegExp('\n','ig'),'')), SocialNetwork.uri())
        var create_triples = new_triples.length ? _.concat(new_triples,selector_triples, this.title(_.flatten(new_triples),cite)) : []
        return _.flatten(create_triples)
    }

}

class SocialNetwork extends Plugin {

    constructor(app) {
        super()
        var self = this
        this.annotator = () => app.annotator
        this.view = new View(app.ontology)
        this.reporter = new Reporter(app.ontology, this.annotator, app.getUrn())
        this.origin = {}
        this.selector = {}

        var button = '<div class="btn btn-primary btn-socialnetwork btn-edit" data-toggle="modal" data-target="#edit_modal"><span class="glyphicon glyphicon-user"></span></div>'
        $('body').on('shown.bs.popover',(e) => $('#'+e.target.getAttribute('aria-describedby')).find('.popover-footer').append(button))
        $('body').on('click','.btn-socialnetwork',(e) => {
            self.annotator().modal.find('.modal-header > h3').html("Social Network")
            let id = $(e.target).closest('.popover').attr('id')
            self.origin = $(document.querySelectorAll(`[aria-describedby="${id}"]`))
            var data = _.pickBy(self.origin.data('annotations'),(v) => _.find(v, (o) => (o.g.value || o.g) === SocialNetwork.uri()))
            var newSelector = self.origin.data('selector')
            var graphs = _.mapValues(data, (v,k) => _.flatten(OA.getBodies(v).map((b) => app.ontology.simplify(b,k))))
            this.selector = newSelector
            var body = $('.modal-body')
            self.view.init(body,{
                annotations:Object.keys(graphs).map((k) => { return {g:k,triples:graphs[k]}})
            })

            var apply_button = self.annotator().modal.find('#btn-apply')
            // todo: add selector to button?
            apply_button.off()
            apply_button.on('click',self.apply)
            // init reporter
        })

        this.template = () => {}

        this.button = () => {}

        /**
         * We are done editing and are now processing, in order:
         * 1. Pre-existing annotation bodies that have been completely deleted
         * 2. Partially deleted annotation bodies
         * 3. Modified annotation bodies
         * 4. Newly created annotation body
         */
        this.apply = (event) => {

            // get prerequisite data
            let annotations = self.origin.data('annotations')
            let cite = Utils.cite(app.getUser()+app.getUrn(),Math.random().toString())

            // retrieve data
            let delete_graphs = self.reporter.delete_graphs()
            let delete_triples = self.reporter.delete_triples(annotations)
            let update_triples = self.reporter.update_triples()
            let create_triples = self.reporter.create_triples(annotations, cite, self.selector)

            // send to annotator
            var acc = []
            let annotator = this.annotator()
            annotator
                .drop(delete_graphs)
                .then((res) => {
                    acc.push(res)
                    return annotator.delete(_.concat(delete_triples,delete_graphs.map((id) => annotations[id])))
                })
                .then((res) => {
                    acc.push(res)
                    return annotator.update(
                        _.flatten(update_triples.map((t) => { return app.ontology.expand({ g:t[0], s:t[1], p:t[2], o:t[3] },annotations)})),
                        _.flatten(update_triples.map((t) => { return app.ontology.expand({ g:t[0], s:t[4], p:t[5], o:t[6] },annotations)})),
                        SocialNetwork.uri()
                    )
                })
                .then((res) => {
                    acc.push(res)
                    return annotator.create(cite,create_triples, SocialNetwork.uri())
                })
                .then((res) => annotator.apply(_.flatten(acc.concat(res))))

            self.origin.popover('hide')
        }

        this.register = () => {}

    }

    static uri () {
        return "http://data.perseus.org/graphs/persons"
    }
}

export default SocialNetwork