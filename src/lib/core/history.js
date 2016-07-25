

class History {
    constructor(model,applicator) {
        this.commands = [];
        this.index = 0
    }

    undo() {
        this.index -= 1
        return this.commands.slice(0,this.index)
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
    }
}
export default History