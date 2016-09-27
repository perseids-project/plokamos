import $ from 'jquery'

class History {

    constructor(app) {
        this.app = app
        this.backBtn = $(`<button id="plokamos-back" class="btn" title="Undo" disabled><span class="glyphicon glyphicon-chevron-left"/></button>`)
        this.forwardBtn = $(`<button id="plokamos-forward" class="btn" title="Redo" disabled><span class="glyphicon glyphicon-chevron-right"/></button>`)
        this.commitBtn = $(`<button id="plokamos-commit" class="btn" title="Commit" disabled><span class="glyphicon glyphicon-cloud-upload"/></button>`)
        this.backBtn.click((e) => this.undo())
        this.forwardBtn.click((e) => this.redo())
        this.commitBtn.click((e) => this.commit())
        this.app.bar.navigation.append(this.backBtn,this.forwardBtn,this.commitBtn)
        this.model = app.model;
        this.applicator = app.applicator;
        this.commands = [];
        this.index = 0


        this.undo = () => {
            this.index -= 1
            this.model.reset()
                .then(() =>
                    this.model.execute(_.flatten(this.commands.slice(0,this.index)))
                )
                .then((result) => {
                    this.applicator.reset()
                    this.forwardBtn.prop('disabled',false)
                    if (!this.index) {
                        this.backBtn.prop('disabled',true)
                        this.commitBtn.prop('disabled',true)
                    }
                })
        }

        this.redo = () => {
            this.index += 1
            this.model.reset()
                .then(() =>
                    this.model.execute(_.flatten(this.commands.slice(0,this.index)))
                )
                .then((result) => {
                    this.applicator.reset()
                    this.backBtn.prop('disabled',false)
                    this.commitBtn.prop('disabled',false)
                    if (this.index===this.commands.length) this.forwardBtn.prop('disabled',true)
                })
        }

        this.add = (cmd) => {
            this.commands.splice(this.index)
            var cmds = cmd.constructor === Array ? cmd : [cmd]
            this.commands.push(cmds)
            this.index += 1
            this.backBtn.prop('disabled',false)
            this.commitBtn.prop('disabled',false)
            this.forwardBtn.prop('disabled',true)
            return this.commands
        }

        this.reset = (remaining) => {
            this.commands = remaining || [];
            this.index = 0
            this.backBtn.prop('disabled',true)
            this.forwardBtn.prop('disabled',this.commands.length===0)
            this.commitBtn.prop('disabled',true)
            return this.model.reset().then(() => this.applicator.reset())
        }

        this.commit = (source) => {
            var endpoint = this.app.getEndpoint().write
            var mime = "application/sparql-update"
            var commands = _.chain(this.commands.slice(0,this.index)).map((v,k) => v.map((w) => {return {i:k,sparql:w}})).flatten().value()
            var sequence = commands.slice().reverse()
            // todo: add parent-level index to commands before flattening, use to group in case of failure
            // todo: possibly aggregate the responses
            // todo: do DROP last, because it cannot be reverted (easily)
            var response = _.reduce(commands,(previous,current) =>
                    previous.then(
                        (success) => {
                            if (success) sequence.pop() // we keep a register of outstanding operations
                            if (source && source.progress) source.progress(1-sequence.length/commands.length)
                            return $.ajax( { url:endpoint, type:'POST', data:current.sparql, contentType:mime} )
                        },
                        (failure) => $.Deferred().reject(sequence).promise()
                    ),
                $.Deferred().resolve().promise()
            )
            response.then(
                (success) => {
                    this.model.upstream.push(this.commands.slice(0,this.index))
                    this.reset()
                },
                (failure) => {
                    var successful = commands.slice(0,-1*sequence.length)
                    var failed = sequence.slice().reverse()
                    // planned: recover structure of commands
                    this.model.upstream.push(successful)
                    var remaining = _.chain(failed).groupBy('i').values().map((v) => v.map((w) => w.sparql)).value()
                    this.reset(_.concat(this.commands.slice(this.index),remaining))
                }
            )
            return response
        }
    }

    // planned: progress() function that moves a colored line across the plokamos-bar border
}
export default History