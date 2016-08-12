class Delete {

    constructor(jqParent) {
        // done: add button (hidden)
        var button = $('<div class="btn btn-circle" id="delete_btn" style="display:none;" data-toggle="modal" data-target="#delete_modal"><span class="glyphicon glyphicon-paperclip"></span></div>')
        jqParent.append(button)
        // done: add deletion interface
        var modal = $('<div id="delete_modal" class="modal fade in" style="display: none; "><div class="well">'+
            '<div class="modal-header"><a class="close" data-dismiss="modal">×</a><h3>This is a Modal Heading</h3></div>'+
            '<div class="modal-body"></div>'+
            '<div class="modal-footer"><button type="button" class="btn btn-success" data-dismiss="modal">Create</button><button type="submit" class="btn btn-danger" data-dismiss="modal">Cancel</button></div>'+
            '</div>')
        jqParent.append(modal)
        var body = modal.find('.modal-body')
        var delete_button = modal.find('.btn-success')
        // done: add event listener
        // done: button.click -> show interface
        button.click((e) => {
            // done: show modal (automatically w/ data-toggle)
            // done: hide button
            button.css('display','none')
        })

        delete_button.click((e) => {
            // done: get selected checkboxes
            var tables = $('#delete_modal .modal-body').find('table')
            var ids = tables.map((i,e) => $(e).attr('id'))
            var checked = tables.map((i,e) => $(e).find('input:checkbox').map((j,f) => f.checked))

            // done: check if complete graph
            var all = _.map(checked, (x) => _.reduce(x,(y,z) => y&&z))
            var some = _.map(checked, (x) => _.reduce(x,(y,z) => y||z))
            var deleteAll = _.zip(ids,all).filter((x) => x[1]).map((x) => x[0])
            var deleteSome = _.zip(ids,all,some).filter((x) => x[2]&&!x[1]).map((x) => x[0])

            // todo: create sparql
            var sparqlAll = deleteAll.map(/* todo: delete whole annotation */)
            var sparqlSome = deleteSome.map(/* todo: delete just the triples and change annotation */)
            // todo: run model.execute
            // note: var results = this.model.execute(_.concat(sparqlAll,sparqlSome))
            // todo: provide visual feedback
            // note: results.then((data) => if (data is w/o error) success else failure and report)
            console.log(e)
        })

        modal.update = (graphs) => {
            // done: populate with graphs/triples
            body.html('')
            _.keys(graphs).forEach((id) => {
                // done: create outer element and append to modal
                var well = $('<div class="well" style="background-color: white;"/>')
                var table = $('<table/>')
                well.append(table)
                body.append(well)
                graphs[id].forEach((triple,i) => {
                    $('<tr><td><input type="checkbox" id="delete::'+id+'::'+i+'"></td><td>'+triple.s+'\n'+triple.p+'\n'+triple.o+'</td></tr>').appendTo(table)
                    // done: transform triple into element and append to outer element
                })
            })
            // interface.button.click -> get selections and create sparql to delete them
        }
        this.register = (jqElement) => {
            jqElement.click((e) => {
                // todo: fix button position
                var menuState = document.documentElement.clientWidth - parseInt($("#menu-container").css('width'))
                var deltaH = menuState ? window.scrollY+15 : window.scrollY-parseInt($("#menu-container").css('height'))+15;
                var deltaW = menuState ? window.scrollX+parseInt($("#menu-container").css('width')) : window.scrollX;
                // note: show button
                button.css({display:"block",position:"absolute",left:event.clientX-deltaW,top:event.clientY+deltaH});
                // note: prep interface
                modal.update(_.pickBy(jqElement.data(),(v,k)=>k.startsWith('http://')))
            })
        }
    }
}

export default Delete

