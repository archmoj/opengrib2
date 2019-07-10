'use strict';

var asciiTable = ["NUL", "SOH", "STX", "ETX", "EOT", "ENQ", "ACK", "BEL", "BS", "HT", "LF", "VT", "FF", "CR", "SO", "SI", "DLE", "DC1", "DC2", "DC3", "DC4", "NAK", "SYN", "ETB", "CAN", "EM", "SUB", "ESC", "FS", "GS", "RS", "US"];

var /* boolean */ log = false; // can be enabled by options

exports.disable = function (state) {
    log = !state;
};

exports.println = function (/* String */ a, /* optional String */ b) {
    if (!log) return;
    var s =
        (a === undefined) ? '' :
            (b === undefined) ? a : a + ' ' + b;

    console.log(s);
    // process.stdout.write(s + '\n'); // node.js
};

exports.print = function (/* char */ c) {
    if (!log) return;

    console.log(c);
    // process.stdout.write(c); // node.js
};

exports.cout = function (/* int */ c) {
    if (!log) return;
    if (c > 31) this.print(c);
    else {
        this.print("[" + asciiTable[c] + "]");
        //print("_");
    }
};
