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

//var link = 'https://dd.weather.gc.ca/ensemble/geps/grib2/raw/00/060/CMC_geps-raw_TMP_TGL_2m_latlon0p5x0p5_2019070900_P060_allmbrs.grib2';
//var link = 'https://dd.weather.gc.ca/ensemble/reps/15km/grib2/raw/00/072/CMC-reps-srpe-raw_TMP_TGL_2m_ps15km_2019070900_P072_allmbrs.grib2';

//var link = 'https://dd.weather.gc.ca/model_gem_global/25km/grib2/lat_lon/00/003/CMC_glb_TMP_ISBL_1000_latlon.24x.24_2019070900_P003.grib2';
var link = 'https://dd.weather.gc.ca/model_gem_regional/10km/grib2/18/054/CMC_reg_TMP_TGL_2_ps10km_2019070918_P054.grib2';
//var link = 'https://dd.weather.gc.ca/model_hrdps/continental/grib2/18/006/CMC_hrdps_continental_TMP_TGL_80_ps2.5km_2019070918_P006-00.grib2';

//var link = 'https://dd.weather.gc.ca/model_hrdps/west/grib2/12/006/CMC_hrdps_west_TMP_TGL_2_ps2.5km_2019070912_P006-00.grib2';
//var link = 'https://dd.weather.gc.ca/model_hrdps/east/grib2/12/006/CMC_hrdps_east_TMP_TGL_2_ps2.5km_2019070912_P006-00.grib2';

//var link = 'https://dd.weather.gc.ca/model_wave/ocean/global/grib2/00/CMC_gdwps_global_HTSGW_SFC_0_latlon0.25x0.25_2019070900_P000.grib2';

link = link.replace('https://', 'http://');
link = link.replace('://dd.weather.gc.ca/', '://localhost:3000/');

DATA.numMembers = link.indexOf('ensemble') ?
        21 : // i.e. ensembles
        1; //i.e. deterministic

var BaseFolder = ".";
var TempFolder = BaseFolder + "/temp/";
var OutputFolder = BaseFolder + "/output/";

var myGrid = new GRIB2CLASS(DATA, {
        TempFolder: TempFolder,
        OutputFolder: OutputFolder
});

http.get(link, function (res) {
        var allChunks = [];
        res.on("data", function (chunk) {
                allChunks.push(chunk);
        });
        res.on("end", function () {
                myGrid.parse(Buffer.concat(allChunks));
                console.log(myGrid);
                plot(myGrid);
        });
});

function plot(grid) {
        var i, v;
        var nx = grid.Nx;
        var ny  = grid.Ny;
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
        var canvas = document.getElementById('canvas')
        canvas.width = nx;
        canvas.height = ny;

        var ctx = canvas.getContext('2d')
        var img = ctx.createImageData(nx, ny);

        var q = 0;
        for (i = 0; i < nPoints; i++) {
                var r = ratios[i];
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
                q += 4;
        }

        ctx.putImageData(img, 0, 0);
}
