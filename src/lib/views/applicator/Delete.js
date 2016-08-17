import Templates from '../annotator/Templates'
import SNAP from '../../models/ontologies/SNAP'
import _ from 'lodash'

class Delete {

    constructor(jqParent) {
        var labels ={
            "http://data.snapdrgn.net/ontology/snap#AcknowledgedFamilyRelationship":"Has Acknowledged Family Relationship With",
            "http://data.snapdrgn.net/ontology/snap#AdoptedFamilyRelationship":"Has Adopted Family Relationship With",
            "http://data.snapdrgn.net/ontology/snap#AllianceWith":"Has Alliance With",
            "http://data.snapdrgn.net/ontology/snap#AncestorOf":"Is Ancestor Of",
            "http://data.snapdrgn.net/ontology/snap#AuntOf":"Is Aunt Of",
            "http://data.snapdrgn.net/ontology/snap#Bond":"Has Bond With",
            "http://data.snapdrgn.net/ontology/snap#BrotherOf":"Is Brother Of",
            "http://data.snapdrgn.net/ontology/snap#CasualIntimateRelationshipWith":"Has Casual Intimate Relationship With",
            "http://data.snapdrgn.net/ontology/snap#ChildOf":"Is Child Of",
            "http://data.snapdrgn.net/ontology/snap#ChildOfSiblingOf":"Is ChildOfSibling Of",
            "http://data.snapdrgn.net/ontology/snap#ClaimedFamilyRelationship":"Has Claimed Family Relationship With",
            "http://data.snapdrgn.net/ontology/snap#CousinOf":"Is Cousin Of",
            "http://data.snapdrgn.net/ontology/snap#DaughterOf":"Is Daughter Of",
            "http://data.snapdrgn.net/ontology/snap#DescendentOf":"Is Descendent Of",
            "http://data.snapdrgn.net/ontology/snap#EmnityFor":"Has Emnity For",
            "http://data.snapdrgn.net/ontology/snap#ExtendedFamilyOf":"Is Extended Family Of",
            "http://data.snapdrgn.net/ontology/snap#ExtendedHouseholdOf":"Is Extended Household Of",
            "http://data.snapdrgn.net/ontology/snap#FamilyOf":"Is Family Of",
            "http://data.snapdrgn.net/ontology/snap#FatherOf":"Is Father Of",
            "http://data.snapdrgn.net/ontology/snap#FosterFamilyRelationship":"Has Foster Family Relationship With",
            "http://data.snapdrgn.net/ontology/snap#FreedSlaveOf":"Is Freed Slave Of",
            "http://data.snapdrgn.net/ontology/snap#FreedmanOf":"Is Freedman Of",
            "http://data.snapdrgn.net/ontology/snap#FreedwomanOf":"Is Freedwoman Of",
            "http://data.snapdrgn.net/ontology/snap#FriendshipFor":"Has Friendship For",
            "http://data.snapdrgn.net/ontology/snap#GrandchildOf":"Is Grandchild Of",
            "http://data.snapdrgn.net/ontology/snap#GranddaughterOf":"Is Granddaughter Of",
            "http://data.snapdrgn.net/ontology/snap#GrandfatherOf":"Is Grandfather Of",
            "http://data.snapdrgn.net/ontology/snap#GrandmotherOf":"Is Grandmother Of",
            "http://data.snapdrgn.net/ontology/snap#GrandparentOf":"Is Grandparent Of",
            "http://data.snapdrgn.net/ontology/snap#GrandsonOf":"Is Grandson Of",
            "http://data.snapdrgn.net/ontology/snap#GreatGrandfatherOf":"Is GreatGrandfather Of",
            "http://data.snapdrgn.net/ontology/snap#GreatGrandmotherOf":"Is GreatGrandmother Of",
            "http://data.snapdrgn.net/ontology/snap#GreatGrandparentOf":"Is GreatGrandparent Of",
            "http://data.snapdrgn.net/ontology/snap#HalfFamilyRelationship":"HalfFamilyRelationship",
            "http://data.snapdrgn.net/ontology/snap#HereditaryFamilyOf":"Is HereditaryFamily Of",
            "http://data.snapdrgn.net/ontology/snap#HouseSlaveOf":"Is HouseSlave Of",
            "http://data.snapdrgn.net/ontology/snap#HouseholdOf":"Is Household Of",
            "http://data.snapdrgn.net/ontology/snap#InLawFamilyRelationship":"Has In-Law Family Relationship With",
            "http://data.snapdrgn.net/ontology/snap#IntimateRelationshipWith":"Has Intimate Relationship With",
            "http://data.snapdrgn.net/ontology/snap#KinOf":"Is Kin Of",
            "http://data.snapdrgn.net/ontology/snap#LegallyRecognisedRelationshipWith":"Has Legally Recognised Relationship With",
            "http://data.snapdrgn.net/ontology/snap#Link":"Has Link With",
            "http://data.snapdrgn.net/ontology/snap#MaternalFamilyRelationship":"Has Maternal Family Relationship With",
            "http://data.snapdrgn.net/ontology/snap#MotherOf":"Is Mother Of",
            "http://data.snapdrgn.net/ontology/snap#NephewOf":"Is Nephew Of",
            "http://data.snapdrgn.net/ontology/snap#NieceOf":"Is Niece Of",
            "http://data.snapdrgn.net/ontology/snap#ParentOf":"Is Parent Of",
            "http://data.snapdrgn.net/ontology/snap#PaternalFamilyRelationship":"Has Paternal Family Relationship With",
            "http://data.snapdrgn.net/ontology/snap#ProfessionalRelationship":"Has Professional Relationship With",
            "http://data.snapdrgn.net/ontology/snap#QualifierRelationship":"Has Qualifier Relationship With",
            "http://data.snapdrgn.net/ontology/snap#SeriousIntimateRelationshipWith":"Has Serious Intimate Relationship With",
            "http://data.snapdrgn.net/ontology/snap#SiblingOf":"Is Sibling Of",
            "http://data.snapdrgn.net/ontology/snap#SiblingOfParentOf":"Is SiblingOfParent Of",
            "http://data.snapdrgn.net/ontology/snap#SisterOf":"Is Sister Of",
            "http://data.snapdrgn.net/ontology/snap#SlaveOf":"Is Slave Of",
            "http://data.snapdrgn.net/ontology/snap#SonOf":"Is Son Of",
            "http://data.snapdrgn.net/ontology/snap#StepFamilyRelationship":"Has Step Family Relationship With",
            "http://data.snapdrgn.net/ontology/snap#UncleOf":"Is Uncle Of"
        }
        var template = new Templates(labels)
        // done: add button (hidden)
        var button = $('<div class="btn btn-circle btn-info" id="edit_btn" style="display:none;" data-toggle="modal" data-target="#edit_modal"><span class="glyphicon glyphicon-paperclip"></span></div>')
        jqParent.append(button)
        // done: add deletion interface
        var modal = $('<div id="edit_modal" class="modal fade in" style="display: none; "><div class="well"><div class="modal-header"><a class="close" data-dismiss="modal">×</a><h3>This is a Modal Heading</h3></div><div class="modal-body"></div><div class="modal-footer"><button type="button" class="btn btn-success" data-dismiss="modal">Create</button><button type="submit" class="btn btn-danger" data-dismiss="modal">Cancel</button></div></div>')
        jqParent.append(modal)
        var body = modal.find('.modal-body')
        var delete_button = modal.find('.btn-success')
        button.click((e) => {
            // done: show modal (automatically w/ data-toggle)
            // todo: hide button if clicked elsewhere
            button.css('display','none')
        })

        delete_button.click((e) => {

            // done: update to new modal-body
            // done: hide groups instead of removing them
            // done: look for hidden graph elements, then hidden single triples
            // note: GRAPHS = $('.modal-body').find('.group').filter(function(){return this.style.display==='none'})
            // note: TRIPLES = $('.modal-body').find('.group').filter(function(){return this.style.display==='none'})

            var dG = body.find('.graph.old.delete')
            // done: extract data (just g, really)
            var delete_graphs = dG.data('graph')
            dG.remove()

            var dT = body.find('.graph.old .triple.delete')
            // todo: extract data (gspo), expand to SNAP triples, delete
            var delete_triples = _.zip(dT.closest('.graph.old').data('graph'), dT.data('original-subject'), dT.data('original-predicate'), dT.data('original-object'))
            dT.remove()

            var uT = body.find('.graph.old .triple.update')
            var update_triples = _.zip(
                uT.closest('.graph.old').data('graph'),
                uT.data('original-subject'), uT.data('subject'),
                uT.data('original-predicate'),
                uT.data('predicate'),
                uT.data('original-object'),
                uT.data('object')
            ).map(
                (t) => {
                    return {
                        previous:{
                            g:t[0],
                            s:t[1],
                            p:t[2],
                            o:t[3]
                        },
                        update:{
                            g:t[0],
                            s:t[4],
                            p:t[5],
                            o:[6]
                        }
                    }
                }
            )
            // todo: extract data (gspo), expand to SNAP triples, update

            var cT = body.find('.graph.new .triple:not(.delete)')
            var create_triples = _.zip(cT.data('subject'), cT.data('predicate'), cT.data('object')).filter((t)=> t[0]!=NIL && t[1]!=NIL && t[2]!=NIL)
            // done: filter for NIL or empty strings

            // todo: create sparql
            var sparqlAll = deleteAll.map(/* todo: delete whole annotation */)
            var sparqlSome = deleteSome.map(/* todo: delete just the triples and change annotation */)
            // todo: (visual feedback) spinner
            // todo: run model.execute
            // todo: (visueal feedback) then ticked checkbox
            // note: var results = this.model.execute(_.concat(sparqlAll,sparqlSome))
            // note: results.then((data) => if (data is w/o error) success else failure and report)
            console.log(e)
        })

        modal.update = (graphs) => {
            // done: populate with graphs/triples
            template.init(body,{annotations:Object.keys(graphs).map((k) => { return {g:k,triples:graphs[k]}})})
            // interface.button.click -> get selections and create sparql to delete them
        }

        this.register = (jqElement) => {
            jqElement.click((e) => {
                // todo: make button disappear again
                // todo: merge with selection tool
                var menuState = document.documentElement.clientWidth - parseInt($("#menu-container").css('width'))
                var deltaH = menuState ? window.scrollY+15 : window.scrollY+15;
                var deltaW = menuState ? window.scrollX : window.scrollX;
                // note: show button
                button.css({display:"block",position:"absolute",left:e.clientX-deltaW,top:e.clientY+deltaH});
                // note: prep interface
                modal.update(SNAP.simplify(_.pickBy(jqElement.data(),(v,k)=>k.startsWith('http://'))))
            })
        }

    }
}

export default Delete

// todo: rename to editor, delete current editor