con = require("console")

const LINE = "LINE";
const HEADER = "HEADER";
const CORNERS = "╔╗╚╝";
const SIDES = "═║╠╣";
const SHADOW = "▒";

function Box() {
    this.lines = [];
    this.innerWidth = 0;
    
    this.addOfType = function(s, t) {
        let reduced = s.replace(/<.*?>/gi, "");
        let len = reduced.length;
        if (len > this.innerWidth) this.innerWidth = len;
        this.lines.push({
            type: t,
            reduced: reduced,
            raw: s,
            length: len
        });
    };
    
    n = function(s, m) {
        let r = "";
        for (let i = 0; i < m; i++) {
            r += s;
        }
        return r;
    }
    
    this.addLine = function(str) {
        this.addLineRaw(con.escape(str));
    };
    
    this.addLineRaw = function(str) {
        if (this.lines.length === 0) {
            this.addHeadlineRaw(str);
            return;
        }
        this.addOfType(str, LINE);
    };
    
    this.addHeadline = function(str) {
        this.addHeadlineRaw(con.escape(str));
    };
    
    this.addHeadlineRaw = function(str) {
        this.addOfType(str, HEADER);
    };
    
    this.print = function() {
        this.toStringArray().forEach(function(line) {
            con.raw(line);
        })
    };
    
    this.toStringArray = function() {
        if (this.lines.length === 0) {
            return [];
        }
        let lines = this.lines.slice(0);
        let outarr = [];
        let iw = this.innerWidth;
        let invert = function(s) {
            return "<b style='color:black;background-color:lightgrey;'> " + s +" </b>";
        }
        
        let first = lines.shift();
        outarr.push(CORNERS[0] + n(SIDES[0], 3) + "╡" + invert(first.raw) + "╞" + n(SIDES[0], iw - 5 - first.length) + CORNERS[1]);
        
        lines.forEach(function(line) {
            if (line.type == HEADER) {
                outarr.push(SIDES[2] + n(SIDES[0], 3) + "╡" + invert(line.raw) + "╞" + n(SIDES[0], iw - 5 - line.length) + SIDES[3] + SHADOW);
            } else if (line.type == LINE) {
                outarr.push(SIDES[1] + " " + line.raw + n(" ", iw - line.length + 1) + SIDES[1] + SHADOW);
            }
        })
        outarr.push(CORNERS[2] + n(SIDES[0], iw + 2) + CORNERS[3] + SHADOW);
        outarr.push(" " + n(SHADOW, iw + 4));
        return outarr;
    }
    
    this.addBox = function(b) {
        let o = this;
        b.toStringArray().forEach(function(l, i, a) {
            if ( i == a.length-1 ) return;
            o.addLineRaw(l.replace(/▒/g, ""));
        })
    }
}

module.exports = {
    Box: Box
};