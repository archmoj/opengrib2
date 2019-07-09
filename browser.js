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

// var link = "test/CMC_hrdps_east_ABSV_ISBL_0700_ps2.5km_2019070912_P000-00.grib2";
// var link = "test/CMC_reg_TMP_TGL_2_ps10km_2019070818_P000.grib2";
var link = "test/CMC_hrdps_east_TMP_TGL_2_ps2.5km_2019070912_P020-00.grib2";
// var link = "http://dd.weather.gc.ca/model_gem_regional/10km/grib2/18/000/CMC_reg_TMP_TGL_2_ps10km_2019070818_P000.grib2";
//var link = "https://nomads.ncep.noaa.gov/cgi-bin/filter_hrrr_2d.pl?file=hrrr.t00z.wrfsfcf00.grib2&lev_2_m_above_ground=on&var_TMP=on&leftlon=0&rightlon=360&toplat=90&bottomlat=-90&showurl=&dir=%2Fhrrr.20190709%2Fconus";
//var link = "./temp/grib2/hrrr.grib2" // should save a NCEP grib2 file from grib filter links here https://nomads.ncep.noaa.gov/

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
