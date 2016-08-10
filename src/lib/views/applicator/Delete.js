class Delete {

    constructor(jqParent) {
        var button = $('<div class="btn btn-circle" id="delete_btn" style="display:none;" data-toggle="modal" data-target="#delete_modal"><span class="glyphicon glyphicon-paperclip"></span></div>')
        jqParent.append(button)
        var interface = $('<div id="delete_modal" class="modal fade in" style="display: none; "><div class="well">'+
            '<div class="modal-header"><a class="close" data-dismiss="modal">×</a><h3>This is a Modal Heading</h3></div>'+
            '<div class="modal-body"></div>'+
            '<div class="modal-footer"><button type="button" class="btn btn-success" data-dismiss="modal" onclick="perseids.annotator.save()">Create</button><button type="submit" class="btn btn-danger" data-dismiss="modal">Cancel</button></div>'+
            '</div>')
        jqParent.append(interface)
        // add button (hidden)
        // add deletion interface
        // add event listener

        // button.click -> show interface
        button.click((e) => {
            // todo: show modal (automatically w/ data-toggle)
            // todo: hide button
        })
        interface.update = (graphs) => {
            // todo: populate with graphs/triples
            _.keys(graphs).forEach((id) => {
                // todo: create outer element and append to modal
                graphs[id].forEach((triple) => {
                    // todo: transform triple into element and append to outer element
                })
            })
            // interface.button.click -> get selections and create sparql to delete them
        }
        this.register = (jqElement) => {
            jqElement.click((e) => {
                // fix button position
                var menuState = document.documentElement.clientWidth - parseInt($("#menu-container").css('width'))
                var deltaH = menuState ? window.scrollY+15 : window.scrollY-parseInt($("#menu-container").css('height'))+15;
                var deltaW = menuState ? window.scrollX+parseInt($("#menu-container").css('width')) : window.scrollX;
                // show button
                button.css({display:"block",position:"absolute",left:event.clientX-deltaW,top:event.clientY+deltaH});
                // prep interface
                interface.update(jqElement.data())
            })
        }
    }
}

export default Delete

