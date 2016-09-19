import d3 from'd3'
import $ from 'jquery'
import _ from 'lodash'

class NodeLink {
    constructor(app) {
        var body = app.anchor
        var self = this
        var globalViewBtn = $(`
          <button id="global-view-btn" class="btn">
            <span class="glyphicon glyphicon-certificate"/>
          </button>
        `)
        var globalView = $('<div class="well" id="global-view" style="position:fixed; top:10%; left:12.5%; width:75%; height:40%; z-index:1000;"/>');
        app.bar.plugins.append(globalViewBtn);
        body.append(globalView);
        globalView.css('display','none');
        globalViewBtn.mouseleave(function(e) {if (!globalViewBtn.keep) {$('#global-view').css('display','none'); self.force.stop()}});
        globalViewBtn.mouseenter(function(e) {
            if (!globalViewBtn.keep) {self.force.start()}
            $('#global-view').css('display','block')
        });
        globalViewBtn.click(function(e) {
            globalViewBtn.keep = !globalViewBtn.keep
            $('#global-view').css('display','block')})
        globalViewBtn.keep = false;
        this.parent = globalView.get(0)

        this.USE_GRID = true;
        this.GRID_SIZE = 60;
        this.GRID_TYPE = "HEXA";

        this.node={}
        this.link={}
        this.nodes = []
        this.links = []

        this.vis = d3.select(this.parent).append("svg:svg").attr("width","100%").attr("height","100%")
        this.force = d3.layout.force().size([50, 50]).nodes(this.nodes).links(this.links).gravity(1).linkDistance(function(d){return (1-d.weight)*100}).charge(-3000).linkStrength(function(x) {
            return x.weight * 5
        });
        this.grid = function() {
            return {
                cells : [],

                init : function() {
                    this.cells = [];
                    for(var i = 0; i < $(self.parent).width() / self.GRID_SIZE; i++) {
                        for(var j = 0; j < $(self.parent).height() / self.GRID_SIZE; j++) {
                            // HACK: ^should be a better way to determine number of rows and cols
                            var cell;
                            switch (self.GRID_TYPE) {
                                case "PLAIN":
                                    cell = {
                                        x : i * self.GRID_SIZE,
                                        y : j * self.GRID_SIZE
                                    };
                                    break;
                                case "SHIFT_ODD_ROWS":
                                    cell = {
                                        x : i * self.GRID_SIZE,
                                        y : 1.5 * (j * self.GRID_SIZE + (i % 2) * self.GRID_SIZE * .5)
                                    };
                                    break;
                                case "HEXA":
                                    cell = {
                                        x : i * self.GRID_SIZE + (j % 2) * self.GRID_SIZE * .5,
                                        y : j * self.GRID_SIZE
                                    };
                                    break;
                            }
                            this.cells.push(cell);

                        };
                    };
                },

                sqdist : function(a, b) {return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)},

                occupyNearest : function (p) {
                    var minDist = 1000000;
                    var d;
                    var candidate = null;
                    for(var i = 0; i < this.cells.length; i++) {
                        if(!this.cells[i].occupied && ( d = this.sqdist(p, this.cells[i])) < minDist) {
                            minDist = d;
                            candidate = this.cells[i];
                        }
                    }
                    if(candidate)
                        candidate.occupied = true;
                    return candidate;
                }

            }
        }();

        this.updateLink = function() {
            this.attr("x1", (d) => {
                return d.source.screenX;
            }).attr("y1", (d) => {
                return d.source.screenY;
            }).attr("x2", (d) => {
                return d.target.screenX;
            }).attr("y2", (d) => {
                return d.target.screenY;
            });
        }
        this.updateNode = function() {
            this.attr("transform", (d) => {
                if(self.USE_GRID) {
                    var gridpoint = self.grid.occupyNearest(d);

                    if(gridpoint) {
                        d.screenX = d.screenX || gridpoint.x;
                        d.screenY = d.screenY || gridpoint.y;
                        d.screenX += (gridpoint.x - d.screenX) * .2;
                        d.screenY += (gridpoint.y - d.screenY) * .2;

                        d.x += (gridpoint.x - d.x) * .05;
                        d.y += (gridpoint.y - d.y) * .05;
                    }
                } else {
                    d.screenX = d.x;
                    d.screenY = d.y;
                }
                return "translate(" + d.screenX + "," + d.screenY + ")";
            });
        };

        this.update_force_size = () => {
            var forceSize = self.force.size();
            var parent = $(self.parent)
            if (forceSize[0]!=parent.width() || forceSize[1]!=parent.height()) {
                self.force.size([parent.width(), parent.height()])
            }
        }

        this.update_graph = () => {
            self.update_force_size()
            self.link = self.vis.selectAll("line.link").data(
                self.force.links(),
                (d) => d.source + "-" + d.target
            );
            self.link.enter()
                .insert("svg:line", ".node")
                .attr("class", "link")
                .on("click",(d,i)=>{})
                .on("hover",(d,i)=>{});
            self.link.exit()
                .remove();
            self.node = self.vis.selectAll("circle.node").data(
                self.force.nodes(),
                (d) => d.id
            );
            self.node.enter()
                .append("svg:circle")
                .attr("class", "node")
                .attr("data-id", (d) => d.id)
                .attr("r", 7)
                .call(self.force.drag)
                .on("click",(d,i)=>{})
                .on("hover",(d,i)=>{});
            self.node.exit()
                .remove();
        }
        this.add = (triples) => {
            triples.forEach((t) => {
                // we're looking for existing occurrences of resources from the new triple
                var subjectIdx = _.findIndex(self.nodes,['id',t.s])
                var objectIdx = _.findIndex(self.nodes,['id',t.o])
                var predicateIdx = (subjectIdx+1 && objectIdx+1) ? _.findIndex(self.links,{source:subjectIdx,target:objectIdx}) : -1
                if (subjectIdx+1) {self.nodes[subjectIdx].graphs.push(t.g)} else {subjectIdx = self.nodes.push({id:t.s,graphs:[t.g],x:Math.floor($(self.parent).width()*Math.random()),y:Math.floor($(self.parent).height()*Math.random())})-1}
                if (objectIdx+1) {self.nodes[objectIdx].graphs.push(t.g)} else {objectIdx = self.nodes.push({id:t.o,graphs:[t.g],x:Math.floor($(self.parent).width()*Math.random()),y:Math.floor($(self.parent).height()*Math.random())})-1}
                if (predicateIdx+1) {self.links[predicateIdx].graphs.push([t.g,t.p])} else {predicateIdx = self.links.push({source:subjectIdx,target:objectIdx,graphs:[[t.g,t.p]],weight:1})-1}
            })
            // todo
            // planned: take in triples instead of node/links and convert them with self.node indices
            // planned: remember that removing may require re-indexing!
            // todo
            // self.nodes = this.nodes.concat(nodes||[])
            // self.links = this.links.concat(links||[])
            self.force.nodes(self.nodes).links(self.links)
            // this.update_graph()
            this.update_graph()
        }
        this.remove = (triples) => {

        }

        this.reset = () => {
            this.force.stop()
            self.nodes = []
            self.links = []
            self.force.nodes(self.nodes).links(self.links)
            self.vis.selectAll("line.link").data([]).exit().remove()
            self.vis.selectAll("circle.node").data([]).exit().remove()
        }
        this.update = (triples) => {

        }

        this.update_graph()
        this.force.on("tick", () => {
            self.update_force_size()
            self.vis.select("g.gridcanvas").remove();
            if(self.USE_GRID) {
                self.grid.init();
                var gridCanvas = self.vis.append("svg:g").attr("class", "gridcanvas").attr("width", "100%").attr("height", "100%");

                _.each(self.grid.cells, (c) => gridCanvas.append("svg:circle").attr("cx", c.x).attr("cy", c.y).attr("r", 2).style("fill", "#555").style("opacity", .3));
            }

            self.node.call(self.updateNode);
            self.link.call(self.updateLink);
        });
        this.grid.init()
    }
}

export default NodeLink