// lodash for summing carry weights
var _ = require("lodash");

// gather bots collect energy and power stuff
var gather = require("gather");
// builder destroy red-flagged objects
// - and are gatherers when not needed
var builder = require("builder");

// because Game.creeps.length isn't a thing
function countCreeps() {
    var answ = {};
    for ( var j in Game.rooms ) {
        answ[Game.rooms[j].name] = Game.rooms[j].find(FIND_MY_CREEPS).length;
        Game.rooms[j].find(FIND_MY_SPAWNS).forEach(function(s) {
            if (s.spawning !== null) {
                answ[s.room] += 1;
            }
        });
    }
    return answ;
}

// if to few creeps, use [multiple] spawns to
// create new ones
// - by default builders, because others aren't
//   needed right now
function balanceCreeps(goal) {
    var counts = countCreeps();
    for ( var i in Game.spawns ) {
        var spawner = Game.spawns[i];
        if ( counts[spawner.room.name] < goal ) {
            if (spawn(spawner, gather) == OK) {
                counts[spawner.room.name] += 1;
            }
        }
    }
}

function spawn(spawn, modul) {
    let msimple = getGenSpec(modul);
    let ret = spawn.createCreep(msimple.SPEC, msimple.NNAME, msimple.MEMORY);
    if (ret == msimple.NNAME) ret = OK;
    switch (ret) {
        case OK:
            console.log("Spawning creep " + msimple.NNAME + " in Rooom " + spawn.room.name);
            break;
        case ERR_NOT_ENOUGH_ENERGY:
            ret = spawn.createCreep(msimple.MINIMAL, msimple.MNAME, msimple.MEMORY);
            if (ret == msimple.MNAME) {
                ret = OK;
                console.log("Spawning creep " + msimple.MNAME + " in Rooom " + spawn.room.name);
            }
            break;
        default:
            console.log("Spawning creep " + msimple.NNAME + " in Room " + spawn.room.name + " with code " + ret);
            break;
    }
    return ret;
}

// get tuple of specific type
// - ([SPEC, MINIMAL], [NAME1, NAME2], MEMORY)
function getGenSpec(modul) {
    var spec = gather.SPEC;
    if ( modul.hasOwnProperty("SPEC") ) {
        spec = modul.SPEC;
    }
    var mini = spec;
    if ( modul.hasOwnProperty("MINIMAL") ) {
        mini = modul.MINIMAL;
    }
    var mem = {};
    if ( modul.hasOwnProperty("MEMORY") ) {
        mem = modul.MEMORY;
    }
    return {
        SPEC: spec,
        MINIMAL: mini,
        NNAME: getName(spec),
        MNAME: getName(mini),
        MEMORY: mem
    };
}

// generate a name based on current time and spec
function getName(spec) {
    s = "";
    for ( var i in spec ) {
        let j = spec[i][0].toUpperCase();
        let c = "<span style='color:";
        switch (j) {
            case 'W':
                c += "yellow";
                break;
            case 'M':
                c += "lightblue";
                break;
            case 'A':
                c += "red";
                break;
            case 'C':
                c += "grey";
                break;
            default:
                c += "inherit";
                break;
        }
        s += c + "'>" + j + "</span>";
    }
    let t = "";
    let c = Game.time % 10000;
    t += c;
    for ( let i = 0; i < 3-Math.floor(Math.log10(c)); i++ ) {
        t = "0" + t;
    }
    return "bot-" + t + "-" + s;
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
    gather.renewCostMatrix();
    every( function() {balanceCreeps(goal);}, 11 );
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

// timing
function every(func, ticks) {
    if (Game.time % ticks === 0) {
        func();
    }   
}

module.exports = {
    manageCreeps: manageCreeps
};
