import Utils from '../../utils'
import SPARQL from '../sparql'
import _ from 'lodash'

const namespaces = Symbol()
const expandMap = Symbol()
const simplifyMap = Symbol()
const name = Symbol()

class SNAP {

    constructor() {
        this[name] = "SNAP"
    }

    name() {
        return this[name]
    }

    load(endpoint) {
        this[namespaces] = [{prefix: "snap:", uri: "http://data.snapdrgn.net/ontology/snap#"}, {prefix:"perseusrdf:", uri:"http://data.perseus.org/"}]
        this[simplifyMap] = {
            "default": (obj) => {
                return _.mapValues(obj, function (v, k) {
                    var bonds = v
                        .filter((o) => o.p.value === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" && _.reduce(namespaces,(acc,ns) => acc || o.o.value.startsWith(ns.prefix) || o.o.value.startsWith(ns.uri), false))
                        .map((o) => o.s.value)

                    var expressions = bonds.map(function (bond) {
                        var subject = _.find(v, (o) => o.p.value.endsWith("has-bond") && o.o.value === bond).s.value
                        var predicate = _.find(v, (o) => o.p.value === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" && o.s.value === bond).o.value
                        var object = _.find(v, (o) => o.p.value.endsWith("bond-with") && o.s.value === bond).o.value

                        return {s: subject, p: predicate, o: object}
                    })
                    return expressions
                })
            }
        }
        this[expandMap] = {
            "default": (gspo, graphs) => {

                var annotation = (graphs||{})[gspo.g]

                var bindings = annotation ? annotation.filter((quad) =>
                    (quad.p.value.endsWith('has-bond') && quad.s.value === gspo.s)
                    || (quad.p.value.endsWith('type') && quad.o.value === gspo.p)
                    || (quad.p.value.endsWith('bond-with') && quad.o.value === gspo.o)
                ) : []

                var bond_id = (bindings.length%3 || !annotation)? gspo.g + "-bond-" + Utils.hash(JSON.stringify(gspo)).slice(0, 4) : undefined // planned: get bonds and check bond sizes individually

                return bond_id ? [
                    {g: gspo.g, s: bond_id, p: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", o: gspo.p},
                    {g: gspo.g, s: gspo.s, p: "http://data.snapdrgn.net/ontology/snap#has-bond", o: bond_id},
                    {g: gspo.g, s: bond_id, p: "http://data.snapdrgn.net/ontology/snap#bond-with", o: gspo.o},
                ].map((gspo) => SPARQL.gspoToBinding(gspo)) : bindings
            }
        }
    }

    test(data) {

    }

    simplify() {
        return this[simplifyMap][type] || this[simplifyMap].default
    }

    expand() {
        return this[expandMap][type] || this[expandMap].default
    }

    label(uri) {
        var term = _.reduce(this[namespaces], (str,ns) => str.replace(new RegExp("^"+ns.uri),"").replace(new RegExp("^"+ns.prefix),""), uri)
        var labels ={
            "AcknowledgedFamilyRelationship":"Has Acknowledged Family Relationship With",
            "AdoptedFamilyRelationship":"Has Adopted Family Relationship With",
            "AllianceWith":"Has Alliance With",
            "AncestorOf":"Is Ancestor Of",
            "AuntOf":"Is Aunt Of",
            "Bond":"Has Bond With",
            "BrotherOf":"Is Brother Of",
            "CasualIntimateRelationshipWith":"Has Casual Intimate Relationship With",
            "ChildOf":"Is Child Of",
            "ChildOfSiblingOf":"Is ChildOfSibling Of",
            "ClaimedFamilyRelationship":"Has Claimed Family Relationship With",
            "CompanionOf":"Is Companion Of",
            "CousinOf":"Is Cousin Of",
            "DaughterOf":"Is Daughter Of",
            "DescendentOf":"Is Descendent Of",
            "EmnityFor":"Has Emnity For",
            "EnemyOf":"Is Enemy Of",
            "ExtendedFamilyOf":"Is Extended Family Of",
            "ExtendedHouseholdOf":"Is Extended Household Of",
            "FamilyOf":"Is Family Of",
            "FatherOf":"Is Father Of",
            "FosterFamilyRelationship":"Has Foster Family Relationship With",
            "FreedSlaveOf":"Is Freed Slave Of",
            "FreedmanOf":"Is Freedman Of",
            "FreedwomanOf":"Is Freedwoman Of",
            "FriendshipFor":"Has Friendship For",
            "GrandchildOf":"Is Grandchild Of",
            "GranddaughterOf":"Is Granddaughter Of",
            "GrandfatherOf":"Is Grandfather Of",
            "GrandmotherOf":"Is Grandmother Of",
            "GrandparentOf":"Is Grandparent Of",
            "GrandsonOf":"Is Grandson Of",
            "GreatGrandfatherOf":"Is GreatGrandfather Of",
            "GreatGrandmotherOf":"Is GreatGrandmother Of",
            "GreatGrandparentOf":"Is GreatGrandparent Of",
            "HalfFamilyRelationship":"HalfFamilyRelationship",
            "HereditaryFamilyOf":"Is HereditaryFamily Of",
            "HouseSlaveOf":"Is HouseSlave Of",
            "HouseholdOf":"Is Household Of",
            "HusbandOf":"Is Husband Of",
            "InLawFamilyRelationship":"Has In-Law Family Relationship With",
            "IntimateRelationshipWith":"Has Intimate Relationship With",
            "KinOf":"Is Kin Of",
            "LegallyRecognisedRelationshipWith":"Has Legally Recognised Relationship With",
            "Link":"Has Link With",
            "MaternalFamilyRelationship":"Has Maternal Family Relationship With",
            "MotherOf":"Is Mother Of",
            "NephewOf":"Is Nephew Of",
            "NieceOf":"Is Niece Of",
            "ParentOf":"Is Parent Of",
            "PaternalFamilyRelationship":"Has Paternal Family Relationship With",
            "ProfessionalRelationship":"Has Professional Relationship With",
            "QualifierRelationship":"Has Qualifier Relationship With",
            "SeriousIntimateRelationshipWith":"Has Serious Intimate Relationship With",
            "SiblingOf":"Is Sibling Of",
            "SiblingOfParentOf":"Is SiblingOfParent Of",
            "SisterOf":"Is Sister Of",
            "SlaveOf":"Is Slave Of",
            "SonOf":"Is Son Of",
            "StepFamilyRelationship":"Has Step Family Relationship With",
            "UncleOf":"Is Uncle Of",
            "WifeOf":"Is Wife Of"
        }

        // todo: move to smith
        var uri = uri.startsWith("http://data.perseus.org/people/") ? uri.replace("http://data.perseus.org/people/",'').replace('#this','') : uri

        return labels[term] || uri
    }
}

export default SNAP