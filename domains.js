'use strict';

module.exports = function () {
    return [
        // Note: for hindcast we should use previous date:1981-2010
        //[ "CanSIPS_hindcast", "CanSIPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "ensemble/cansips/grib2/hindcast/raw", "cansips_hindcast_raw", "latlon2.5x2.5", "_allmembers.grib2", "250", "240", "1", "1" ],
        ["CanSIPS_forecast", "CanSIPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "ensemble/cansips/grib2/forecast/raw", "cansips_forecast_raw", "latlon2.5x2.5", "_allmembers.grib2", "250", "240", "1", "1"],

        ["GEPS", "GEPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "ensemble/naefs/grib2/raw", "CMC_naefs-geps-raw", "latlon1p0x1p0", "_allmbrs.grib2", "100", "21", "6", "384"],

        ["REPS", "REPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "ensemble/reps/15km/grib2/raw", "CMC-reps-srpe-raw", "ps15km", "_allmbrs.grib2", "15", "21", "3", "72"],

        ["GDPS", "GDPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_gem_global/25km/grib2/lat_lon", "CMC_glb", "latlon.24x.24", ".grib2", "25", "1", "3", "240"],
        //[ "GDPS", "GDPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_gem_global/66km/grib2/lat_lon", "CMC_glb", "latlon.6x.6", ".grib2", "66", "1", "3", "144" ],
        //[ "GDPS", "GDPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_gem_global/66km/grib2/polar_stereographic", "CMC_glb", "ps30km", ".grib2", "66", "1", "3", "144" ],

        ["RDPS", "RDPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_gem_regional/10km/grib2", "CMC_reg", "ps10km", ".grib2", "10", "1", "3", "54"],

        ["HRDPS_arctic", "HRDPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_hrdps/arctic/grib2", "CMC_hrdps_arctic", "ps2.5km", "-00.grib2", "2.5", "1", "1", "24"],
        ["HRDPS_lancaster", "HRDPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_hrdps/lancaster/grib2", "CMC_hrdps_lancaster", "ps2.5km", "-00.grib2", "2.5", "1", "1", "30"],
        ["HRDPS_maritimes", "HRDPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_hrdps/maritimes/grib2", "CMC_hrdps_maritimes", "ps2.5km", "-00.grib2", "2.5", "1", "1", "48"],
        ["HRDPS_east", "HRDPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_hrdps/east/grib2", "CMC_hrdps_east", "ps2.5km", "-00.grib2", "2.5", "1", "1", "48"],
        ["HRDPS_prairies", "HRDPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_hrdps/prairies/grib2", "CMC_hrdps_prairies", "ps2.5km", "-00.grib2", "2.5", "1", "1", "48"],
        ["HRDPS_west", "HRDPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_hrdps/west/grib2", "CMC_hrdps_west", "ps2.5km", "-00.grib2", "2.5", "1", "1", "48"],
        ["HRDPS_continental", "HRDPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_hrdps/continental/grib2", "CMC_hrdps_continental", "ps2.5km", "-00.grib2", "2.5", "1", "1", "48"],
        ["HRDPS_north", "HRDPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_hrdps/north/grib2", "CMC_hrdps_north", "ps2.5km", "-00.grib2", "2.5", "1", "1", "30"],

        ["GDWPS", "GDWPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_wave/ocean/global/grib2", "CMC_gdwps_global", "latlon0.25x0.25", ".grib2", "25", "1", "3", "48"],

        ["RDWPS_lake_erie", "RDWPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_wave/great_lakes/erie/grib2", "CMC_rdwps_lake-erie", "latlon0.05x0.05", ".grib2", "5", "1", "6", "48"],
        ["RDWPS_lake_huron", "RDWPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_wave/great_lakes/huron/grib2", "CMC_rdwps_lake-huron", "latlon0.05x0.08", ".grib2", "5", "1", "6", "48"],
        ["RDWPS_lake_ontario", "RDWPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_wave/great_lakes/ontario/grib2", "CMC_rdwps_lake-ontario", "latlon0.05x0.08", ".grib2", "5", "1", "6", "48"],
        ["RDWPS_north_atlantic", "RDWPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_wave/ocean/atlantic_north/grib2", "CMC_rdwps_north-atlantic", "latlon0.15x0.15", ".grib2", "5", "1", "6", "48"],
        ["RDWPS_north_pacific", "RDWPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_wave/ocean/pacific_north/grib2", "CMC_rdwps_north-pacific", "latlon0.5x0.5", ".grib2", "40", "1", "6", "48"],
        ["RDWPS_arctic", "RDWPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_wave/ocean/arctic/grib2", "CMC_rdwps_arctic", "latlon0.04x0.08", ".grib2", "5", "1", "6", "48"],
        ["RDWPS_gulf_st_lawrence", "RDWPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_wave/ocean/gulf-st-lawrence/grib2", "CMC_rdwps_gulf-st-lawrence", "latlon0.05x0.05", ".grib2", "5", "1", "6", "48"],

        ["RDPA", "RDPA", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "analysis/precip/rdpa/grib2/polar_stereographic/06", "CMC_RDPA", "ps10km", "000.grib2", "5", "1", "6", "1"],
        //[ "RDPA", "RDPA", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "analysis/precip/rdpa/grib2/polar_stereographic/24", "CMC_RDPA", "ps10km", "000.grib2", "5", "1", "6", "1" ],

        ["HRDPA", "HRDPA", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "analysis/precip/hrdpa/grib2/polar_stereographic/06", "CMC_HRDPA", "ps2.5km", "000.grib2", "5", "1", "6", "1"],
        //[ "HRDPA", "HRDPA", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "analysis/precip/hrdpa/grib2/polar_stereographic/24", "CMC_HRDPA", "ps2.5km", "000.grib2", "5", "1", "6", "1" ],

        //[ "SNOW", "SNOW", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "GRIB", "snow_density_dataset/RDPS", "reg", "", "15", "96", "6", "1" ],
        //[ "SNOW", "SNOW", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "GRIB", "snow_density_dataset/HRDPS", "hrdps-national_west", "", "15", "96", "6", "1" ],
        //[ "SNOW", "SNOW", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "GRIB", "snow_density_dataset/HRDPS", "hrdps-national_prairies", "", "15", "96", "6", "1" ],
        ["SNOW", "SNOW", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "GRIB", "snow_density_dataset/HRDPS", "hrdps-national_east", "", "15", "96", "6", "1"],
        //[ "SNOW", "SNOW", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "GRIB", "snow_density_dataset/HRDPS", "hrdps-national_maritimes", "", "15", "96", "6", "1" ],

        ["SHOP", "SHOP", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "SHOP/data/csv", "CMC_shop-analysis", "Montreal-TroisRivieres", "000.csv", "1", "1", "24", "0"],
        //[ "SHOP", "SHOP", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "SHOP/data/csv", "CMC_shop-analysis", "Montreal-TroisRivieres-Assomption", "000.csv", "1", "1", "24", "0" ],
        //[ "SHOP", "SHOP", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "SHOP/data/csv", "CMC_shop-analysis", "Montreal-TroisRivieres-DuLoup", "000.csv", "1", "1", "24", "0" ],
        //[ "SHOP", "SHOP", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "SHOP/data/csv", "CMC_shop-analysis", "Montreal-TroisRivieres-GreatLakes", "000.csv", "1", "1", "24", "0" ],
        //[ "SHOP", "SHOP", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "SHOP/data/csv", "CMC_shop-analysis", "Montreal-TroisRivieres-Maskinonge", "000.csv", "1", "1", "24", "0" ],
        //[ "SHOP", "SHOP", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "SHOP/data/csv", "CMC_shop-analysis", "Montreal-TroisRivieres-Mip", "000.csv", "1", "1", "24", "0" ],
        //[ "SHOP", "SHOP", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "SHOP/data/csv", "CMC_shop-analysis", "Montreal-TroisRivieres-Nicolet", "000.csv", "1", "1", "24", "0" ],
        //[ "SHOP", "SHOP", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "SHOP/data/csv", "CMC_shop-analysis", "Montreal-TroisRivieres-Richelieu", "000.csv", "1", "1", "24", "0" ],
        //[ "SHOP", "SHOP", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "SHOP/data/csv", "CMC_shop-analysis", "Montreal-TroisRivieres-RiveSudCanal", "000.csv", "1", "1", "24", "0" ],
        //[ "SHOP", "SHOP", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "SHOP/data/csv", "CMC_shop-analysis", "Montreal-TroisRivieres-SaintFrancois", "000.csv", "1", "1", "24", "0" ],

        ["GEFS", "GEFS", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", "_gens.pl", "gefs", "1p00", "pgrb2", "100", "1", "6", "384"],

        //[ "GFS", "GFS", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", ".pl", "gfs", "1p00", "pgrb2", "100", "1", "3", "384" ],
        //[ "GFS", "GFS", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", ".pl", "gfs", "0p50", "pgrb2full", "50", "1", "3", "384" ],
        ["GFS", "GFS", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", ".pl", "gfs", "0p25", "pgrb2", "25", "1", "1", "384"],
        //[ "GFS", "GFS", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", "_1hr.pl", "gfs", "0p25", "pgrb2", "25", "1", "1", "384" ],
        //[ "GFS", "GFS", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", "b.pl", "gfs", "0p25", "pgrb2b", "25", "1", "1", "384" ],

        ["NAM11", "NAM11", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", "_ak.pl", "nam", "awak3d", "grb2", "11", "1", "3", "60"],

        ["NAM12", "NAM12", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", "_conusnest.pl", "nam", "conusnest.hiresf", "grib2", "11", "1", "3", "60"],
        //[ "NAM12", "NAM12", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", "_hawaiinest.pl", "nam", "hawaiinest.hiresf", "grib2", "11", "1", "3", "60" ],
        //[ "NAM12", "NAM12", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", "_priconest.pl", "nam", "priconest.hiresf", "grib2", "11", "1", "3", "60" ],

        ["NAM32", "NAM32", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", "_na.pl", "nam", "awip32", "grib2", "32", "1", "3", "84"],

        ["RAP", "RAP", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", ".pl", "rap", "awp130pgrbf", "grib2", "13", "1", "1", "18"],
        //[ "RAP", "RAP", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", "32.pl", "rap", "awip32f", "grib2", "32", "1", "1", "18" ],

        ["HRRR", "HRRR", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", "_2d.pl", "hrrr", "wrfsfcf", "grib2", "3", "1", "1", "15"],

        ["SREF", "SREF", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", "_132.pl", "sref", "132", "pgrb", "16", "1", "3", "87"],
        //[ "SREF", "SREF", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", "_na.pl", "sref", "221", "pgrb", "32", "1", "3", "87" ],
        //[ "SREF", "SREF", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", ".pl", "sref", "212", "pgrb", "32", "1", "1", "87" ],

        ["WAVE", "WAVE", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", ".pl", "wave", "nah", "grib.grib2", "25", "1", "6", "18"] // as 127 member ensembles
    ];
};
