class Tooltip {
    constructor(jqParent) {
        jqParent.append($('<div class="margintooltip" style="display: none;"></div>'))
        this.register = (jqElement) => {
            jqElement.hover(function (e) {
                function stringify(obj) {
                    return _.values(_.mapValues(obj,function(v,k) {
                        var bonds = v
                            .filter(function(o){
                                return o.p === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" && o.s.startsWith(k)
                            })
                            .map(function(o) {
                                return o.s
                            })
                        var expressions = bonds.map(function(bond) {
                            var subject = v.filter(function(o) {
                                return o.p.endsWith("has-bond") && o.o === bond
                            }).map(function(o) {return o.s})[0]
                            var predicate = v.filter(function(o) {
                                return o.p === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" && o.s === bond
                            }).map(function(o) {return o.o})[0]
                            var object = v.filter(function(o) {
                                return o.p.endsWith("bond-with") && o.s === bond
                            }).map(function(o) {return o.o})[0]
                            return subject.split("\/").slice(-1)[0]+"\n"+predicate+"\n"+object.split("\/").slice(-1)[0]
                        })
                        return expressions.join(";\n")
                    })).join("\n\n")
                }
                var description = stringify($(this).data())//attr(field)
                var tooltip = $('.margintooltip')

                var menuState = document.documentElement.clientWidth - parseInt($("#menu-container").css('width'))
                var deltaH = menuState ? 0 : parseInt($("#menu-container").css('height'));
                var deltaW = menuState ? parseInt($("#menu-container").css('width')) : 0;

                var parent = $(this.parentElement)
                var position = parent.position()
                var width = Math.min(100, position.left)

                if (width < 60 || !description) {
                    return
                }

                tooltip
                    .css({
                        'border-right': 'solid 2px #FF00FF',
                        'font-size': '13px',
                        'left': position.left - width - 5 + deltaW,
                        'min-height': parent.height(),
                        'padding-right': '7px',
                        'position': 'absolute',
                        'text-align': 'right',
                        'top': position.top + deltaH,
                        'width': width
                    })
                    .text(description)
                    .stop()
                    .fadeIn({
                        duration:100,
                        queue: false
                    })
            }, function () {
                $('.margintooltip').stop()
                $('.margintooltip').fadeOut({
                    duration: 100
                })
            })
        }
    }
}

export default Tooltip