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
        var z = ratios[i];
        var q = 4 * (p++);
        if (z === undefined) {
            img.data[q + 0] = 127;
            img.data[q + 1] = 127;
            img.data[q + 2] = 127;
            img.data[q + 3] = 127;
        } else {
            var c = colorscale(z);
            img.data[q + 0] = 255 * c.r;
            img.data[q + 1] = 255 * c.g;
            img.data[q + 2] = 255 * c.b;
            img.data[q + 3] = 255 * c.a;
        }
    }

    ctx.putImageData(img, 0, 0);

    call.after();
};

function fn (v) {
    return Math.sin(v * Math.PI);
}

function colorscale (ratio) { // 0 to 1
    var v = 2 * ratio - 1; // -1 to +1

    return {
        r: v > 0 ? fn(v) : 0,
        g: 0,
        b: v > 0 ? 0 : fn(-v),
        a: Math.abs(v)
    };
}
