let manager = require("manager");
let mem = require("memory");
PathFinder.use(true);

const CREEPS_PER_ROOM = 7;
const TPM = 16;

mem.init();
mem.deserialize();
manager.manageCreeps(CREEPS_PER_ROOM);
mem.stats();

// GAME INFO: (Once a Minute)
if (Game.time % TPM === 1) {
    let info = require("info");
    mem.clean(TPM);
    info.info();
} else if (RawMemory.segments[0]) {
    let box = require("box");
    box.fromJSON(RawMemory.segments[0]).showInAllRooms();
}

function drawPie(visual, val, max, title, color, num) {
    let p = val / max;
    let r = 1; // radius
    let center = {x: 1.9, y: 2 + num * r * 4.5};
    visual.circle(center, {
        radius: r + 0.1,
        fill: 'rgba(0,0,0,1)',
        stroke: 'rgba(255,255,255,0.8)'
    });
    let poly = [center];
    let surf = 2 * Math.PI * p;
    let offs = -Math.PI / 2;
    for ( let i = offs; i <= surf + offs; i += Math.PI / 64) {
        poly.push({
            x: center.x + Math.cos(i),
            y: center.y + Math.sin(i)
        });
    }
    poly.push(center);
    visual.poly(poly, {
        fill: color,
        opacity: 1,
        stroke: color,
        strokeWidth: 0.05
    });
    let yoff = 0.7;
    if ( 0.35 < p && p < 0.65 ) yoff += 0.3;
    visual.text(title, center.x, center.y + r + yoff, {
        color: 'white',
        font: '0.6 monospace',
        align: 'center'
    });
    let lastpol = poly[poly.length-2];
    visual.text(""+Math.round(p*100)+"%", lastpol.x + (lastpol.x - center.x)*0.7, lastpol.y + (lastpol.y - center.y)*0.4, {
        color: 'white',
        font: '0.4 monospace',
        align: 'center'
    });
}

for (let rn in Game.rooms) {
    let room = Game.rooms[rn];
    let val = room.energyAvailable;
    let max = room.energyCapacityAvailable;
    drawPie(room.visual, val, max, "Energy", "#FFDF2E", 0);
    drawPie(room.visual, room.find(FIND_MY_CREEPS).length, CREEPS_PER_ROOM, "Creeps", "#25DA13", 1);
}

drawPie(new RoomVisual(), Game.cpu.bucket, 10000, "Bucket", "#197DF0", 2);
drawPie(new RoomVisual(), Game.cpu.tickLimit, 500, "Burst", "#FB161B", 3);




