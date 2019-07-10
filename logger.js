'use strict';

var asciiTable = ["NUL", "SOH", "STX", "ETX", "EOT", "ENQ", "ACK", "BEL", "BS", "HT", "LF", "VT", "FF", "CR", "SO", "SI", "DLE", "DC1", "DC2", "DC3", "DC4", "NAK", "SYN", "ETB", "CAN", "EM", "SUB", "ESC", "FS", "GS", "RS", "US"];

var /* boolean */ log = false; // can be enabled by options

exports.disable = function (state) {
    log = !state;
};

exports.println = function (/* String */ a, /* optional String */ b) {
    var s =
        (a === undefined) ? '' :
            (b === undefined) ? a : a + ' ' + b;

    if (log) {
        console.log(s);
        // process.stdout.write(s + '\n'); // node.js
    }

    return s;
};

exports.printChar = function (/* char */ c) {
    if (log) {
        console.log(c);
        // process.stdout.write(c); // node.js
    }

    return c;
};

exports.cout = function (/* int */ c) {
    if (!log) return;
    if (c > 31) exports.printChar(c);
    else {
        exports.printChar("[" + asciiTable[c] + "]");
        //exports.printChar("_");
    }
};
