function init() {
    RoomPosition.prototype.toString = function (htmlLink = true) {
        if (htmlLink) {
            return `<a href="#!/room/${ this.roomName }">[${ this.roomName } ${ this.x },${ this.y }]</a>`;
        }
        return `[${ this.roomName } ${ this.x },${ this.y }]`;
    };
}

module.exports = {
    init: init
};