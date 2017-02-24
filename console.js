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



module.exports = {
    log: function(s) {
        console.log("<span style='font-family:hasklig;'>" + escapeHtml(s) + "</span>");
    },
    raw: function(s) {
        console.log("<span style='font-family:hasklig;'>" + s + "</span>");
    },
    font: function(f) {
        console.log(this.famend(f));
    },
    famend: function(f) {
        return "<style>*{font-family:" + f + ";}</style>";
    },
    logObj: function(obj) {
        console.log(JSON.stringify(obj));
    },
    escape: escapeHtml
};