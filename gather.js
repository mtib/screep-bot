_ = require("lodash");

// used for paths
LINE_STYLE = {
    color: "#AAAAAA",
    width: 0.05,
    opacity: 0.2,
    lineStyle: "dashed"
};

// cpu-heavy moveTo(range) alternative
function advMove(creep, target, r) {
    if ( target === null ) {
        return;
    }
    if ( !creep.pos.inRangeTo(target.pos, r) ) {
        path = creep.pos.findPathTo(target);
        if ( path.length > r) {
            creep.room.visual.line(creep.pos, path[0], LINE_STYLE);
            creep.room.visual.line(path[0], target.pos, LINE_STYLE);
            creep.move(path[0].direction);
        }
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
    var r = creep.transfer(target, RESOURCE_ENERGY, Math.min(creep.carry[RESOURCE_ENERGY], target.energyCapacity - target.energy));
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
        var task = function(t) {
            advMove(creep, t, 1);
            return fillE(creep, t);
        };
        var target = findTarget(creep, FIND_MY_SPAWNS);

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
        // - upgrade Controller
        //   there has to be one in the room
        //   and it has to be accessible afaik
        if ( target === null ) {
            task = function(t) {
                advMove(creep, t, 3);
                return creep.upgradeController(t);
            };
            target = creep.room.controller;
        }

        // If empty, work!
        creep.memory.full = task(target) != ERR_NOT_ENOUGH_ENERGY;
    } else {
        // locate resource
        // - could technically be depleted
        var resource = creep.pos.findClosestByPath(FIND_SOURCES);

        // move adjacent to it and mine
        advMove(creep, resource, 1);
        creep.harvest(resource);
        creep.memory.full = total(creep) == creep.carryCapacity;
    }
}

module.exports = {
    run: run,
    SPEC: [WORK, WORK, MOVE, MOVE, CARRY]
};
