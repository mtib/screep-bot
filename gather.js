let box = require("box");

let lodash = {
    sum: (obj) => {
        let v = 0;
        for ( let i in obj ) {
            v += obj[i];
        }
        return v;
    }
};
let COST = {};
let CREEPS = [];

// used for paths
const LINE_STYLE = {
    color: "#AAAAAA",
    width: 0.05,
    opacity: 0.6,
    lineStyle: "dashed"
};

function blockFilter(creep) {
    return {
        filter: (s) => {
            return !isBlocked(creep,s);
        }
    };
}

// cpu-heavy moveTo(range) alternative
function advMove(creep, target, r) {
    if ( target === null || creep.spawning ) {
        return;
    }
    let cpos = creep.pos;
    let tpos = target.pos;
    let len = 0;
    if ( !cpos.inRangeTo(tpos, r) ) {
        let border = (p) => {
            return [p.x, p.y].some((v) => {return v===0 || v==49;});
        };
        let path = PathFinder.search(
            cpos, {
                pos: tpos,
                range: r,
            }, {
                plainCost: 3,
                swampCost: 10,
                heuristicWeight: 1.1,
                roomCallback: (roomName) => {
                    var cur = Game.rooms[roomName];
                    if(!cur) return;
                    return COST[roomName];
                }
            });
        if ( path.incomplete ) {
            if (!Memory.blocked) {
                Memory.blocked = {};
            }
            if (!Memory.blocked[creep.id]) {
                Memory.blocked[creep.id] = {};
            }
            Memory.blocked[creep.id][target.id] = 16;
        }
        path = path.path;
        for ( let i = 1; i < path.length; i++ ) {
            creep.room.visual.line(path[i-1], path[i], LINE_STYLE);
            if (border(path[i])) break;
        }
        let next = path[0];               // shift
        let last = path[path.length - 1]; // pop
        COST[creep.room.name].set(cpos.x, cpos.y, 0x00);
        COST[creep.room.name].set(next.x, next.y, 0xff);
        COST[creep.room.name].set(last.x, last.y, 0xff);
        creep.move(cpos.getDirectionTo(next));
        len = path.length -1;
    }
    return len;
}

// weight creep is carrying
function total(creep) {
    return lodash.sum(creep.carry);
}

// weight carried / maximum weight
function relative(creep) {
    return total(creep) / creep.carryCapacity;
}

// can object be charged?
// - be carefull to make sure it has
//   an energy and energyCapacity attribute
function needsE(obj) {
    return obj.energy < obj.energyCapacity;
}

// finds closest target of specific type that needs to
// be charged
function findTarget(creep, typ, any) {
    let t = creep.pos.findClosestByPath(typ, {filter: (s) => {return needsE(s) && !isBlocked(creep, s);}});
    if (t === null && typ == FIND_MY_SPAWNS) {
        for ( let s in Game.spawns ) {
            if ( Game.spawns[s].my && any && !isBlocked(creep, Game.spawns[s])) return Game.spawns[s];
        }
    }
    return t;
}

function isBlocked(creep, target) {
    if (!Memory.blocked) {
        return false;
    }
    if (!Memory.blocked[creep.id]) {
        return false;
    }
    if (!Memory.blocked[creep.id][target.id]) {
        return false;
    }
    return true;
}

// finds target that is structure of specific type that
// also need to be recharged
function findTargetStruct(creep, typ) {
    return creep.pos.findClosestByPath(
        FIND_MY_STRUCTURES,
        {
            filter: function(s) {
                return s.structureType == typ && needsE(s) && !isBlocked(creep, s);
            }
        }
    );
}

// tries to empty the creeps charge, in case something is
// left, carry on charging other things
function fillE(creep, target) {
    let r = creep.transfer(target, RESOURCE_ENERGY, Math.min(creep.carry[RESOURCE_ENERGY], target.energyCapacity - target.energy));
    if ( creep.carry.energy === 0 ) {
        return ERR_NOT_ENOUGH_ENERGY;
    }
    return r;
}

function block(target, duration) {
    if (!duration) {
        duration = 24;
    }
    if (!Memory.blocked) {
        Memory.blocked = {};
    }
    let closest = target.pos.findClosestByPath(FIND_MY_CREEPS,
    {
        filter: function(c) {
            return c.memory.hasOwnProperty("full") && c.memory.full;
        }
    });
    CREEPS.forEach(function(c) {
        if (c != closest.id) {
            if (!Memory.blocked[c]) {
                Memory.blocked[c] = {};
            }
            Memory.blocked[c][target.id] = duration;
        }
    });
}

// interface function
function run(creep) {
    // Check whether or not full on init
    if (!creep.memory.hasOwnProperty("full")) {
        creep.memory.full = relative(creep) > 0.8;
    }

    // creep has enough to use energy for good
    if ( creep.memory.full || creep.ticksToLive < 16 ) {
        // Priority 1:
        // - fill Spawn
        let task = function(t) {
            advMove(creep, t, 1);
            block(t, 6);
            return fillE(creep, t);
        };
        // TODO decide to charge spawn below 300 on distance
        let target = findTarget(creep, FIND_MY_SPAWNS);

        // Priority 2:
        // - top Structures from breaking
        // if ( target === null ) {
        //     task = function(t) {
        //         advMove(creep, t, 3);
        //         return creep.repair(t);
        //     }
        //     let min = 500;
        //     let minobj = null;
        //     creep.room.find(FIND_STRUCTURES).filter(function(s) {
        //         return s.ticksToDecay > 0;
        //     }).forEach(function(s) {
        //         if (s.ticksToDecay < min) {
        //             min = s.ticksToDecay;
        //             minobj = s;
        //         }
        //     })
        //     target = minobj;
        // }

        // Priority 3:
        // - fill Extensions
        if ( target === null ) {
            target = findTargetStruct(creep, STRUCTURE_EXTENSION);
        }

        // Priority 4:
        // - repair Structures
        if ( target === null ) {
            task = function(t) {
                advMove(creep, t, 3);
                block(t, 100);
                return creep.repair(t);
            };
            target = creep.pos.findClosestByPath(FIND_STRUCTURES,
                { filter: function(s) {
                    return s.hits < Math.min(3000, s.hitsMax) && !isBlocked(creep, s);
                }});
        }

        // Priority 5:
        // - build Structures
        if ( target === null ) {
            task = function(t) {
                advMove(creep, t, 3);
                block(t, 60);
                return creep.build(t);
            };
            target = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES, blockFilter(creep));
        }

        // Priority 6:
        // - upgrade Controller
        //   there has to be one in the room
        //   and it has to be accessible afaik
        let con = creep.room.controller;
        if ( con.my ) {
            if ( target === null || con.ticksToDowngrade < 3500 || con.level < 2) {
                task = function(t) {
                    advMove(creep, t, 3);
                    return creep.upgradeController(t);
                };
                target = con;
            }
        }

        if ( target === null ) {
            console.log( creep.name + " in Room " + creep.room.name + " has nothing to do" );
            target = findTarget(creep, FIND_MY_SPAWNS, true);
        }

        // If empty, work!
        creep.memory.full = task(target) != ERR_NOT_ENOUGH_ENERGY;
    } else {
        // locate resource
        // - could technically be depleted
        let resource = creep.pos.findClosestByPath(FIND_SOURCES, blockFilter(creep));
        if (!resource) {
            resource = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, blockFilter(creep));
            creep.pickup(resource, creep.carryCapacity);
        }
        if (resource) {
            // move adjacent to it and mine
            advMove(creep, resource, 1);
            creep.harvest(resource);
        } else {
            // TODO use energy reserves
            // - go to extractor
            // - withDraw carryCapacity -> Full
            return;
        }
        creep.memory.full = total(creep) == creep.carryCapacity;
    }
}

function renewCostMatrix() {
    for ( let i in Game.rooms ) {
        let cur = Game.rooms[i];
        let costs = new PathFinder.CostMatrix();
        cur.find(FIND_STRUCTURES).forEach((structure) => { //jshint ignore: line
            if (structure.structureType === STRUCTURE_ROAD) {
                // Favor roads over plain tiles
                costs.set(structure.pos.x, structure.pos.y, 1);
            } else if (structure.structureType !== STRUCTURE_CONTAINER &&
                    (structure.structureType !== STRUCTURE_RAMPART ||
                    !structure.my)) {
                // Can't walk through non-walkable buildings
                costs.set(structure.pos.x, structure.pos.y, 0xff);
            }
        });

        // Avoid creeps in the room
        cur.find(FIND_CREEPS).forEach((creep) => { //jshint ignore: line
            costs.set(creep.pos.x, creep.pos.y, 0xff);
            CREEPS.push(creep.id);
        });

        let length = [0, 49];
        for ( let x = 0; x <= length[1]; x++) {
            costs.set(length[0], x, 0xff);
            costs.set(length[1], x, 0xff);
            costs.set(x, length[0], 0xff);
            costs.set(x, length[1], 0xff);
        }

        COST[cur.name] = costs;
    }
}

module.exports = {
    run: run,
    SPEC: [WORK, MOVE, CARRY, CARRY],
    MINIMAL: [WORK, MOVE, CARRY],
    COST: COST,
    renewCostMatrix: renewCostMatrix
};
