import Templates from '../annotator/Templates'
import SNAP from '../../models/ontologies/SNAP'
import _ from 'lodash'

class Editor {

    constructor(app) {
        var jqParent = app.anchor
        annotator = app.annotator
        var origin = {}
        var selector = {}
        var labels = SNAP.labels
        var template = new Templates(labels)
        var button = $('<div class="btn btn-circle btn-info" id="edit_btn" style="display:none;" data-toggle="modal" data-target="#edit_modal"><span class="glyphicon glyphicon-paperclip"></span></div>')
        jqParent.append(button)
        var modal = $('<div id="edit_modal" class="modal fade in" style="display: none; "><div class="well"><div class="modal-header"><a class="close" data-dismiss="modal">×</a><h3>This is a Modal Heading</h3></div><div class="modal-body"></div><div class="modal-footer"><button type="button" class="btn btn-success" data-dismiss="modal">Create</button><button type="submit" class="btn btn-danger" data-dismiss="modal">Cancel</button></div></div>')
        jqParent.append(modal)
        var body = modal.find('.modal-body')
        var apply_button = modal.find('.btn-success')
        button.click((e) => {
            // done: show modal (automatically w/ data-toggle)
            // todo: hide button if clicked elsewhere
            button.css('display','none')
        })

        /**
         * We are done editing and are now processing, in order:
         * 1. Pre-existing annotation bodies that have been completely deleted
         * 2. Partially deleted annotation bodies
         * 3. Modified annotation bodies
         * 4. Newly created annotation body
         */
        // todo: make button disabled by default, check if it needs to be enabled
        // note: user = $('body').data('user')
        // note: address = $('body').data('urn') || document.url
        // note: selector = modal.selector
        // note: data =
        // note: delete_graphs contains a list of annotation ids to delete [String]
        apply_button.click((e) => {

            var annotations = origin.data('annotations')
            var dG = body.find('.graph.old.delete')
            var delete_graphs = dG.data('graph')
            dG.remove()

            var dT = body.find('.graph.old .triple.delete')
            var delete_triples = _.flatten(
                _.zip(dT.closest('.graph.old').data('graph'), dT.data('original-subject'), dT.data('original-predicate'), dT.data('original-object'))
                .map((zipped) => {return {g:zipped[0],s:zipped[1],p:zipped[2],o:zipped[3]}})
                .map((gspo) => SNAP.expand()(gspo, annotations))
            )
            dT.remove()

            var uT = body.find('.graph.old .triple.update')
            var update_triples = _.zip(uT.closest('.graph.old').data('graph'), uT.data('original-subject'), uT.data('subject'), uT.data('original-predicate'), uT.data('predicate'), uT.data('original-object'), uT.data('object'))

            var cT = body.find('.graph.new .triple:not(.delete)')
            var cite = annotator.acquire.cite(app.getUser()+app.getUrn(),Math.random().toString())
            var create_triples = _.zip(cT.data('subject'), cT.data('predicate'), cT.data('object'))
                .filter((t)=> t[0]!=NIL && t[1]!=NIL && t[2]!=NIL)
                .map((t) => {return {g:cite,s:t[0],p:t[1],o:t[2]}})
                .map(SNAP.expand)// SNAP expand
            // TODO: acquire.cite(app.getUser()+app.getUrn(),uuid

            _.assign(selector,{id:cite+"-sel-"+Utils.hash(JSON.stringify(selector)).slice(0, 4)})
            var selector_triples = OA.expand(selector.type)(selector)

            body.html('<span class="spinner"/>')

            annotator.drop({triples: delete_graphs.map((id) => annotations[id]),ids: delete_graphs})
            annotator.delete({deletions: delete_triples})
            annotator.update({deletions: update_triples.map((t) => { return { g:t[0], s:t[1], p:t[2], o:t[3] }}),
                              insertions: update_triples.map((t) => { return { g:t[0], s:t[4], p:t[5], o:t[6] }})
            })
            annotator.create({create: [], selector: []})
            annotator.apply() // todo: this can be improved; have multiple calls and a single step in history

            body.html('<span class="okay"/>')
            body.html('<span class="failure"/>')
        })

        modal.update = (data, newSelector) => {
            // done: populate with graphs/triples
            // todo: apply ontology-specific transformations
            var graphs = SNAP.simplify()(data)
            selector = newSelector
            template.init(body,{annotations:Object.keys(graphs).map((k) => { return {g:k,triples:graphs[k]}})})
            // interface.button.click -> get selections and create sparql to delete them
        }

        this.register = (jqElement) => {
            jqElement.click((e) => {
                origin = jqElement
                // todo: make button disappear again
                // todo: merge with selection tool (via a container for plugin buttons)
                var menuState = document.documentElement.clientWidth - parseInt($("#menu-container").css('width'))
                var deltaH = menuState ? window.scrollY : window.scrollY-parseInt($("#menu-container").css('height'));
                var deltaW = menuState ? window.scrollX+parseInt($("#menu-container").css('width')) : window.scrollX;
                button.css({display:"block",position:"absolute",left:e.clientX-deltaW,top:e.clientY+deltaH});
                modal.update(jqElement.data('annotations'),jqElement.data('selector'))
            })
        }

    }
}

export default Editor