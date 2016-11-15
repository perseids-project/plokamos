import $ from 'jquery';
import SPARQL from '../models/sparql'
import Utils from '../utils'
import wrapRangeText from 'wrap-range-text'
import OA from '../models/ontologies/OA'

// planned: think about api - stacking commands, then executing them, in order to facilitate single step history?

const defaultGraph = "http://data.perseus.org/graphs/persons"
const userId = Symbol()
const urn = Symbol()
const anchor = Symbol()
const model = Symbol()
const applicator = Symbol()
const history = Symbol()

/**
 * Class for creation of annotations
 *
 */
class Annotator {

    // API: create(fragment), update(fragments), delete(fragment), drop(graph)

    constructor(app) {
        this[userId] = app.anchor.data('user')
        this[urn] = app.anchor.data('urn')
        this[anchor] = app.anchor
        this[model] = app.model;
        this[applicator] = app.applicator;
        this[history] = app.history;

        // todo: this is part of the base module
        this.modal = $('<div id="edit_modal" class="modal fade in" style="display: none; "><div class="well"><div class="modal-header"><a class="close" data-dismiss="modal">×</a><h3>Annotation Editor</h3></div><div class="modal-body"></div><div class="modal-footer"><button id="btn-apply" type="button" class="btn btn-primary" data-dismiss="modal" disabled title="Apply changes">Apply</button></div></div>')
        app.anchor.append(this.modal)

        app.anchor.mouseup((e) => {

            // Don't use selection inside #global-view
            if ($(e.target).closest('#global-view').length) return

            // If selection exists, remove it
            var pos = $('#popover-selection')
            if (pos) {
                pos.popover('destroy')
                pos.replaceWith(pos.text())
            }

            var selection = document.getSelection();

            // replace starter with
            if (selection && !selection.isCollapsed && this.modal.css('display')==='none') {
                // add selector to modal or button

                var selector = OA.create("http://www.w3.org/ns/oa#TextQuoteSelector")(app.anchor,selection);

                // modal.update({},selector)
                var span = document.createElement('span')
                span.setAttribute('id','popover-selection')
                span.setAttribute('data-annotations','{}')
                span.setAttribute('data-selector',JSON.stringify(selector))
                wrapRangeText(span,selection.getRangeAt(0))
                span = $('#popover-selection')
                span.popover({
                    container:"body",
                    html:"true",
                    trigger: "manual",
                    placement: "auto top",
                    title: selector.exact,
                    content: "<div class='popover-footer'/>"
                })
                span.popover('show')
            }

        })

    }

    /**
     * DROP: delete entire annotations including metadata
     * Takes the ids in list.drop and
     * @param graphs Object where graphs.triples (Array[Object]) is a list of GSPOs to delete and graphs.ids (Array[String]) is the list of annotation ids to be cleared
     */
    drop(graphs) {
        this[model].defaultDataset = this[model].defaultDataset.filter((ds) => !graphs.indexOf(ds)+1)
        this[model].namedDataset = this[model].namedDataset.filter((ds) => !graphs.indexOf(ds)+1)
        return this[model].execute(graphs.map((uri) => `DROP GRAPH <${uri}>`))
    }

    /**
     *
     * @param deletions () is the list
     */
    delete (deletions) {
        return _.flatten(deletions || []).length ? this[model].execute(SPARQL.bindingsToDelete(_.flatten(deletions).map((gspo) => gspo.g.value ? gspo : SPARQL.gspoToBinding(gspo)))) : []
    }

    /**
     *
     * @param deletions
     * @param insertions
     */
    update(deletions, insertions, graph) {
        // todo: remove old title, add new title
        return this[model].execute(_.flatten([
            SPARQL.bindingsToDelete(_.flatten(deletions).map((gspo) => gspo.g.value ? gspo : SPARQL.gspoToBinding(gspo))),
            SPARQL.bindingsToInsert(_.flatten(insertions.concat(
                // filter for graphs, map to graphid, get uniq
                _.uniq(_.flatten(insertions).map((i) => i.g.value || i.g)).map((annotationId) => _.concat(OA.makeAnnotatedAt(annotationId, graph || defaultGraph), OA.makeAnnotatedBy(annotationId, graph || defaultGraph, this[userId])))
            )).map((gspo) => gspo.g.value ? gspo : SPARQL.gspoToBinding(gspo)))
        ]))
    }


    /**
     *
     * @param list
     */
    create (annotationId, bindings, graph) {
        var result = $.Deferred().resolve([]).promise()
        if (bindings.length) {

            var selectorId = _.find(bindings, (binding) => binding.p.value === "http://www.w3.org/ns/oa#exact").s.value
            var targetId = annotationId + "#target-" + Utils.hash(JSON.stringify(selectorId)).slice(0, 4)

            // planned: make independent of selector type
            var oa = OA.makeCore(annotationId, graph || defaultGraph)
            var target = OA.makeTarget(annotationId, graph || defaultGraph, targetId, selectorId, this[urn])
            var date = OA.makeAnnotatedAt(annotationId, graph || defaultGraph)
            var user = OA.makeAnnotatedBy(annotationId, graph || defaultGraph, this[userId])

            this[model].defaultDataset.push(annotationId)
            this[model].namedDataset.push(annotationId)
            if (!(this[model].defaultDataset.indexOf(graph || defaultGraph)+1)) {
                this[model].defaultDataset.push(graph || defaultGraph)
                this[model].namedDataset.push(graph || defaultGraph)
            }
            var insert = SPARQL.bindingsToInsert(_.flatten([oa, date, user, target, bindings]).map((gspo) => gspo.g.value ? gspo : SPARQL.gspoToBinding(gspo)))
            result = this[model].execute(insert)
        }
        return result
    }

    apply (resolved) {
        // check if all successful (what about drop?)
        // if success, map to sparql and add sparql to history
        // else reset model
        this[history].add(resolved.map((r) => r.sparql))
        // this.history.commit()
        this[applicator].reset()
    }
}

export default Annotator