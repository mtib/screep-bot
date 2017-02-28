con = require("console");

const LINE = "LINE";
const HEADER = "HEADER";
const CORNERS = "╔╗╚╝";
const SIDES = "═║╠╣";
const SHADOW = "░";

let n = con.n;
let reduce = con.reduce;

function Box() {
    this.lines = [];
    this.innerWidth = 0;

    this.addOfType = (s, t) => {
        let reduced = reduce(s);
        let len = reduced.length;
        if (len > this.innerWidth) this.innerWidth = len;
        this.lines.push({
            type: t,
            reduced: reduced,
            raw: s,
            length: len
        });
    };

    this.addLine = (str) => {
        this.addLineRaw(con.escape(str));
    };

    this.addLineRaw = (str) => {
        if (this.lines.length === 0) {
            this.addHeadlineRaw(str);
            return;
        }
        this.addOfType(str, LINE);
    };

    this.addHeadline = (str) => {
        this.addHeadlineRaw(con.escape(str));
    };

    this.addHeadlineRaw = (str) => {
        this.addOfType(str, HEADER);
    };

    this.print = () => {
        this.toStringArray().forEach((line) => {
            con.raw(line);
        });
        con.font("hasklig, Fira Code, monospace");
    };

    this.toStringArray = () => {
        if (this.lines.length === 0) {
            return [];
        }
        let lines = this.lines.slice(0);
        let outarr = [];
        let iw = this.innerWidth;
        let invert = (s) => {
            return "<b style='color:black;background-color:lightgrey;'> " + s +" </b>";
        };

        let first = lines.shift();
        outarr.push(CORNERS[0] + n(SIDES[0], 3) + "╡" + invert(first.raw) + "╞" + n(SIDES[0], iw - 5 - first.length) + CORNERS[1] + " ");

        lines.forEach((line) => {
            if (line.type == HEADER) {
                outarr.push(SIDES[2] + n(SIDES[0], 3) + "╡" + invert(line.raw) + "╞" + n(SIDES[0], iw - 5 - line.length) + SIDES[3] + SHADOW);
            } else if (line.type == LINE) {
                outarr.push(SIDES[1] + " " + line.raw + n(" ", iw - line.length + 1) + SIDES[1] + SHADOW);
            }
        });
        outarr.push(CORNERS[2] + n(SIDES[0], iw + 2) + CORNERS[3] + SHADOW);
        outarr.push(" " + n(SHADOW, iw + 4));
        return outarr;
    };
    
    this.compile = () => {
        this.lines = this.toStringArray();
        this.reduced = this.lines.map((c)=>{return c}).splice(0, this.lines.length-1).map(reduce);
        this.toStringArray = () => { return this.lines };
        this.toReducedArray = () => { return this.reduced };
    };

    this.addBox = (b) => {
        let o = this;
        b.toStringArray().forEach((l, i, a) => {
            if ( i == a.length-1 ) return;
            o.addLineRaw(l.replace(SHADOW, ""));
        });
    };
    
    this.toReducedArray = () => {
        let lines = this.toStringArray();
        return lines.splice(0, lines.length-1).map(reduce);
    };
    
    this.useVisual = (rv, x=48, y=1, align="right") => {
        let txt = this.toReducedArray();
        let size = 0.6;
        let padding = 0.1;
        let style = {
            font: `${size} monospace`,
            color: 'rgba(255,255,255,1)',
            backgroundColor: 'rgba(0,0,0,0.3)',
            backgroundPadding: padding,
            opacity: 1,
            align: align
        };
        txt.forEach((l, i) => {
            rv.text(l.substring(0, l.length-1), x, y + (2*padding + size) * i, style);
        });
    };
    
    this.showInRoom = (rname, x=48, y=1, align="right") => {
        this.useVisual(new RoomVisual(rname), x, y, align);
    };
    
    this.showInAllRooms = (x=48, y=1, align="right") => {
        this.useVisual(new RoomVisual(), x, y, align);
    };
    
}

module.exports = {
    Box: Box,
    fromJSON: (txt) => {
        let obj = JSON.parse(txt);
        let b = new Box();
        b.innerWidth = obj.innerWidth;
        b.lines = obj.lines;
        return b;
    },
    fromMemory: (txt) => {
        // Box is not editable after this
        let b = new Box();
        b.compile();
        b.reduced = txt.split("\n");
        b.toStringArray = () => {return b.reduced};
        return b;
    }
};
