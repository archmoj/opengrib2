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

var link = 'https://dd.weather.gc.ca/model_gem_global/25km/grib2/lat_lon/00/003/CMC_glb_TMP_ISBL_1000_latlon.24x.24_2019070900_P003.grib2'
link = link.replace('https://dd.weather.gc.ca/', 'http://localhost:3000/')
DATA.numMembers = 1; // i.e. deterministic

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
        });
});
