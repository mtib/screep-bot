_ = require("lodash");

let COST = {};

// used for paths
LINE_STYLE = {
    color: "#AAAAAA",
    width: 0.05,
    opacity: 0.2,
    lineStyle: "dashed"
};

// cpu-heavy moveTo(range) alternative
function advMove(creep, target, r) {
    if ( target === null || creep.spawning ) {
        return;
    }
    let cpos = creep.pos;
    let tpos = target.pos;
    if ( !cpos.inRangeTo(tpos, r) ) {
        let path = PathFinder.search(
            cpos, {
                pos: tpos,
                range: r,
            }, {
                plainCost: 2,
                swampCost: 3,
                heuristicWeight: 1.2,
                roomCallback: function(roomName) {
                    var cur = Game.rooms[roomName];
                    if(!cur) return;
                    return COST[roomName];
                }
            }).path;
        for ( let i = 1; i < path.length; i++ ) {
            creep.room.visual.line(path[i-1], path[i], LINE_STYLE);
        }
        let next = path[0];
        let last = path[path.length - 1];
        COST[creep.room.name].set(cpos.x, cpos.y, 0x00);
        COST[creep.room.name].set(next.x, next.y, 0xff);
        COST[creep.room.name].set(last.x, last.y, 0xff);
        COST[creep.room.name].set(next.x, next.y, 0xff);
        creep.move(cpos.getDirectionTo(next));
    }
}

// weight creep is carrying
function total(creep) {
    return _.sum(creep.carry);
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
function findTarget(creep, typ) {
    return creep.pos.findClosestByPath(typ, {filter: needsE});
}

// finds target that is structure of specific type that
// also need to be recharged
function findTargetStruct(creep, typ) {
    return creep.pos.findClosestByPath(
        FIND_MY_STRUCTURES,
        {
            filter: function(s) {
                return s.structureType == typ && needsE(s);
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

// interface function
function run(creep) {
    // Check whether or not full on init
    if (!creep.memory.hasOwnProperty("full")) {
        creep.memory.full = relative(creep) > 0.8;
    }

    // creep has enough to use energy for good
    if ( creep.memory.full ) {
        // Priority 1:
        // - fill Spawn
        let task = function(t) {
            advMove(creep, t, 1);
            return fillE(creep, t);
        };
        // TODO decide to charge spawn below 300 on distance
        let target = findTarget(creep, FIND_MY_SPAWNS);

        // Priority 2:
        // - fill Extensions
        if ( target === null ) {
            target = findTargetStruct(creep, STRUCTURE_EXTENSION);
        }

        // Priority 3:
        // - build Structures
        if ( target === null ) {
            task = function(t) {
                advMove(creep, t, 3);
                return creep.build(t);
            };
            target = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
        }
        
        // Priority 4:
        // - repair Structures
        if ( target === null ) {
            task = function(t) {
                advMove(creep, t, 3);
                return creep.repair(t);
            }
            target = creep.pos.findClosestByPath(FIND_STRUCTURES,
                { filter: function(s) {
                    return s.hits < Math.min(5000, s.hitsMax);
                }});
        }

        // Priority 5:
        // - upgrade Controller
        //   there has to be one in the room
        //   and it has to be accessible afaik
        let con = creep.room.controller;
        if ( target === null || con.ticksToDowngrade < 1000 || con.level < 2) {
            task = function(t) {
                advMove(creep, t, 3);
                return creep.upgradeController(t);
            };
            target = con;
        }

        // If empty, work!
        creep.memory.full = task(target) != ERR_NOT_ENOUGH_ENERGY;
    } else {
        // locate resource
        // - could technically be depleted
        let resource = creep.pos.findClosestByPath(FIND_SOURCES);
        // TODO withDraw energy and work as if full

        // move adjacent to it and mine
        advMove(creep, resource, 1);
        creep.harvest(resource);
        creep.memory.full = total(creep) == creep.carryCapacity;
    }
}

function renewCostMatrix() {
    for ( let i in Game.rooms ) {
        let cur = Game.rooms[i];
        let costs = new PathFinder.CostMatrix;
        cur.find(FIND_STRUCTURES).forEach(function(structure) {
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
        cur.find(FIND_CREEPS).forEach(function(creep) {
            costs.set(creep.pos.x, creep.pos.y, 0xff);
        });
        
        COST[cur.name] = costs;
    }
}

module.exports = {
    run: run,
    SPEC: [WORK, MOVE, MOVE, CARRY, CARRY],
    MINIMAL: [WORK, MOVE, CARRY],
    COST: COST,
    renewCostMatrix: renewCostMatrix
};
