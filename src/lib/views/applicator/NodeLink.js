import d3 from'd3'
import $ from 'jquery'
import _ from 'lodash'

class NodeLink {
    constructor(parent) {
        var self = this
        this.parent = parent
        this.width = $(parent).width()
        this.height = $(parent).height()

        this.USE_GRID = true;
        this.GRID_SIZE = 60;
        this.GRID_TYPE = "HEXA";
        
        this.vis = d3.select(parent).append("svg:svg").attr("width",this.width).attr("height",this.height)

        this.nodes = []
        this.links = []
        this.force = d3.layout.force().size([this.width, this.height]).nodes(this.nodes).links(this.links).gravity(1).linkDistance(function(d){return (1-d.weight)*100}).charge(-3000).linkStrength(function(x) {
            return x.weight * 5
        });

        this.updateLink = function() {
            this.attr("x1", function(d) {
                return d.source.screenX;
            }).attr("y1", function(d) {
                return d.source.screenY;
            }).attr("x2", function(d) {
                return d.target.screenX;
            }).attr("y2", function(d) {
                return d.target.screenY;
            });
        }

        this.updateNode = function() {
            this.attr("transform", function(d) {
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
        
        this.grid = function(width, height) {
            return {
                cells : [],

                init : function() {
                    this.cells = [];
                    for(var i = 0; i < width / self.GRID_SIZE; i++) {
                        for(var j = 0; j < height / self.GRID_SIZE; j++) {
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
                                        y : j * self.GRID_SIZE * .85
                                    };
                                    break;
                            }
                            this.cells.push(cell);

                        };
                    };
                },

                sqdist : function(a, b) {
                    return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
                },

                occupyNearest : function(p) {
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
        }(this.width, this.height);

        this.force.on("tick", function() {
            self.vis.select("g.gridcanvas").remove();
            if(self.USE_GRID) {
                self.grid.init();
                var gridCanvas = self.vis.append("svg:g").attr("class", "gridcanvas").attr("width", self.width).attr("height", self.height);
                _.each(self.grid.cells, function(c) {
                    gridCanvas.append("svg:circle").attr("cx", c.x).attr("cy", c.y).attr("r", 2).style("fill", "#555").style("opacity", .3);
                });
            }

            self.node.call(self.updateNode);
            self.link.call(self.updateLink);
        });

        this.link = this.vis.selectAll("line.link").data(self.links).enter().append("svg:line").attr("class", "link");
        this.link.on("click", function(d,i) {
            console.log(d);
        })
        this.node = this.vis.selectAll("g.node").data(self.force.nodes()).enter().append("svg:g").attr("class", "node");
        this.node.append("svg:circle").attr("r", 7);
        this.node.call(self.force.drag);
        this.node.on("click", function(d,i) {
            console.log(d);
            console.log(i);
        })
        this.force.start()
    }


}

export default NodeLink