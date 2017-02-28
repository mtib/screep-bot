// thanks to `bjornd`
// http://stackoverflow.com/questions/6234773/can-i-escape-html-special-chars-in-javascript
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function reduceHtml(s) {
    return s
        .replace(/<script.*?>.*?<\/script>/gi, "")
        .replace(/<.*?>/gi, "");
}

function ntimes(s, m) {
    let r = "";
    for (let i = 0; i < m; i++) {
        r += s;
    }
    return r;
}

function padl(s, c, l) {
    let len = reduceHtml("" + s).length;
    for ( let i = 0; i < l-len; i++ ) {
        s = c + s;
    }
    return s;
}

function sho(num) {
    let n  = parseInt(num);
    if (n === null || n.isNaN) {
        return num;
    }
    n = n.toString();
    let ld = Math.log10(num)/3;
    switch (true) {
        case ld < 1:
            return n;
        case ld < 2:
            return n.substring(0, n.length-3) + "k";
        case ld < 3:
            return n.substring(0, n.length-6) + "M";
        case ld < 4:
            return n.substring(0, n.length-9) + "G";
    }
    return num;
}

function padr(s, c, l) {
    let len = reduceHtml("" + s).length;
    for ( let i = 0; i < l-len; i++ ) {
        s = s + c;
    }
    return s;
}

function famend(f) {
    return "<style>*{font-family:" + f + ";}</style>";
}

module.exports = {
    log: (s, color="inherit") => {
        console.log("<span style='font-family:hasklig;color:"+color+";'>" + escapeHtml(s) + "</span>");
    },
    raw: (s) => {
        console.log("<span style='font-family:hasklig;'>" + s + "</span>");
    },
    font: (f) => {
        console.log(famend(f));
    },
    famend: famend,
    logObj: (obj) => {
        console.log(JSON.stringify(obj));
    },
    bold: (s) => {
        return "<b>" + s + "</b>";
    },
    color: (s, c) => {
        return "<span style='color:" + c + ";'>" + s + "</span>";
    },
    reduce: reduceHtml,
    n: ntimes,
    escape: escapeHtml,
    padl: padl,
    padr: padr,
    sho: sho
};
