let times = {};
let con = require("console");
let legend = {
    "E2": "Timer was ended twice"
};

module.exports = {
    start: (n) => {
        times[n] = {
            start: Game.time,
            end: -1,
            cpu: Game.cpu.getUsed(),
            info: new Set()
        };
        if (!this.maxLength) this.maxLength = 0;
        if (this.maxLength < n.length) this.maxLength = n.length;
    },
    end: (n) => {
        if (times[n].end == -1) {
            times[n].end = Game.time;
            times[n].cpu = Game.cpu.getUsed() - times[n].cpu;
        } else {
            times[n].info.add("E2");
        }
        return times[n].cpu;
    },
    get: (n) => {
        return times[n];
    },
    info: (n, s) => {
        times[n].info.add(s);
    },
    toString: () => {
        let str = "";
        let sum = 0;
        let infos = new Set();
        for ( let key in times ) {
            str += `${con.padr(key+":", " ", this.maxLength+1)} ${con.padl(times[key].cpu.toFixed(2), " ", 5)}`;
            sum += times[key].cpu;
            let warn = [];
            let info = times[key].info.values();
            for (;;) {
                let i = info.next().value;
                if (i) {
                    infos.add(i);
                    warn.push(i);
                } else {
                    break;
                }
            }
            if (warn.length > 0) str += ` ${warn.map((c)=>{return `(${c})`;}).join(", ")}`;
            str += '\n';
        }
        str += `SUM: ${sum.toFixed(2)}\n`;
        if (infos.size > 0) {
            let warn = [];
            infos.forEach((c) => {
                if (legend.hasOwnProperty(c)) {
                    warn.push(`${c}: ${legend[c]}`);
                }
            });
            if (warn.length > 0) str += warn.join(",\n");
        } else {
            str += "no warnings";
        }
        return str;
    }
};
