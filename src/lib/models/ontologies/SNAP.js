
var namespaces = {
    snap: {
        prefix: "snap:",
        uri: "http://data.snapdrgn.net/ontology/snap#"
    },
    perseus:{
        prefix:"perseusrdf:",
        uri:"http://data.perseus.org/"
    }
}

var SNAP = {
    expand: function(obj) {},
    simplify: function(obj) {
        return _.mapValues(obj, function (v, k) {
            var bonds = v
            .filter((o) =>
                o.p.value === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
                &&   ( o.o.value.startsWith(namespaces.snap.prefix)
                    || o.o.value.startsWith(namespaces.snap.uri)
                    || o.o.value.startsWith(namespaces.perseus.prefix)
                    || o.o.value.startsWith(namespaces.perseus.uri)
                )
            ).map((o) => o.s.value)

            var expressions = bonds.map(function (bond) {
                var subject = _.find(v, (o) => o.p.value.endsWith("has-bond") && o.o.value === bond).s.value
                var predicate = _.find(v, (o) => o.p.value === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" && o.s.value === bond).o.value
                var object = _.find(v, (o) => o.p.value.endsWith("bond-with") && o.s.value === bond).o.value

                return {s: subject, p:predicate, o:object}
            })
            return expressions
        })
    },
    label: function(uri) {
        var term = uri.replace(namespaces.snap.uri,'').replace(namespaces.snap.prefix,'').replace(namespaces.perseus.uri,'').replace(namespaces.perseus.prefix,'')
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
        return labels[term] || uri
    },
    namespaces:namespaces
}

export default SNAP