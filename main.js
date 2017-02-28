// FLAGS
let visuals = Game.cpu.bucket > 200;
// END FLAGS

// IMPORTS
let profiler = require("profiler");
profiler.start("imports");
let box = require("box");
let con = require("console");
let mem = require("memory");
let proto = require("proto");
let manager = require("manager");
profiler.end("imports");
// END IMPORTS

// CONSTS
const TPM = 16;
if(!Memory.CREEPS_PER_ROOM) {
    Memory.CREEPS_PER_ROOM = 6;
    Memory.CREEPS_STATIC = 0;
}
// END CONSTS

// INITS
PathFinder.use(true);
proto.init();
mem.init();
// END INITS

// MANAGE CREEPS
profiler.start("manager");
manager.manageCreeps(Memory.CREEPS_PER_ROOM, profiler);
profiler.end("manager");
// END MANAGE CREEPS

// To help fill the bucket visuals should not
// be drawn on a low bucket value.
if (!visuals) {
    Memory.CREEPS_PER_ROOM = 6;
    con.log(profiler.toString());
    con.log("skipping visuals (empty bucket: "+con.padl(Game.cpu.bucket," ",3)+")", "#FF6767");
    return;
}

mem.stats();

// GAME INFO: (Once a Minute)
profiler.start("info");
if (Game.time % TPM === 0) {
    let info = require("info");
    mem.clean(TPM);
    info.info();
} else if (RawMemory.segments[0]) {
    box.fromMemory(RawMemory.segments[0]).showInAllRooms();
}
profiler.end("info");

function drawPie(visual, val, max, title, color, num, inner=null) {
    if (!inner) {
        inner = val;
    }
    let p = 1;
    if (max !== 0) {
        p = val / max;
    }
    let r = 1; // radius
    let center = {x: 1.9, y: 2 + num * r * 4.5};
    visual.circle(center, {
        radius: r + 0.1,
        fill: 'rgba(0,0,0,1)',
        stroke: 'rgba(255,255,255,0.8)'
    });
    let poly = [center];
    let tau = 2 * Math.PI;
    let surf = tau * (p + 0.01);
    let offs = - Math.PI / 2;
    let step = tau / 24;
    for ( let i = 0; i <= surf; i += step) {
        poly.push({
            x: center.x + Math.cos(i+offs),
            y: center.y - Math.cos(i)
        });
    }
    poly.push(center);
    visual.poly(poly, {
        fill: color,
        opacity: 1,
        stroke: color,
        strokeWidth: 0.05
    });
    visual.text(con.sho(inner), center.x, center.y+0.33, {
        color: 'white',
        font: '1 monospace',
        align: 'center',
        stroke: 'rgba(0,0,0,0.8)',
        strokeWidth: 0.08
    });
    let yoff = 0.7;
    if ( 0.35 < p && p < 0.65 ) yoff += 0.3;
    visual.text(title, center.x, center.y + r + yoff, {
        color: 'white',
        font: '0.6 monospace',
        align: 'center'
    });
    let lastpol = poly[poly.length-2];
    visual.text(""+Math.floor(p*100)+"%", lastpol.x + (lastpol.x - center.x)*0.7, lastpol.y + (lastpol.y - center.y)*0.4 + 0.1, {
        color: 'white',
        font: '0.4 monospace',
        align: 'center'
    });
}

profiler.start("visuals");
let sMax = 0;
let sFul = 0;
let objs = 0;
let cconst = (s) => {
    sMax += s.progressTotal;
    sFul += s.progress;
    objs += 1;
};

let hurt = (s) => {return s.hits < Math.min(3000, s.hitsMax);};

let churt = (s) => {
    sMax += Math.min(3000, s.hitsMax);
    sFul += s.hits;
    objs += 1;
};

for (let rn in Game.rooms) {
    let room = Game.rooms[rn];
    let val = room.energyAvailable;
    let max = room.energyCapacityAvailable;
    drawPie(room.visual, val, max, "Energy", "#FFDF2E", 0);
    let numc = room.find(FIND_MY_CREEPS).length;
    drawPie(room.visual, numc, Memory.CREEPS_PER_ROOM, "Creeps", "#25DA13", 1, numc);
    sMax = 0;
    sFul = 0;
    objs = 0;
    room.find(FIND_MY_CONSTRUCTION_SITES).forEach(cconst);
    room.find(FIND_STRUCTURES, {
        filter: hurt
    }).forEach(churt);
    drawPie(room.visual, sFul, sMax, "Build", "#B3B3B3", 4, objs);
    drawPie(room.visual, room.controller.progress, room.controller.progressTotal, "Upgrade", "#FF3DD0", 5, room.controller.level);
}

drawPie(new RoomVisual(), Game.cpu.bucket, 10000, "Bucket", "#197DF0", 2);
drawPie(new RoomVisual(), Game.cpu.tickLimit, 500, "Burst", "#FB161B", 3);
drawPie(new RoomVisual(), Game.gcl.progress, Game.gcl.progressTotal, "GCL", "#00EDFF", 6, Game.gcl.level);
profiler.end("visuals");

// PRINT PROFILER
profiler.start("profiler");
let prof = new box.Box();
prof.addHeadline("PROFILER");
let iblines = -1;
let step = 4;
for (let last=step; last!=step-1; last=RawMemory.segments[0].indexOf('\n',last)+step) {
    iblines += 1;
}
profiler.end("profiler");
profiler.toString().split("\n").forEach((l) => {
    prof.addLineRaw(l);
});

prof.showInAllRooms(48, iblines);
// END PRINT PROFILER

// TODO line graphs for CPU, Energy Harvest
// TODO smart placement of Info Box (!creeps, !structures)


