import SNAP from '../../models/ontologies/SNAP'

class Tooltip {
    constructor(jqParent) {
        jqParent.append($('<div class="margintooltip" style="display: none;"></div>'))
        this.register = (jqElement) => {
            jqElement.hover(function (e) {
                // todo: stringify should check ontology and select simplifier or stringify raw (.value)
                function stringify(obj) {
                    var simplified = SNAP.simplify(obj)
                    return _.flatten(_.values(simplified)).map((o) => o.s+";\n"+o.p+";\n"+o.o).join("\n\n")
                }
                var graphs = $(this).data('annotations')
                var description = stringify(graphs)//attr(field)
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