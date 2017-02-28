// gather bots collect energy and power stuff
let gather = require("gather");
// builder destroy red-flagged objects
// - and are gatherers when not needed
let builder = require("builder");
let box = require("box");

// because Game.creeps.length isn't a thing
function countCreeps() {
    let answ = {};
    let isSpawning = (s) => {
        if(s) {
            if (s.spawning !== null) {
                answ[s.room.name] += 1;
            }
        }
    };
    for ( let j in Game.rooms ) {
        answ[Game.rooms[j].name] = Game.rooms[j].find(FIND_MY_CREEPS).length;
        Game.rooms[j].find(FIND_MY_SPAWNS).forEach(isSpawning);
    }
    return answ;
}

// if to few creeps, use [multiple] spawns to
// create new ones
// - by default builders, because others aren't
//   needed right now
function balanceCreeps(goal) {
    let counts = countCreeps();
    for ( let i in Game.spawns ) {
        let spawner = Game.spawns[i];
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
    let response = "-- you should not be reading this --";
    let code = "OK";
    switch (ret) {
        case OK:
            response = "Spawning creep " + msimple.NNAME + " in Room " + spawn.room.name;
            break;
        case ERR_NOT_ENOUGH_ENERGY:
            ret = spawn.createCreep(msimple.MINIMAL, msimple.MNAME, msimple.MEMORY);
            if (ret == msimple.MNAME) {
                ret = OK;
                response = "Spawning creep " + msimple.MNAME + " in Room " + spawn.room.name;
            } else {
                response = spawn.name + " in Room " + spawn.room.name + " can't spawn creep";
                code = "NOT ENOUGH ENERGY";
            }
            break;
        default:
            response = "Spawning creep " + msimple.NNAME + " in Room " + spawn.room.name;
            code = "BUSY / NOT MINE";
            break;
    }
    let b = new box.Box();
    b.addHeadline("SPAWN");
    b.addLineRaw(response);
    b.addLineRaw("<b>Code:</b> " + code);
    b.print();
    return ret;
}

// get tuple of specific type
// - ([SPEC, MINIMAL], [NAME1, NAME2], MEMORY)
function getGenSpec(modul) {
    let spec = gather.SPEC;
    if ( modul.hasOwnProperty("SPEC") ) {
        spec = modul.SPEC;
    }
    let mini = spec;
    if ( modul.hasOwnProperty("MINIMAL") ) {
        mini = modul.MINIMAL;
    }
    let mem = {};
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
    let s = "";
    for ( let i in spec ) {
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
    return creep.body.every((c)=>{
        return spec.indexOf(c.type) != -1;
    });
}

// main function
function manageCreeps(goal, profiler) {
    gather.renewCostMatrix();
    every( () => {balanceCreeps(goal);}, 11 );
    for (let c in Game.creeps) {
        let creep = Game.creeps[c];
        let start = Game.cpu.getUsed();
        if ( isSpec(creep, gather.SPEC) ) {
            gather.run(creep);
        } else if ( isSpec(creep, builder.SPEC) ) {
            if (!builder.run(creep)) gather.run(creep);
        } else {
            console.log(creep + " doesn't know what to do");
        }
        creep.memory.used = Game.cpu.getUsed() - start;
    }
}

// timing
function every(func, ticks) {
    if (Game.time % ticks === 0) {
        func();
    }
}

module.exports = {
    manageCreeps: manageCreeps,
    spawn: spawn,
    gather: gather,
};
