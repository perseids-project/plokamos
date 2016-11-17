import _ from 'lodash'
import $ from 'jquery'
import Mustache from 'mustache'
import OA from '../../models/ontologies/OA'
import Utils from '../../utils'

/**
 *
 */
class View {
    /**
     *
     * @param ontology The apps ontologySet
     * @param activate A function that sets up event handlers in the editor
     * @param map This is validation -->
     * @param partials A collection of Mustache templates to assemble the interface for editing annotation bodies
     * @param view Additions to partials, e.g. macros
     * @param vaalidator A configured validator instance to provide UI feedback to data entries
     */
    constructor(ontology, activate, partials, view, validator) {
        var self = this
        self.activate = activate(self)
        self.substringMatcher = Utils.substringMatcher
        self.names = ontology.resources()
        self.ontology = ontology
        self.decodeHTML = Utils.decodeHTML

        /**
         * This function registers data change events in the editor, propagates them to the embedded state and runs the validator
         * @param event The change event
         * @param text The data that's been entered (except in case of paste event)
         */
        self.updateValue = (event, text) => {
            var triple, token
            if (!text && event.type === "paste") {
                text = event.target.value + event.originalEvent.clipboardData.getData("text")
            }
            if (text) {
                triple = $(event.target).closest('.triple').get(0)
                token = $(event.target).closest('.token').data('token')
                triple.setAttribute('data-' + token, text)
                if (triple.dataset[token] != triple.dataset[token + '-original']) $(triple).addClass('update')
            }
            if (text && validator.validate(token, text)) {
                $(event.target).removeClass('invalid')
                $(event.target).addClass('valid')
            }
            else {
                $(event.target).removeClass('valid')
                $(event.target).addClass('invalid')
            }

            $('#btn-apply').prop('disabled',validator.validate())
        }

        self.view = Object.assign({},
            {
                label: () => {
                    return (uri, render) => {
                        var rendered = self.decodeHTML(render(uri))
                        return self.ontology.label(rendered) || rendered
                    }
                }
            },
            view)

        self.partials = Object.assign({},
            {
                // todo: do graphs -> components -> gspo (also needs some way of representing different annotation body shapes)
                graph: `<div class="graph old" data-graph="{{g}}">{{#triples}}{{> triple}}{{/triples}}</div>`,
                graphs: `{{#annotations}}{{> graph}}{{/annotations}}`,
                // done: add empty graph container to create template and add new triples to it.
                new: `<div class="graph new"/><div style="text-align: center; z-index:5;"><div id="new_button" class="btn btn-info btn-circle" title="Add component">+</div></div>`,
                anchor: `<div class='anchor'><span class="prefix selector">{{selector.prefix}}</span><span class="exact selector">{{selector.exact}}</span><span class="suffix selector">{{selector.suffix}}</span></div>`
            },
            partials
        )

        /**
         * This function embeds an editor into jqElement and populates it with data
         * @param jqElement Container for editor interface
         * @param data Annotations to render in annotations -> components -> gspo format
         * @return {*}
         */
        self.init = (jqElement, data) => {
            var res = Mustache.render("{{> graphs}}{{> new}}{{> anchor}}",Object.assign({},data,self.view),self.partials)
            jqElement.html(res)
            return self.activate(jqElement)
        }

    }

}

/**
 * The Reporter class communicates input from the interface layer to
 */
class Reporter {

    constructor(ontologies, annotator, urn, titleFn, namespace){
        this.urn = urn
        this.ontologies = ontologies
        this.annotator = annotator
        this.title = titleFn
        this.namespace = namespace
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
            _.zip(
                dT.closest('.graph.old').map((i,el) => $(el).data('graph')),
                dT.map((i,el) => $(el).data('original-subject')),
                dT.map((i,el) => $(el).data('original-predicate')),
                dT.map((i,el) => $(el).data('original-object'))
            )
                .map((zipped) => {return {g:zipped[0],s:zipped[1],p:zipped[2],o:zipped[3]}})
                .map((gspo) => this.ontologies.expand(gspo, annotations, this.namespace))
        )
        dT.remove()
        return delete_triples
    }

    update_triples() {
        var uT = this.annotator().modal.find('.graph.old .triple.update')
        var update_triples = _.zip(
            uT.closest('.graph.old').map((i,el) => $(el).data('graph')),
            uT.map((i,el) => $(el).data('original-subject')),
            uT.map((i,el) => $(el).data('original-predicate')),
            uT.map((i,el) => $(el).data('original-object')),
            uT.map((i,el) => $(el).attr('data-subject')),
            uT.map((i,el) => $(el).attr('data-predicate')),
            uT.map((i,el) => $(el).attr('data-object'))
        )
        return update_triples
    }

    create_triples(annotations, cite, selector, defaultGraph) {
        var cT = this.annotator().modal.find('.graph.new .triple:not(.delete)')
        var new_triples = _.flatten(
            _.zip(
                cT.map((i,el) => $(el).attr('data-subject')),
                cT.map((i,el) => $(el).attr('data-predicate')),
                cT.map((i,el) => $(el).attr('data-object'))
            )
            .map((t) => {return {g:cite,s:t[0],p:t[1],o:t[2]}})
            .map((t) => this.ontologies.expand(t,annotations, this.namespace))
        )
        selector.id = cite+"#sel-"+Utils.hash(JSON.stringify(selector)).slice(0, 4)
        let selector_triples = OA.expand(selector.type)(
            _.mapValues(selector,(v) => v.replace(new RegExp('\n','ig'),'')),
            defaultGraph
        )
        let create_triples = new_triples.length ? _.concat(new_triples,selector_triples, this.title(_.flatten(new_triples),cite)) : []
        return _.flatten(create_triples)
    }

}

/**
 *
 *
 */
class Validator {
    /**
     *
     * @param positionsMp A map between token positions and valid namespaces/prefixes
     * @param validateFn
     */
        constructor(positionsMp, validateFn) {
            this.validate = validateFn(positionsMp)
            this.map = () => positionsMp
        }
}

// todo: develop null ops as placeholders
// i.e. Plugin is instantiable and does pure gspo handling
class Plugin {

    constructor(app,config) {
        var self = this
        this.annotator = () => app.annotator
        this.validator = new Validator(config.validateMp, config.validateFn)
        // ontology, activate, map, partials, view
        this.view = new View(app.ontology, config.activateFn, config.partials, config.view, this.validator)
        // ontologies, annotator, urn, title
        this.reporter = new Reporter(app.ontology, this.annotator, config.urn, config.titleFn, this.constructor.ns())
        this.origin = {}
        this.selector = {}

        var button = `<div class="btn btn-primary btn-${this.constructor.name} btn-edit" data-toggle="modal" data-target="#edit_modal" title="Edit ${this.constructor.name}"><span class="glyphicon glyphicon-${this.constructor.icon()}"></span></div>`
        $('body').on('shown.bs.popover',(e) => $('#'+e.target.getAttribute('aria-describedby')).find('.popover-footer').append(button))
        $('body').on('click','.btn-'+this.constructor.name,(e) => {
            self.annotator().modal.find('.modal-header > h3').html(this.constructor.name)
            let id = $(e.target).closest('.popover').attr('id')
            self.origin = $(document.querySelectorAll(`[aria-describedby="${id}"]`))

            var data = _.pickBy(self.origin.data('annotations'),(v) => _.find(v, (o) => (o.g.value || o.g) === this.constructor.uri()))
            var newSelector = self.origin.data('selector')
            this.selector = newSelector
            var body = $('.modal-body')

            var graphs = _.mapValues(data, (v,k) => _.flatten(OA.getBodies(v).map((b) => app.ontology.simplify(b,k, this.constructor.ns()))))

            self.view.init(body,{
                annotations:Object.keys(graphs).map((k) => { return {g:k,triples:graphs[k]}})
            })

            var apply_button = self.annotator().modal.find('#btn-apply')
            apply_button.off()
            apply_button.on('click',self.apply)
            // init reporter
        })

        this.apply = (event) => {

            // get prerequisite data
            let annotations = self.origin.data('annotations')
            let cite = Utils.cite(app.getUser()+app.getUrn(),Math.random().toString())
            // retrieve data
            let delete_graphs = self.reporter.delete_graphs()
            let delete_triples = self.reporter.delete_triples(annotations)
            let update_triples = self.reporter.update_triples()
            let create_triples = self.reporter.create_triples(annotations, cite, self.selector, this.constructor.uri())

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
                    // todo: make sure annotator is ontology agnostic, receives list of gspo
                    return annotator.update(
                        _.flatten(update_triples.map((t) => { return app.ontology.expand({ g:t[0], s:t[1], p:t[2], o:t[3] },annotations,this.constructor.ns())})), // todo: use correct ontology
                        _.flatten(update_triples.map((t) => { return app.ontology.expand({ g:t[0], s:t[4], p:t[5], o:t[6] },annotations,this.constructor.ns())})), // todo: use correct ontology
                        this.constructor.uri()
                    )
                })
                .then((res) => {
                    acc.push(res)
                    return annotator.create(cite,create_triples, this.constructor.uri())
                })
                .then((res) => annotator.apply(_.flatten(acc.concat(res))))

            self.origin.popover('hide')
        }

        this.register = () => {}

    }

    static icon () {
        return "cog"
    }

    static ns () {
        return ""
    }

    static uri () {
        return "http://data.perseus.org/graphs/default"
    }
}

export default Plugin