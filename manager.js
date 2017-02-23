// lodash for summing carry weights
var _ = require("lodash");

// gather bots collect energy and power stuff
var gather = require("gather");
// builder destroy red-flagged objects
// - and are gatherers when not needed
var builder = require("builder");

// because Game.creeps.length isn't a thing
function countCreeps() {
    var numCreeps = 0;
    for ( var i in Game.creeps ) {
        numCreeps += 1;
    }
    return numCreeps;
}

// if to few creeps, use [multiple] spawns to
// create new ones
// - by default builders, because others aren't
//   needed right now
function balanceCreeps(goal) {
    count = countCreeps();
    if ( count < goal ) {
        var schedule = goal - count;
        // I should check for creeps in the room
        // of the spawner to make sure it is a
        // bit more balanced
        // - not needed as of now
        // TODO balancing spawners
        for ( var i in Game.spawns ) {
            if ( schedule > 0 ) {
                Game.spawns[i].createCreep(gather.SPEC, "bot-" + Game.time);
                schedule -= 1;
            }
        }
    }
}

// check whether or not a creep has all
// necessary bits to be of a specific type
function isSpec(creep, spec) {
    return creep.body.every(function(c) {
        return spec.indexOf(c.type) != -1;
    });
}

// main function
function manageCreeps(goal) {
    balanceCreeps(goal);
    for (var c in Game.creeps) {
        creep = Game.creeps[c];
        if ( isSpec(creep, gather.SPEC) ) {
            gather.run(creep);
        } else if ( isSpec(creep, builder.SPEC) ) {
            builder.run(creep);
        } else {
            console.log(creep + " doesn't know what to do");
        }
    }
}

module.exports = {
    manageCreeps: manageCreeps
};
