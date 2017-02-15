import d3 from'd3'
import $ from 'jquery'
import _ from 'lodash'

var self;
var edgeLength = 120;
var edgeRandom = 80;
var node, link, nodeLabel, linkLabel;

class CorpusDiagram {
    constructor(app) {
        self = this
        self.anchor = $(`<div id="global-view" class="well" style="position:fixed; z-index:1000;"/>`)
        $('body').append(self.anchor)
        /* var globalViewBtn = $(`
          <button id="global-view-btn" class="btn">
            <span class="glyphicon glyphicon-certificate"/>
          </button>
        `)
        app.ui.plugins.append(globalViewBtn)*/
        var globalViewBtn = $('.plokamos-button')
        self.anchor.css('display','none');
        globalViewBtn.mouseleave(function(e) {
            if (!globalViewBtn.keep) {
                $('#global-view').css('display','none'); //self.force.stop()
            }
        });
        globalViewBtn.mouseenter(function(e) {
            //if (!globalViewBtn.keep) {self.force.start()}
            $('#global-view').css('display','block')
        });
        globalViewBtn.keep = false;
        globalViewBtn.click(function(e) {
            globalViewBtn.keep = !globalViewBtn.keep
            $('#global-view').css('display','block')})
            if (globalViewBtn.keep) {
                globalViewBtn.addClass('keep')
                $(".plokamos-button img").attr("src","/plokamos/assets/img/plokamos-clicked.svg")
            }
            else {
                globalViewBtn.removeClass('keep')
                $(".plokamos-button img").attr("src","/plokamos/assets/img/plokamos.svg")
            }

    init = (anchor) => {
        anchor.html(`
        <div id="plokamos-vis-main" class="col-xs-12">
            <div id="plokamos-vis-list">
            <ul class="nav nav-tabs">
            <li class="active"><a data-toggle="tab" href="#Plokamos-vis">Visualization</a></li>
            <li><a data-toggle="tab" href="#Social">Social Network</a></li>
        <li><a data-toggle="tab" href="#Characterizations">Characterizations</a></li>
            <!--div id="filterContainer" style="float:right">
            <select id="linkFilters" multiple="multiple"></select>
            </div-->
            </ul>
            <div class="tab-content">
                <div id="Plokamos-vis" class="tab-pane fade in active"></div>
                <div id="Social" class="tab-pane fade"></div>
                <div id="Characterizations" class="tab-pane fade"></div>
            </div>
            </div>
            </div>`
        )
    }


    activateForceLayout = (nodes, links) => {
        $('#Plokamos-vis').html('')
        var svg = d3.select("#Plokamos-vis")
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .call(d3.zoom().on("zoom", function () {
                svg.attr("transform", d3.event.transform)
            }))
            .append("g");
        var width = +svg.attr("width"), height = +svg.attr("height");

        //.scaleExtent([1, 40])
        //.translateExtent([[-100, -100], [width + 90, height + 100]])

        svg.append('svg:defs').append('svg:marker')
            .attr('id', 'arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 6)
            .attr('markerWidth', 10)
            .attr('markerHeight', 10)
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#000');

        var color = d3.scaleOrdinal(_.filter(d3.schemeCategory20c,(x,i) => i%4));

        var simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(function(d) { return d.id; }).distance((d) => d.group ? edgeLength+edgeRandom*Math.random() : (d.eng||d.grc).length*7))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 2, height / 2));

        link = svg.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("stroke", '#aaa')
            .attr("stroke-width", (d) => d.group ? 1 : 0)
            .attr('marker-end',(d) => d.group ? 'url(#arrow)' : '')
        ;//function(d) { return Math.sqrt(d.value); });

        node = svg.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(nodes.filter((x) => x.type==="person"))
            .enter().append("circle")
            .attr("r", 30)
            .attr("fill", function(d) { return color(d.name); })
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        nodeLabel = d3.select('g.nodes').selectAll('text.node')
            .data(nodes)
            .enter().append('text')
            .attr("class","node")
            .attr("y", function(d) { return d.y; })
            .attr("x", function(d) { return d.x; })
            .attr("text-anchor", "middle")
            .style("fill","#444")
            .style("font-size","10px")
            .text(function(d) {return d.name;})
            .on("mouseover",() => d3.select(d3.event.target).transition().style("font-size","24px"))
            .on("mouseout",() => d3.select(d3.event.target).transition().style("font-size","10px"))
            .on("click",(d) => window.open(d.uri));


        linkLabel = svg.selectAll('text.link')
            .data(links)
            .enter().append('text')
            .attr("class","link")
            .attr("y", function(d) { return (d.source.y + d.target.y) / 2; })
            .attr("x", function(d) { return (d.source.x + d.target.x) / 2; })
            .attr("text-anchor", "middle")
            .style("fill",(d) => d.group ? "#337ab7" : "#d44950")
            .style("font-size","8px")
            .text((d) => !d.group ? d.eng : d.type.replace("http://data.snapdrgn.net/ontology/snap#","").replace("http://data.perseus.org/rdfvocab/addons/",""))
            .on("mouseover",() => d3.select(d3.event.target).transition().style("font-size","24px"))
            .on("mouseout",() => d3.select(d3.event.target).transition().style("font-size","8px"))
            .on("click",(d) => d3.event.altKey ? window.open(d.grcuri) : window.open(d.enguri));


        function dragstarted(d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function dragended(d) {
            if (!d3.event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        node.append("title")
            .text(function(d) { return d.uri; });

        simulation
            .nodes(nodes)
            .on("tick", () => {
                link
                    .attr("x1", function(d) { return d.source.x; })
                    .attr("y1", function(d) { return d.source.y; })
                    .attr("x2", function(d) {
                        var t_radius = 35; // nodeWidth is just a custom attribute I calculate during the creation of the nodes depending on the node width
                        var dx = d.target.x - d.source.x;
                        var dy = d.target.y - d.source.y;
                        var gamma = Math.atan2(dy,dx); // Math.atan2 returns the angle in the correct quadrant as opposed to Math.atan
                        return d.target.x - (Math.cos(gamma) * t_radius);
                    })
                    .attr("y2", function(d) {
                        var t_radius = 35; // nodeWidth is just a custom attribute I calculate during the creation of the nodes depending on the node width
                        var dx = d.target.x - d.source.x;
                        var dy = d.target.y - d.source.y;
                        var gamma = Math.atan2(dy,dx); // Math.atan2 returns the angle in the correct quadrant as opposed to Math.atan
                        return d.target.y - (Math.sin(gamma) * t_radius);
                    })

                node
                    .attr("cx", function(d) {return d.x;})
                    .attr("cy", function(d) { return d.y; });

                nodeLabel
                    .attr("x", function(d) { return d.x; })
                    .attr("y", function(d) { return d.y; });

                linkLabel
                    .attr("y", function(d) { return (d.source.y + d.target.y) / 2; })
                    .attr("x", function(d) { return (d.source.x + d.target.x) / 2; })
                    .attr("transform", function(d) {return `rotate( ${Math.atan((d.source.y - d.target.y)/(d.source.x - d.target.x))/Math.PI*180} ${(d.source.x + d.target.x) / 2} ${(d.source.y + d.target.y) / 2})`});
            });

        simulation.force("link")
            .links(links);
    }

    load = (model) => {

        let buildChars = (triples) => {
            var id = triples[0].g
            var name = triples.filter((o) => o.p==="http://data.perseids.org/characterization#hasCharacter")[0].o
            var english = triples.filter((o) => o.p==="http://data.perseids.org/characterization#hasEnglish")[0].o
            var greek = triples.filter((o) => o.p==="http://data.perseids.org/characterization#hasGreek")[0].o
            return {id: id, name:name, eng:english, grc: greek}
        }
        let buildSoc = (xs) => {
            var source = xs.filter((x) => x.p.endsWith("has-bond"))[0].s
            var edge = xs.filter((x) => x.p.endsWith("type"))[0].o
            var target = xs.filter((x) => x.p.endsWith("bond-with"))[0].o
            return {source:source, type:edge, target:target}
        }

       /* let query = `
        PREFIX oa: <http://www.w3.org/ns/oa#>
        SELECT DISTINCT ?s ?p ?o ?g
        WHERE {
        # retrieve relevant direct and indirect properties
            {
                ?annotation oa:hasTarget ?s .
                GRAPH ?g {?s ?p ?o}
            }
            UNION
            {
                ?annotation oa:serializedBy ?s .
                GRAPH ?g {?s ?p ?o}
            }
            UNION
            {
                ?annotation oa:hasTarget/oa:hasSelector ?s .
                GRAPH ?g {?s ?p ?o}
            }
            UNION
            {
                ?annotation oa:hasBody ?g .
                GRAPH ?g {?s ?p ?o}
            }
            UNION
            {
                BIND(?annotation AS ?s)
                GRAPH ?g {?s ?p ?o}
            }
        # select annotations
            SELECT ?annotation
            WHERE {
                ?annotation oa:annotatedBy <${user}> .
                ?annotation oa:hasTarget/oa:hasSource ?address.
            } FILTER regex(?address, "^${urn}")
        }`*/

        return model.execute('SELECT * WHERE { GRAPH ?g {?s ?p ?o} }') //sparqlQuery(endpoint, query)
            .then((data) => {
                return _.last(data).result.map((x) => _.mapValues(x,'value'))
            })
            .then((gspos) => {
                return gspos.filter((x) => {
                    return ["http://data.perseus.org/graphs/persons","http://data.perseus.org/graphs/characterizations"].indexOf(x.g)<0
                })
            })
            .then((payload) => {
                return _.groupBy(payload,'g')
            })
            .then((annotations) => {
                return  _.groupBy(_.values(annotations),(x) => x[0].p.startsWith("http://data.perseids.org/characterization#") ? "Characterizations" : "SocialNetwork")
            })
            .then((grouped) => {
                return _.mapValues(grouped, (v,k) => {
                    return (k=="Characterizations") ?
                        _.flatten(v.map((w) => _.values(_.groupBy(w,'s')).map((x) => buildChars(x)))) :
                        _.flatten(v.map((w) => _.values(_.groupBy(w,(x) => {
                            var res = ""
                            switch (x.p.replace('http://data.snapdrgn.net/ontology/snap#','snap:')) {
                                case "http://www.w3.org/1999/02/22-rdf-syntax-ns#type":
                                    res = x.s;
                                    break;
                                case "snap:bond-with":
                                    res = x.s;
                                    break;
                                case "snap:has-bond":
                                    res = x.o;
                                    break;
                            }
                            return res
                        })).map((x) => buildSoc(x))))
                })
            })
    }

        init(self.anchor)
        load(app.model)
            .then((xs) => {

                var filterByLinks = (list) => {
                    if (list && list.length) {
                        var links = {}
                        list.forEach((v) => links[v]=true)
                        var nodes = {}
                        link.style("opacity",(d) => {
                            if (links[d.type]) {
                                nodes[d.source.uri]=true
                                nodes[d.target.uri]=true
                                return 1
                            } else {
                                return 0.1
                            }
                        })
                        linkLabel.style("opacity",(d) => ((d.group && links[d.type]) || (!d.group && nodes[d.source.uri])) ? 1 : 0.1)
                        node.style("opacity",(d) => nodes[d.uri] ? 1 : 0.1)
                        nodeLabel.style("opacity",(d) => nodes[d.uri] ? 1 : 0.1)
                    } else {
                        node.style("opacity",1)
                        link.style("opacity",1)
                        nodeLabel.style("opacity",1)
                        linkLabel.style("opacity",1)
                    }
                }

                var filterByNodes = (list) => {
                    if (list && list.length) {
                        var nodes = {}
                        var extended = {}
                        list.forEach((v) => {nodes[v]=true})
                        link.style("opacity",(d) => {
                            if (nodes[d.source.uri] || nodes[d.target.uri]) {
                                extended[d.source.uri] = true;
                                extended[d.target.uri] =true;
                                return 1
                            } else {return 0.1}
                        } )
                        linkLabel.style("opacity",(d) => ((d.group && (nodes[d.target.uri] || nodes[d.source.uri])) || (!d.group && extended[d.source.uri])) ? 1 : 0.1)
                        node.style("opacity",(d) => extended[d.uri] ? 1 : 0.1)
                        nodeLabel.style("opacity",(d) => extended[d.uri] ? 1 : 0.1)
                    } else {
                        node.style("opacity",1)
                        link.style("opacity",1)
                        nodeLabel.style("opacity",1)
                        linkLabel.style("opacity",1)
                    }
                }

                $("#Social").html(
                    `<table class="table table-hover"><thead><tr><th>Subject</th><th>Relationship</th><th>Object</th></tr></thead><tbody>\n` +
                    _.sortBy(xs.SocialNetwork, ['source', 'target']).map((x) => `<tr><td title="${x.source}">${x.source.replace("http://data.perseus.org/people/smith:", "").replace("#this", "")}</td><td title="${x.type}">${x.type.replace("http://data.snapdrgn.net/ontology/snap#", "").replace("http://data.perseus.org/rdfvocab/addons/", "")}</td><td title="${x.target}">${x.target.replace("http://data.perseus.org/people/smith:", "").replace("#this", "")}</td></tr>`).join("\n") +
                    `</tbody></table>`)
                $("#Characterizations").html(
                    `<table class="table table-hover"><thead><tr><th>Name</th><th>English</th><th>Greek</th></tr></thead><tbody>\n` +
                    _.sortBy(xs.Characterizations, 'name').map((x) => {
                        var eng = x.eng && x.eng.split("@")[1] ? x.eng.split("@")[1] : (x.eng ? x.eng : "---")
                        var grc = x.grc && x.grc.split("@")[1] ? x.grc.split("@")[1] : (x.grc ? x.grc : "---")
                        return `<tr><td title="${x.name}"><a href="${x.name}" target="_blank">${x.name.replace("http://data.perseus.org/people/smith:", "").replace("#this", "")}</a></td><td title="${x.eng}"><a href="${x.eng}" target="_blank">${eng}</a></td><td title="${x.grc}"><a href="${x.grc}" target="_blank">${grc}</a></td></tr>`
                    }).join("\n") +
                    `</tbody></table>`)

                var socialNodes = _.chain(xs.SocialNetwork || []).map((x) => [x.source, x.target]).concat((xs.Characterizations || []).map((y) => y.name)).flatten().uniq().map((x, i) => {
                    return {
                        name: x.replace("http://data.perseus.org/people/smith:", "").replace("#this", ""),
                        uri: x,
                        type: "person"
                    }
                }).value()
                var characterizationNodes = _.chain(xs.Characterizations || []).map((x) => {
                    return {name: "", uri: x.grc && x.grc.split("@")[1] ? x.grc : x.eng, type: "characterization"};
                }).value()
                var nodes = _.chain(socialNodes).concat(characterizationNodes).map((x, i) => Object.assign(x, {id: i})).value()
                var nodeMap = nodes.reduce((acc, x) => {
                    acc[x.uri] = x.id;
                    return acc
                }, {})
                var socialEdges = (xs.SocialNetwork || []).map((x) => {
                    return {target: nodeMap[x.target], type: x.type, group: "social", source: nodeMap[x.source]}
                })

                $('#filterContainer').html(
                    "<select id='linkFilters' multiple='multiple'>" +
                    _.uniq(socialEdges.map((e) => e.type)).map((t) => `<option value="${t}">${t.replace("http://data.snapdrgn.net/ontology/snap#", "").replace("http://data.perseus.org/rdfvocab/addons/", "")}</option>`).join("\n") +
                    "</select>"
                )
                /*$('#linkFilters').multiselect({
                //ms.Multiselect("#linkFilters",{
                    onChange: () => {
                        filterByLinks($('#linkFilters option:selected').map((i, e) => e.value).toArray())
                    }
                })*/
                //$('#nodeFilters').html(
                //        socialNodes.map((n) => `<input name="${n.uri.replace("http://data.perseus.org/people/smith:","").replace("#this","")}" value="${n.uri}" type="checkbox">`).join("\n")
                //)
                var characterizationEdges = _.chain(xs.Characterizations || []).map((x) => {
                    var edges = []
                    var grc = x.grc && x.grc.split("@")[1] ? x.grc.split("@")[1] : ""
                    var eng = x.eng && x.eng.split("@")[1] ? x.eng.split("@")[1] : ""
                    if (x.eng) edges.push({
                        source: nodeMap[x.name],
                        type: "characterization",
                        grcuri: x.grc,
                        enguri: x.eng,
                        grc: grc,
                        eng: eng,
                        target: nodeMap[x.grc && x.grc.split("@")[1] ? x.grc : x.eng]
                    })
                    return edges
                }).flatten().filter('target').value()
                var edges = _.concat(socialEdges, characterizationEdges)
                activateForceLayout(nodes, edges)
            })
    }

}

export default CorpusDiagram