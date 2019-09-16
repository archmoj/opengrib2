"use strict";

var Plotly = require("plotly.js-dist");

module.exports = function interactivePlot (grid, div, call) {
    call.before();

    var nx = grid.Nx;
    var ny = grid.Ny;

    // let"s start with deterministic data i.e. member 0
    var values = grid.DataValues[0];

    var k = 0;
    var x = new Array(nx);
    var y = new Array(ny);
    var z = new Array(ny);
    for (var j = 0; j < ny; j++) {
        z[j] = new Array(nx);
        for (var i = 0; i < nx; i++) {
            if (grid.TypeOfProjection === 0) { // Latitude/longitude
                var lonLat = grid.getLonLat(i, j);
                x[i] = lonLat[0];
                y[j] = lonLat[1];
            }
            z[j][i] = values[k++];
        }
    }

    var data = [{
        type: "heatmap",
        z: z,
        hovertemplate: "%{z:.1f}K<extra>(%{x}, %{y})</extra>",
        colorscale: [
            [0.0, "rgb(0, 0, 127)"],
            [0.2, "rgb(0, 0, 255)"],
            [0.5, "rgb(255, 255, 255)"],
            [0.8, "rgb(255, 0, 0)"],
            [1.0, "rgb(127, 0, 0)"]
        ],
        colorbar: {
            len: 0.5
        }
    }];

    if (grid.TypeOfProjection === 0) { // Latitude/longitude
        data[0].x = x;
        data[0].y = y;

        data.push({
            type: "scattergeo"
        });
    }

    var title = [
        "TypeOfData: " + grid.meta.TypeOfData,
        "Variable: " + grid.meta.CategoryOfParametersByProductDiscipline
    ].join("<br>");

    var layout = {
        xaxis: {
            visible: false,
            constrain: "domain",
            scaleanchor: "y",
            fixedrange: true
        },
        yaxis: {
            visible: false,
            constrain: "domain",
            scaleratio: 0.5,
            fixedrange: true
        },
        geo: {
            projection: { rotation: { lon: 180 + grid.Lo1 } },
            bgcolor: "rgba(0,0,0,0)",
            dragmode: false
        },
        annotations: [{
            text: title,
            showarrow: false,
            xref: "paper",
            yref: "paper",
            xanchor: "left",
            yanchor: "top",
            x: 0,
            y: 0.9
        }],
        margin: {
            t: 0,
            b: 0
        }
    };

    var config = {
        scrollZoom: false,
        responsive: true,
        modeBarButtons: [["toggleHover"]]
    };

    Plotly.newPlot(div, data, layout, config).then(function (gd) {
        Plotly.d3.select(gd).select("g.geo > .bg > rect").style("pointer-events", null);

        call.after();
    });
};
