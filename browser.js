'use strict';

var http = require("http");

var GRIB2CLASS = require('./grib2class');

var allDomains = require('./domains')();

var ParameterLevel = require('./parameter_level')();

var DATA = {
        ModelYear: -1,
        ModelMonth: -1,
        ModelDay: -1,

        ModelRun: -1,
        ModelTime: -1, // i.e. forecast hour
        ModelBegin: -1,
        ModelStep: -1,
        ModelEnd: -1,

        numLevels: -1,
        numLayers: -1,
        numMembers: -1,
        numTimes: -1, // download n grib2 files in front

        allLayers: [],
        allLevels: [],
        allDomains: allDomains,
        ParameterLevel: ParameterLevel,

        Filename: "prototype"
};

//var link = 'https://dd.weather.gc.ca/model_gem_global/25km/grib2/lat_lon/00/003/CMC_glb_TMP_ISBL_1000_latlon.24x.24_2019070900_P003.grib2';
//var link = 'https://dd.weather.gc.ca/model_hrdps/west/grib2/12/006/CMC_hrdps_west_TMP_TGL_2_ps2.5km_2019070912_P006-00.grib2';
//var link = 'https://dd.weather.gc.ca/model_hrdps/continental/grib2/18/006/CMC_hrdps_continental_TMP_TGL_80_ps2.5km_2019070918_P006-00.grib2';
var link = 'https://dd.weather.gc.ca/model_wave/ocean/global/grib2/00/CMC_gdwps_global_HTSGW_SFC_0_latlon0.25x0.25_2019070900_P000.grib2';

link = link.replace('https://dd.weather.gc.ca/', 'http://localhost:3000/')
DATA.numMembers = 1; // i.e. deterministic

var BaseFolder = ".";
var TempFolder = BaseFolder + "/temp/";
var OutputFolder = BaseFolder + "/output/";

var myGrid = new GRIB2CLASS(DATA, {
        TempFolder: TempFolder,
        OutputFolder: OutputFolder
});

function plot(grid) {
        var i, v;
        var canvas = document.getElementById('canvas')
        var ctx = canvas.getContext('2d')
        var nx = grid.Nx;
        var ny  = grid.Ny;
        var nPoints = nx * ny;
        canvas.width = nx;
        canvas.height = ny;

        var values = grid.DataValues[0];

        var min = Infinity;
        var max = -Infinity;
        for (i = 0; i < nPoints; i++) {
                v = values[i];
                if(min > v) min = v;
                if(max < v) max = v;
        }

        var img = ctx.createImageData(nx, ny);

        var q = 0;
        for (i = 0; i < nPoints; i++) {
                v = values[i];
                var c = 255 * (v - min) / (max - min);
                img.data[q++] = c;
                img.data[q++] = c;
                img.data[q++] = c;
                img.data[q++] = 255;
        }
        ctx.putImageData(img, 0, 0);
}

http.get(link, function (res) {
        var allChunks = [];
        res.on("data", function (chunk) {
                allChunks.push(chunk);
        });
        res.on("end", function () {
                myGrid.parse(Buffer.concat(allChunks));
                plot(myGrid);
        });
});
