import $ from 'jquery'

class History {
    constructor(app) {
        this.app = app
        this.model = app.model;
        this.applicator = app.applicator;
        this.commands = [];
        this.index = 0
    }

    undo() {
        this.index -= 1
        this.model.reset()
        return this.model.execute(_.flatten(this.commands.slice(0,this.index)))
    }

    redo() {
        this.index += 1
        return this.commands.slice(0,this.index)
    }

    add(cmd) {
        this.commands.splice(0,this.index)
        var cmds = cmd.constructor === Array ? cmd : [cmd]
        cmds.forEach((c) => this.commands.push(c))
        this.index += cmds.length
        return this.commands
    }

    reset() {
        this.commands = [];
        this.index = 0
        return this.model.reset().then(() => this.applicator.reset())
    }

    commit(source) {
        var endpoint = this.app.getEndpoint().write
        var mime = "application/sparql-update"
        var commands = _.chain(this.commands.slice(0,this.index)).flatten().value()
        var sequence = commands.slice().reverse()

        // todo: possibly aggregate the responses
        // todo: do DROP last, because it cannot be reverted (easily)
        var response = _.reduce(commands,(previous,current) =>
            previous.then(
                (success) => {
                    if (success) sequence.pop() // we keep a register of outstanding operations
                    if (source && source.progress) source.progress(1-sequence.length/commands.length)
                    return $.ajax( { url:endpoint, type:'POST', data:current, contentType:mime} )
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
                this.commands = [failed]
                this.reset()
                }
        )
        return response
    }
}
export default History