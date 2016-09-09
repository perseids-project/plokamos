import Utils from '../../utils'
import SPARQL from '../sparql'
import _ from 'lodash'


var namespaces = [
        {
            prefix: "snap:",
            uri: "http://data.snapdrgn.net/ontology/snap#"
        },
        {
            prefix:"perseusrdf:",
            uri:"http://data.perseus.org/"
        }
    ]

var expandMap = {
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

var simplifyMap = {
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

class SNAP {
    static labels(resource) {
        var map = {
            "http://data.snapdrgn.net/ontology/snap#AcknowledgedFamilyRelationship": "Has Acknowledged Family Relationship With",
            "http://data.snapdrgn.net/ontology/snap#AdoptedFamilyRelationship": "Has Adopted Family Relationship With",
            "http://data.snapdrgn.net/ontology/snap#AllianceWith": "Has Alliance With",
            "http://data.snapdrgn.net/ontology/snap#AncestorOf": "Is Ancestor Of",
            "http://data.snapdrgn.net/ontology/snap#AuntOf": "Is Aunt Of",
            "http://data.snapdrgn.net/ontology/snap#Bond": "Has Bond With",
            "http://data.snapdrgn.net/ontology/snap#BrotherOf": "Is Brother Of",
            "http://data.snapdrgn.net/ontology/snap#CasualIntimateRelationshipWith": "Has Casual Intimate Relationship With",
            "http://data.snapdrgn.net/ontology/snap#ChildOf": "Is Child Of",
            "http://data.snapdrgn.net/ontology/snap#ChildOfSiblingOf": "Is ChildOfSibling Of",
            "http://data.snapdrgn.net/ontology/snap#ClaimedFamilyRelationship": "Has Claimed Family Relationship With",
            "http://data.snapdrgn.net/ontology/snap#CousinOf": "Is Cousin Of",
            "http://data.snapdrgn.net/ontology/snap#DaughterOf": "Is Daughter Of",
            "http://data.snapdrgn.net/ontology/snap#DescendentOf": "Is Descendent Of",
            "http://data.snapdrgn.net/ontology/snap#EmnityFor": "Has Emnity For",
            "http://data.snapdrgn.net/ontology/snap#ExtendedFamilyOf": "Is Extended Family Of",
            "http://data.snapdrgn.net/ontology/snap#ExtendedHouseholdOf": "Is Extended Household Of",
            "http://data.snapdrgn.net/ontology/snap#FamilyOf": "Is Family Of",
            "http://data.snapdrgn.net/ontology/snap#FatherOf": "Is Father Of",
            "http://data.snapdrgn.net/ontology/snap#FosterFamilyRelationship": "Has Foster Family Relationship With",
            "http://data.snapdrgn.net/ontology/snap#FreedSlaveOf": "Is Freed Slave Of",
            "http://data.snapdrgn.net/ontology/snap#FreedmanOf": "Is Freedman Of",
            "http://data.snapdrgn.net/ontology/snap#FreedwomanOf": "Is Freedwoman Of",
            "http://data.snapdrgn.net/ontology/snap#FriendshipFor": "Has Friendship For",
            "http://data.snapdrgn.net/ontology/snap#GrandchildOf": "Is Grandchild Of",
            "http://data.snapdrgn.net/ontology/snap#GranddaughterOf": "Is Granddaughter Of",
            "http://data.snapdrgn.net/ontology/snap#GrandfatherOf": "Is Grandfather Of",
            "http://data.snapdrgn.net/ontology/snap#GrandmotherOf": "Is Grandmother Of",
            "http://data.snapdrgn.net/ontology/snap#GrandparentOf": "Is Grandparent Of",
            "http://data.snapdrgn.net/ontology/snap#GrandsonOf": "Is Grandson Of",
            "http://data.snapdrgn.net/ontology/snap#GreatGrandfatherOf": "Is GreatGrandfather Of",
            "http://data.snapdrgn.net/ontology/snap#GreatGrandmotherOf": "Is GreatGrandmother Of",
            "http://data.snapdrgn.net/ontology/snap#GreatGrandparentOf": "Is GreatGrandparent Of",
            "http://data.snapdrgn.net/ontology/snap#HalfFamilyRelationship": "HalfFamilyRelationship",
            "http://data.snapdrgn.net/ontology/snap#HereditaryFamilyOf": "Is HereditaryFamily Of",
            "http://data.snapdrgn.net/ontology/snap#HouseSlaveOf": "Is HouseSlave Of",
            "http://data.snapdrgn.net/ontology/snap#HouseholdOf": "Is Household Of",
            "http://data.snapdrgn.net/ontology/snap#InLawFamilyRelationship": "Has In-Law Family Relationship With",
            "http://data.snapdrgn.net/ontology/snap#IntimateRelationshipWith": "Has Intimate Relationship With",
            "http://data.snapdrgn.net/ontology/snap#KinOf": "Is Kin Of",
            "http://data.snapdrgn.net/ontology/snap#LegallyRecognisedRelationshipWith": "Has Legally Recognised Relationship With",
            "http://data.snapdrgn.net/ontology/snap#Link": "Has Link With",
            "http://data.snapdrgn.net/ontology/snap#MaternalFamilyRelationship": "Has Maternal Family Relationship With",
            "http://data.snapdrgn.net/ontology/snap#MotherOf": "Is Mother Of",
            "http://data.snapdrgn.net/ontology/snap#NephewOf": "Is Nephew Of",
            "http://data.snapdrgn.net/ontology/snap#NieceOf": "Is Niece Of",
            "http://data.snapdrgn.net/ontology/snap#ParentOf": "Is Parent Of",
            "http://data.snapdrgn.net/ontology/snap#PaternalFamilyRelationship": "Has Paternal Family Relationship With",
            "http://data.snapdrgn.net/ontology/snap#ProfessionalRelationship": "Has Professional Relationship With",
            "http://data.snapdrgn.net/ontology/snap#QualifierRelationship": "Has Qualifier Relationship With",
            "http://data.snapdrgn.net/ontology/snap#SeriousIntimateRelationshipWith": "Has Serious Intimate Relationship With",
            "http://data.snapdrgn.net/ontology/snap#SiblingOf": "Is Sibling Of",
            "http://data.snapdrgn.net/ontology/snap#SiblingOfParentOf": "Is SiblingOfParent Of",
            "http://data.snapdrgn.net/ontology/snap#SisterOf": "Is Sister Of",
            "http://data.snapdrgn.net/ontology/snap#SlaveOf": "Is Slave Of",
            "http://data.snapdrgn.net/ontology/snap#SonOf": "Is Son Of",
            "http://data.snapdrgn.net/ontology/snap#StepFamilyRelationship": "Has Step Family Relationship With",
            "http://data.snapdrgn.net/ontology/snap#UncleOf": "Is Uncle Of"
        }
        return map[resource]
    }


    // planned: move labels into var
    static expand(type) { return expandMap[type] || expandMap.default }
    static simplify(type) { return simplifyMap[type] || simplifyMap.default }

    static label (uri) {
        var term = _.reduce(namespaces, (str,ns) => str.replace(new RegExp("^"+ns.uri),"").replace(new RegExp("^"+ns.prefix)), uri)
        var labels ={
            "EnemyOf":"Is Enemy Of",
            "CompanionOf":"Is Companion Of",
            "WifeOf":"Is Wife Of",
            "HusbandOf":"Is Husband Of",
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
            "CousinOf":"Is Cousin Of",
            "DaughterOf":"Is Daughter Of",
            "DescendentOf":"Is Descendent Of",
            "EmnityFor":"Has Emnity For",
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
            "UncleOf":"Is Uncle Of"
        }

        var uri = uri.startsWith("http://data.perseus.org/people/") ? uri.replace("http://data.perseus.org/people/",'').replace('#this','') : uri

        return labels[term] || uri
    }
}

export default SNAP