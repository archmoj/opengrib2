"use strict";

module.exports = function basicPlot (grid, canvas, call) {
    call.before();

    var i, v;
    var nx = grid.Nx;
    var ny = grid.Ny;
    var nPoints = nx * ny;
    var nMembers = grid.DataValues.length; // actual values are here in correct scale - undefined values are NaN!

    // compute ratios
    var ratios = [];
    for (var m = 0; m < nMembers; m++) {
        var values = grid.DataValues[m];

        var min = Infinity;
        var max = -Infinity;
        for (i = 0; i < nPoints; i++) {
            v = values[i];
            if (isNaN(v)) continue;

            if (min > v) min = v;
            if (max < v) max = v;
        }

        for (i = 0; i < nPoints; i++) {
            v = values[i];
            if (isNaN(v)) continue;

            if (ratios[i] === undefined) ratios[i] = 0;
            ratios[i] += (v - min) / (max - min) / nMembers;
        }
    }

    // display
    canvas.width = nx;
    canvas.height = ny;
    var ctx = canvas.getContext("2d");
    var img = ctx.createImageData(nx, ny);

    var p = 0;
    for (i = 0; i < nPoints; i++) {
        var r = ratios[i];
        var q = 4 * (p++);
        if (r === undefined) {
            img.data[q + 0] = 127;
            img.data[q + 1] = 127;
            img.data[q + 2] = 127;
            img.data[q + 3] = 127;
        } else {
            img.data[q + 0] = 255 * r;
            img.data[q + 1] = 0;
            img.data[q + 2] = 255 * (1 - r);
            img.data[q + 3] = 255;
        }
    }

    ctx.putImageData(img, 0, 0);

    call.after();
};
