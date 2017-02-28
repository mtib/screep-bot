let box = require("box");
let con = require("console");
let pl = (s, n) => {return con.padl(s, " ", n);};

function init() {
    if (!Memory.loaded) {
        Memory.loaded = [0];
    }
    RawMemory.setActiveSegments(Memory.loaded);
    if (Memory.CREEPS_STATIC === 0) {
        if (Game.cpu.bucket == 10000) {
            Memory.CREEPS_PER_ROOM += 1;
            Memory.CREEPS_STATIC = 1000;
        } else if (Game.cpu.bucket < 7000) {
            Memory.CREEPS_PER_ROOM -= 1;
            Memory.CREEPS_STATIC = 2000;
        }
    } else if (Memory.CREEPS_STATIC > 0) {
        Memory.CREEPS_STATIC -= 1;
    }
}

function cleanMemory(ticks) {
    let membox = new box.Box();
    membox.addHeadline("CLEAN");
    let memcdel = 0;
    let carr = [];
    for ( let cn in Game.creeps ) {
        carr.push(Game.creeps[cn]);
    }
    let cids = carr.map((c) => {return c.id;});
    let cnams = carr.map((c) => {return c.name;});
    for ( let subc in Memory.creeps ) {
        if ( cnams.indexOf(subc) == -1 ) {
            delete Memory.creeps[subc];
            if (Memory.creeps[subc]) {
                delete Memory.blocked[Memory.creeps[subc].id];
            }
            memcdel += 1;
        }
    }
    membox.addLineRaw("<b>Deleted Creeps:</b>       " + pl(memcdel,4));
    if (Memory.blocked) {
        let blockdel = 0;
        let blockdec = 0;
        let creepdel = 0;
        for ( let cid in Memory.blocked ) {
            let empty = true;
            for ( let sid in Memory.blocked[cid] ) {
                empty = false;
                let nv = Memory.blocked[cid][sid] - ticks;
                if (nv <= 0) {
                    delete Memory.blocked[cid][sid];
                    blockdel += 1;
                } else {
                    Memory.blocked[cid][sid] = nv;
                    blockdec += 1;
                }
            }
            if ( empty || cids.indexOf(cid) == -1 ) {
                delete Memory.blocked[cid];
                creepdel += 1;
            }
        }
        membox.addLineRaw("<b>Decreased Blocks:</b>     " + pl(blockdec,4));
        membox.addLineRaw("<b>Deleted Blocks:</b>       " + pl(blockdel,4));
        membox.addLineRaw("<b>Deleted Creep Blocks:</b> " + pl(creepdel,4));
        membox.print();
    }
}

function deserialize() {
    let b = Memory.blocks;
    let c = Memory.creeps;
    return [b, c];
}

function stats() {
    if (!Memory.cpuArr) {
        Memory.cpuArr = [0,0,0,0,0,0,0,0,0,0];
    }

    if (Game.time % 3 === 0) {
        let sum = 0;
        Memory.cpuArr.shift();
        Memory.cpuArr.push(Game.cpu.getUsed());
        Memory.cpuArr.forEach(function(c) {
            sum += c;
        });
        Memory.cpuAvg = sum / Memory.cpuArr.length;
    }
}

module.exports = {
    clean: cleanMemory,
    deserialize: deserialize,
    stats: stats,
    init: init
};
