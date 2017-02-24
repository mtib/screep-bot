let manager = require("manager");
let con = require("console");
PathFinder.use(true);

const CREEPS_PER_ROOM = 4;

// manage, so n creeps have a job
manager.manageCreeps(CREEPS_PER_ROOM);

function threshold(val, arr, cols) {
    let ret = cols.length-1;
    arr.push(-1337);
    arr.every(function(thr, i) {
        ret = i;
        return val > thr;
    });
    return cols[ret];
}

function cspan(s, c) {
    return "<span style='color:" + c + ";'>" + s + "</span>";
}

if (!Memory["cpuArr"]) {
    Memory.cpuArr = [0,0,0,0,0,0,0,0,0,0];
}

if (Game.time % 3 === 0) {
    let sum = 0;
    Memory.cpuArr.shift();
    Memory.cpuArr.push(Game.cpu.getUsed());
    Memory.cpuArr.forEach(function(c) {
        sum += c;
    })
    Memory.cpuAvg = sum / Memory.cpuArr.length
}

// GAME INFO: (Once a Minute)
if (Game.time % 16 === 0) {
    con.log("### INFO ###");
    
    // CPU info
    let used = Math.round(Memory.cpuAvg);
    let ucpuc = threshold(used, [2.0*Game.cpu.tickLimit/3.0, Game.cpu.tickLimit], ["green", "yellow", "red"])
    let tlimc = threshold(Game.cpu.tickLimit, [100, 350], ["red", "yellow", "green"]);
    let buckc = threshold(Game.cpu.bucket, [1000, 8000], ["red", "yellow", "green"]);
    con.raw("# <b>CPU:</b> " + cspan(used, ucpuc) + "/" + Game.cpu.limit);
    con.raw("# <b>Burst:</b> " + cspan(Game.cpu.tickLimit, tlimc) + "/" + cspan(Game.cpu.bucket, buckc));
    
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
                break
        }
        repl += "<b style='color:" + col + ";'>";
        for ( var j = perdec; j > 0; j-- ) {
            repl += "#";
        }
        repl += "</b><span style='color:grey'>";
        for ( var j = perdec; j < 10; j++ ) {
            repl += "-";
        }
        repl += "</span>]=" + percent + "% | ";
        repl += r.find(FIND_MY_CREEPS).length + " / " + CREEPS_PER_ROOM + " Creeps"
        con.raw("# " + repl);
        r.find(FIND_MY_CREEPS).forEach(function(c) {
            let cinfo = [];
            for (let t in c.carry) {
                cinfo.push(c.carry[t] + " " + t);
            }
            con.raw("# -> " + c.name + " (" + cinfo.join(", ") + ")");
        })
        con.log("### #### ###");
        con.font("hasklig, Fira Code, monospace");
    }
}
