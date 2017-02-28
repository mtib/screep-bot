// filter for red flags
function isDismantleFlag(flag) {
    return flag.color == COLOR_RED;
}

// whether or not there would be something
// to do for a builder bot
function demand(room) {
    return room.find(FIND_FLAGS, isDismantleFlag) !== null;
}

// helper function
// looks through an object received by lookAt(..)
function has(d, typ) {
    for ( var i in d ) {
        if ( d[i].type == typ ) {
            return true;
        }
    }
    return false;
}

// helper function
// return the structure of a lookAt(..) object
function getStructure(d) {
    for ( var i in d ) {
        if ( d[i].type == "structure" ) {
            return d[i];
        }
    }
    return null;
}

// send message to console every time the
// message is new
function msg(creep, message) {
    if ( creep.memory.message == message ) {
        return;
    }
    creep.memory.message = message;
    console.log(creep.name + " " + message);
}

// repair "broken" structures
function repair(creep) {
   return false;
}

// interface function
// returns whether or not creep has a job
function run(creep) {
    // look for red flags
    target = creep.pos.findClosestByPath(FIND_FLAGS, isDismantleFlag);

    // TODO check if this works
    if (creep.ticksToLive === 0) {
        // save space
        delete creep.memory.message;
    }

    if ( repair(creep) ) {
        return true;
    }

    // no flags -> become a builder!
    if (target === null) {
        return false;
    }

    // get objects at the red flag
    var obj = creep.room.lookAt(target);

    // decide what to do, depending on what you see
    if ( has(obj, "terrain") ) {
        // you can't destroy terrain
        target.remove();
    } else if ( has(obj, "structure") ) {
        // user built structures
        // - dismantle for materials
        creep.moveTo(target);
        msg(creep, "will dismantle structure at " + target.name);
        creep.dismantle(getStructure(obj));
    } else {
        // nothing there (anymore)
        msg(creep, "will remove the flag: " + target.name);
        target.remove();
    }
    return true;
}

module.exports = {
    run: run,
    demand: demand,
    SPEC: [MOVE, CARRY, ATTACK, WORK]
};
