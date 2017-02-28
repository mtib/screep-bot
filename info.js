let con = require("console");
let box = require("box");

function threshold(val, arr, cols) {
    let ret = cols.length-1;
    arr.push(-1 * Infinity);
    arr.every((thr, i) => {
        ret = i;
        return val > thr;
    });
    return cols[ret];
}

cspan = con.color;

function info() {
    let b = new box.Box();
    b.addHeadline(" CPU ");

    // CPU info
    let used = Math.round(Memory.cpuAvg);
    let ucpuc = threshold(used, [2.0*Game.cpu.tickLimit/3.0, Game.cpu.tickLimit], ["green", "yellow", "red"]);
    let tlimc = threshold(Game.cpu.tickLimit, [100, 350], ["red", "yellow", "green"]);
    let buckc = threshold(Game.cpu.bucket, [1000, 8000], ["red", "yellow", "green"]);
    b.addLineRaw("<b>Ticks:</b> " + con.padl(con.color(used, ucpuc), " ", 3) + "/" + Game.cpu.limit + con.color(" (avg)", "grey") + " |");
    b.addLineRaw("<b>Burst:</b> " + con.padl(con.color(Game.cpu.tickLimit, tlimc), " ", 3) + "/500" + con.n(" ", 6) + "| <b>Bucket:</b> " + cspan(Game.cpu.bucket, buckc) + "/10000");
    b.addHeadline("ROOMS");

    // Per room info
    for ( var i in Game.rooms ) {
        var r = Game.rooms[i];
        var cur = r.energyAvailable;
        var max = r.energyCapacityAvailable;
        var perdec = Math.round(cur/max * 10);
        var percent = Math.round(cur/max*100);
        for ( var j = 0; j < 2-Math.floor(Math.log10(percent)); j++ ) {
            percent = " " + percent;
        }

        var repl = "<b>Room(" + r.name + "):</b> [";
        let col = "#FF00FF";
        switch (true) {
            case perdec < 3:
                col = "red";
                break;
            case perdec > 7:
                col = "green";
                break;
            default:
                col = "yellow";
                break;
        }
        repl += "<b style='color:" + col + ";'>";
        for ( let j = perdec; j > 0; j-- ) {
            repl += "#";
        }
        repl += "</b><span style='color:grey'>";
        for ( let j = perdec; j < 10; j++ ) {
            repl += "-";
        }
        repl += "</span>]=" + percent + "% ";
        repl += "(" + r.find(FIND_MY_CREEPS).length + " creeps)";
        b.addLineRaw(repl);
        let cmax = 0;
        let tmax = 0;
        let ttl = {};
        r.find(FIND_MY_CREEPS).forEach((c, i, a) => { //jshint ignore: line
            let iscript = con.padl(c.memory.used.toFixed(1), " ", 4);
            if (cmax === 0) {
                a.forEach((c) => {
                    cmax = Math.max(con.reduce(c.name).length, cmax);
                    ttl[c.id] = "" + Math.floor(c.ticksToLive / 16.0);
                    tmax = Math.max(ttl[c.id].length, tmax);
                });
            }
            let cinfo = [];
            for (let t in c.carry) {
                if (c.carry[t] !== 0) cinfo.push(c.carry[t] + " " + t);
            }
            let ctxt = "";
            if ( cinfo.length > 0 ) {
                ctxt = " (" + cinfo.join(", ") + ")";
            }
            ctxt = con.padl(ctxt, " ", 13);
            ctxt = "[<i style='color:grey;'>" + con.padl(ttl[c.id], "0", tmax) + "m</i>]" + ctxt;
            let cpad = con.padr(c.name, " ", cmax+1);
            if ( i < a.length -1) {
                b.addLineRaw(" ├── " + cpad + ctxt + iscript);
            } else {
                b.addLineRaw(" └── " + cpad + ctxt + iscript);
            }
        }); // end CREEPS in ROOM
        let Whits = 0;
        let b2 = new box.Box();
        b2.addHeadline("DECAY");
        r.find(FIND_STRUCTURES).filter((s) =>{
            return s.hits < 500 && s.hits > 0;
        }).sort((s1, s2) => {
            return s1.hits - s2.hits;
        }).forEach((s) => { // jshint ignore:line
            r.visual.circle(s.pos, {fill:"transparent", stroke:"#FF0000", strokeWidth:0.2, radius:0.5});
            b2.addLine(s.structureType + " (" + con.padl(s.pos.x, " ", 2) + ", " + con.padl(s.pos.y, " ", 2) + ") - " + con.padl(s.hits, " ", 3) + "hp");
            Whits += 1;
        });
        if (Whits > 0) {
            b.addBox(b2);
        }
    } // end ROOMS
    b.compile();
    b.print();
    RawMemory.segments[0] = b.toReducedArray().join('\n');
    b.showInAllRooms();
}

module.exports = {
    info: info
};
