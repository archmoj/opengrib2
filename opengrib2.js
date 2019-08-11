"use strict";

var http = require("http");
var GRIB2CLASS = require("grib2class");

var isInteractive = true; // could be set to false for non-interactive graphs - useful e.g. for working with the ensembles
var Plotly = (isInteractive) ? require("plotly.js-dist") : null;

var jpeg2000decoder = function (imageBytes) {
        var jpeg2000 = new JpxImage(); // requires https://github.com/OHIF/image-JPEG2000/blob/master/dist/jpx.min.js"
        jpeg2000.parse(imageBytes);
        return jpeg2000.tiles[0].items;
}

var mocks;
var loading = document.getElementById("loading");
var enableLoading = function () {
        loading.style.display = "block";
};
var disableLoading = function () {
        loading.style.display = "none";
};

var deltaTime = 6; // i.e. the delay needed for the input models to be available on the web
var modelTime = new Date();
modelTime.setHours(modelTime.getHours() - deltaTime);

var YEAR = modelTime.getUTCFullYear();
var MONTH = modelTime.getUTCMonth() + 1;
var DAY = modelTime.getUTCDate();
var HOUR = modelTime.getUTCHours();
//console.log(YEAR, MONTH, DAY, HOUR);

HOUR = 12 * Math.floor(HOUR / 12); // most of CMC models are produced at 00Z and 12Z
var HH = String("00" + HOUR).slice(-2);
var MM = String("00" + MONTH).slice(-2);
var DD = String("00" + DAY).slice(-2);
var YYYY = String("0000" + YEAR).slice(-4);
//console.log(YYYY, MM, DD, HH);

var FHR = "024";

var timeStamp = YYYY + MM + DD + HH + "_P" + FHR;

var liveMocks = [
        "https://dd.weather.gc.ca/model_wave/ocean/global/grib2/" + HH + "/CMC_gdwps_global_HTSGW_SFC_0_latlon0.25x0.25_" + timeStamp + ".grib2",
        "https://dd.weather.gc.ca//model_gem_global/25km/grib2/lat_lon/" + HH + "/" + FHR + "/CMC_glb_TMP_TGL_2_latlon.24x.24_" + timeStamp + ".grib2",
        "https://dd.weather.gc.ca/model_hrdps/west/grib2/" + HH + "/" + FHR + "/CMC_hrdps_west_TMP_TGL_2_ps2.5km_" + timeStamp + "-00.grib2",
        "https://dd.weather.gc.ca/model_hrdps/east/grib2/" + HH + "/" + FHR + "/CMC_hrdps_east_TMP_TGL_2_ps2.5km_" + timeStamp + "-00.grib2",
        "https://dd.weather.gc.ca/model_hrdps/continental/grib2/" + HH + "/" + FHR + "/CMC_hrdps_continental_TMP_TGL_80_ps2.5km_" + timeStamp + "-00.grib2",
        "https://dd.weather.gc.ca/model_gem_regional/10km/grib2/" + HH + "/" + FHR + "/CMC_reg_TMP_TGL_2_ps10km_" + timeStamp + ".grib2",
        "https://dd.weather.gc.ca/ensemble/reps/15km/grib2/raw/" + HH + "/" + FHR + "/CMC-reps-srpe-raw_TMP_TGL_2m_ps15km_" + timeStamp + "_allmbrs.grib2",
        "https://dd.weather.gc.ca/ensemble/geps/grib2/raw/" + HH + "/" + FHR + "/CMC_geps-raw_TMP_TGL_2m_latlon0p5x0p5_" + timeStamp + "_allmbrs.grib2"
];

var localMocks = [
        "./grib2/CMC_gdwps_global_HTSGW_SFC_0_latlon0.25x0.25_2019081112_P024.grib2",
        "./grib2/CMC_glb_TMP_TGL_2_latlon.24x.24_2019081112_P024.grib2",
        "./grib2/CMC_hrdps_west_TMP_TGL_2_ps2.5km_2019081112_P024-00.grib2",
        "./grib2/CMC_hrdps_east_TMP_TGL_2_ps2.5km_2019081112_P024-00.grib2",
        "./grib2/CMC_hrdps_continental_TMP_TGL_80_ps2.5km_2019081112_P024-00.grib2",
        "./grib2/CMC_reg_TMP_TGL_2_ps10km_2019081112_P024.grib2",
        "./grib2/CMC-reps-srpe-raw_TMP_TGL_2m_ps15km_2019081112_P024_allmbrs.grib2",
        "./grib2/CMC_geps-raw_TMP_TGL_2m_latlon0p5x0p5_2019081112_P024_allmbrs.grib2"
];

console.log(
        "process.env.NODE_ENV='" +
        process.env.NODE_ENV + "'"
);
switch (process.env.NODE_ENV) {
        case "proxy-data":
                mocks = liveMocks;
                console.log("Using grib2 data fetched from Datamart using proxy server!")
                break;
        case "local-data":
                mocks = localMocks;
                console.log("Using local (already downloaded) grib2 data")
                break;
        default:
                console.error("BAD BUNDLE");
                break;
}

function makeDropDown() {
        var dropDown = document.getElementById("file-selector");
        for (var i in mocks) {
                var opt = document.createElement("option");
                opt.value = mocks[i];
                opt.text = mocks[i];

                dropDown.append(opt);
        }

        dropDown.addEventListener("change", function (e) {
                go(e.target.value);
        });
}

function getNumMembers(link) {
        return link.indexOf("ensemble") !== -1 ?
                21 : // i.e. ensembles
                1; //i.e. deterministic
};

var isGlobal;

function go(link) {
        console.log("Loading:'" + link + "'");
        enableLoading();

        isGlobal =
                link.indexOf("geps") != -1 ||
                link.indexOf("glb") != -1 ||
                link.indexOf("global") != -1;

        link = link.replace("https://", "http://");

        if (process.env.NODE_ENV === "proxy-data") {
                link = link.replace("://dd.meteo.gc.ca/", "://localhost:3000/");
                link = link.replace("://dd.weather.gc.ca/", "://localhost:3000/");
        }

        var myGrid = new GRIB2CLASS({
                numMembers: getNumMembers(link),
                log: false,
                jpeg2000decoder: jpeg2000decoder
        });

        http.get(link, function (res, err) {
                if (err) {
                        loading.style.display = "none";
                }
                var allChunks = [];
                res.on("data", function (chunk) {
                        allChunks.push(chunk);
                });
                res.on("end", function () {
                        myGrid.parse(Buffer.concat(allChunks));
                        console.log(myGrid);

                        if (isInteractive) {
                                interactivePlot(myGrid);
                        }
                        else {
                                basicPlot(myGrid);
                        }
                });
        }).on("error", function (err) {
                disableLoading();
                window.alert(err);
        });
}

function basicPlot(grid) {
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
        var canvas = document.getElementById("basicPlot");
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

        loading.style.display = "none";
}

function interactivePlot(grid) {
        var nx = grid.Nx;
        var ny = grid.Ny;

        // let"s start with deterministic data i.e. member 0
        var values = grid.DataValues[0];

        var k = 0;
        var z = new Array(ny);
        for (var i = 0; i < ny; i++) {
                z[i] = new Array(nx);
                for (var j = 0; j < nx; j++) {
                        z[i][j] = values[k++];
                }
        }

        var data = [{
                type: "heatmap",
                z: z,
                //x: reader.getDataVariable(LON_NAME),
                //y: reader.getDataVariable(LAT_NAME),
                hovertemplate: "%{z:.1f}K<extra>(%{x}, %{y})</extra>",
                colorscale: "Portland",
                colorbar: {
                        len: 0.5
                }
        }];

        if (isGlobal) {
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

        Plotly.newPlot("interactivePlot", data, layout, config)
                .then(function (gd) {
                        Plotly.d3.select(gd).select("g.geo > .bg > rect").style("pointer-events", null);

                        disableLoading();
                });
}

window.go = go;

makeDropDown();

go(mocks[1]);
