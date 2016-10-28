import _ from 'lodash'
import Plugin from './Plugin'

class SocialNetwork extends Plugin {

    constructor(app) {
        this.annotator = () => app.annotator
        var template = new Template(app.ontology)
        var button = '<div class="btn btn-primary edit_btn" data-toggle="modal" data-target="#edit_modal"><span class="glyphicon glyphicon-cog"></span></div>'
        $('body').on('shown.bs.popover',(e) => $('#'+e.target.getAttribute('aria-describedby')).find('.popover-footer').append(button))
        $('body').on('click','.edit_btn',(e) => {
            let id = $(e.target).closest('.popover').attr('id')
            var origin = $(document.querySelectorAll(`[aria-describedby="${id}"]`))
            var data = origin.data('annotations')
            var newSelector = origin.data('selector')
            var graphs = _.mapValues(data, (v,k) => _.flatten(OA.getBodies(v).map((b) => app.ontology.simplify(b,k))))
            selector = newSelector
            template.init(body,{annotations:Object.keys(graphs).map((k) => { return {g:k,triples:graphs[k]}})})

        })

        this.modal.update = (data, newSelector) => {
        }
    }

    template(){}

    button() {}

    delete_graphs() {
        var dG = body.find('.graph.old.delete')
        var delete_graphs = dG.map((i,el) => $(el).data('graph')).get()
        dG.remove()
        return delete_graphs
    }

    delete_triples(annotations) {
        var dT = body.find('.graph.old .triple.delete')
        var delete_triples = _.flatten(
            _.zip(dT.closest('.graph.old').map((i,el) => $(el).data('graph')), dT.map((i,el) => $(el).data('original-subject')), dT.map((i,el) => $(el).data('original-predicate')), dT.map((i,el) => $(el).data('original-object')))
                .map((zipped) => {return {g:zipped[0],s:zipped[1],p:zipped[2],o:zipped[3]}})
                .map((gspo) => app.ontology.expand(gspo, annotations))
        )
        dT.remove()
        return delete_triples
    }

    update_triples() {
        var uT = body.find('.graph.old .triple.update')
        var update_triples = _.zip(uT.closest('.graph.old').map((i,el) => $(el).data('graph')), uT.map((i,el) => $(el).data('original-subject')), uT.map((i,el) => $(el).data('original-predicate')), uT.map((i,el) => $(el).data('original-object')), uT.map((i,el) => $(el).attr('data-subject')), uT.map((i,el) => $(el).attr('data-predicate')), uT.map((i,el) => $(el).attr('data-object')))
        return update_triples
    }

    create_triples(annotations, cite) {
        var cT = body.find('.graph.new .triple:not(.delete)')
        var new_triples = _.flatten(_.zip(cT.map((i,el) => $(el).attr('data-subject')), cT.map((i,el) => $(el).attr('data-predicate')), cT.map((i,el) => $(el).attr('data-object')))
            .filter((t)=> t[0] && t[1] && t[2])
            .map((t) => {return {g:cite,s:t[0],p:t[1],o:t[2]}})
            .map((t) => app.ontology.expand(t,annotations)))
        _.assign(selector,{id:cite+"#sel-"+Utils.hash(JSON.stringify(selector)).slice(0, 4)})
        var selector_triples = OA.expand(selector.type)(_.mapValues(selector,(v) => v.replace(new RegExp('\n','ig'),'')))
        var create_triples = new_triples.length ? _.concat(new_triples,selector_triples) : []
        return _.flatten(create_triples)
    }

    static uri = ""
}

export default SocialNetwork