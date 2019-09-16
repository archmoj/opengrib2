"use strict";

var isInteractive = true; // true: using plotly.js | false: without plotly.js - useful e.g. for working with the ensembles
var showConsoleLogs = false;

var basicPlot = isInteractive ? null : require("./basic_plot.js");
var interactivePlot = isInteractive ? require("./interactive_plot.js") : null;

var http = require("http");
var grib2class = require("grib2class");
var grib2links = require("./grib2links");

var JpxImage = require("./jpeg2000/jpx.min.js"); // https://github.com/OHIF/image-JPEG2000/blob/master/dist/jpx.min.js"
var jpeg2000decoder = function (imageBytes) {
    var jpeg2000 = new JpxImage();
    jpeg2000.parse(imageBytes);
    return jpeg2000.tiles[0].items;
};

function getNumMembers (link) {
    return link.indexOf("ensemble") !== -1 ?
        21 : // i.e. ensembles
        1; //i.e. deterministic
}

function getLiveMocks () {
    var deltaTime = 6; // some delay needed for each model run to be available on the web
    var modelTime = new Date();
    modelTime.setHours(modelTime.getHours() - deltaTime);

    return grib2links({
        year: modelTime.getUTCFullYear(),
        month: modelTime.getUTCMonth() + 1, // getUTCMonth returns 0 - 11
        day: modelTime.getUTCDate(),
        hour: Math.floor(modelTime.getUTCHours() / 12) * 12, // most of CMC models are produced at 00Z and 12Z
        forecastHour: 24 // for now let's pick the forecast at hour 24
    });
}

function getLocalMocks () {
    return [
        "./grib2/CMC_glb_TMP_TGL_2_latlon.24x.24_2019081112_P024.grib2",
        "./grib2/CMC_gdwps_global_HTSGW_SFC_0_latlon0.25x0.25_2019081112_P024.grib2",
        "./grib2/CMC_hrdps_west_TMP_TGL_2_ps2.5km_2019081112_P024-00.grib2",
        "./grib2/CMC_hrdps_east_TMP_TGL_2_ps2.5km_2019081112_P024-00.grib2",
        "./grib2/CMC_hrdps_continental_TMP_TGL_80_ps2.5km_2019081112_P024-00.grib2",
        "./grib2/CMC_reg_TMP_TGL_2_ps10km_2019081112_P024.grib2",
        "./grib2/CMC-reps-srpe-raw_TMP_TGL_2m_ps15km_2019081112_P024_allmbrs.grib2",
        "./grib2/CMC_geps-raw_TMP_TGL_2m_latlon0p5x0p5_2019081112_P024_allmbrs.grib2"
    ];
}

function echo (txt) {
    if (showConsoleLogs) console.log(txt);
}

echo("process.env.NODE_ENV='" + process.env.NODE_ENV + "'");
var mocks;
switch (process.env.NODE_ENV) {
    case "proxy-data":
        mocks = getLiveMocks();
        echo("Using grib2 data fetched from Datamart using proxy server!");
        break;
    case "local-data":
        mocks = getLocalMocks();
        echo("Using local (already downloaded) grib2 data");
        break;
    default:
        console.error("BAD BUNDLE");
        break;
}

var dropDown = document.getElementById("file-selector");

var createDropDown = function () {
    for (var i in mocks) {
        var opt = document.createElement("option");
        opt.value = mocks[i];
        opt.text = mocks[i];

        dropDown.append(opt);
    }

    dropDown.addEventListener("change", function (e) {
        go(e.target.value);
    });
};

createDropDown();

var loading = document.getElementById("loading");

var enableLoading = function () {
    loading.style.display = "block";
};

var disableLoading = function () {
    loading.style.display = "none";
};

var beforeAfter = {
    before: enableLoading,
    after: disableLoading
};

function go (link) {
    echo("Loading:'" + link + "'");
    enableLoading();

    link = link.replace("https://", "http://");

    if (process.env.NODE_ENV === "proxy-data") {
        link = link.replace("://dd.meteo.gc.ca/", "://localhost:3000/");
        link = link.replace("://dd.weather.gc.ca/", "://localhost:3000/");
    }

    var myGrid = new grib2class({
        numMembers: getNumMembers(link),
        log: false,
        jpeg2000decoder: jpeg2000decoder
    });

    http.get(link, function (res, err) {
        if (err) {
            disableLoading();
        }
        var allChunks = [];
        res.on("data", function (chunk) {
            allChunks.push(chunk);
        });
        res.on("end", function () {
            myGrid.parse(Buffer.concat(allChunks));
            echo(myGrid);

            if (isInteractive) {
                interactivePlot(myGrid, document.getElementById("interactivePlot"), beforeAfter);
            } else {
                basicPlot(myGrid, document.getElementById("basicPlot"), beforeAfter);
            }
        });
    }).on("error", function (err) {
        disableLoading();
        window.alert(err);
    });
}

window.go = go;

go(mocks[0]);
