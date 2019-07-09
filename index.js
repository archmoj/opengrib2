'use strict';

var http = require("http");

var GRIB2CLASS = require('./grib2class');

var allDomains = [
/*
        // Note: for hindcast we should use previous date:1981-2010
        //[ "CanSIPS_hindcast", "CanSIPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "ensemble/cansips/grib2/hindcast/raw", "cansips_hindcast_raw", "latlon2.5x2.5", "_allmembers.grib2", "250", "240", "1", "1" ],
        ["CanSIPS_forecast", "CanSIPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "ensemble/cansips/grib2/forecast/raw", "cansips_forecast_raw", "latlon2.5x2.5", "_allmembers.grib2", "250", "240", "1", "1"],

        ["GEPS", "GEPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "ensemble/naefs/grib2/raw", "CMC_naefs-geps-raw", "latlon1p0x1p0", "_allmbrs.grib2", "100", "21", "6", "384"],

        ["REPS", "REPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "ensemble/reps/15km/grib2/raw", "CMC-reps-srpe-raw", "ps15km", "_allmbrs.grib2", "15", "21", "3", "72"],

        ["GDPS", "GDPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_gem_global/25km/grib2/lat_lon", "CMC_glb", "latlon.24x.24", ".grib2", "25", "1", "3", "240"],
        //[ "GDPS", "GDPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_gem_global/66km/grib2/lat_lon", "CMC_glb", "latlon.6x.6", ".grib2", "66", "1", "3", "144" ],
        //[ "GDPS", "GDPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_gem_global/66km/grib2/polar_stereographic", "CMC_glb", "ps30km", ".grib2", "66", "1", "3", "144" ],
*/
        ["RDPS", "RDPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_gem_regional/10km/grib2", "CMC_reg", "ps10km", ".grib2", "10", "1", "3", "54"],
/*
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
*/
];


var ParameterLevel = [
        ["snowdensity-Dube141_1h", "", "", "", "", "", "", "", ""],
        ["APCP-006-0700cutoff_SFC_0", "", "", "", "", "", "", "", ""],

        ["PRATE_SFC_0", "", "", "", "", "", "", "", ""],
        ["APCP_SFC_0", "", "", "", "", "", "", "", ""], // accumuative
        ["ARAIN_SFC_0", "", "", "", "", "", "", "", ""], // accumuative
        ["AFRAIN_SFC_0", "", "", "", "", "", "", "", ""], // accumuative
        ["AICEP_SFC_0", "", "", "", "", "", "", "", ""], // accumuative
        ["ASNOW_SFC_0", "", "", "", "", "", "", "", ""], // accumuative

        ["DSWRF_NTAT_0", "", "", "", "", "", "", "", ""], // accumuative
        ["NLWRS_SFC_0", "", "", "", "", "", "", "", ""], // accumuative
        ["NSWRS_SFC_0", "", "", "", "", "", "", "", ""], // accumuative
        ["DLWRF_SFC_0", "", "", "", "", "", "", "", ""], // accumuative
        ["DSWRF_SFC_0", "", "", "", "", "", "", "", ""], // accumuative

        ["USWRF_NTAT_0", "", "", "", "", "", "", "", ""], // not accumuative W/m2
        ["ULWRF_NTAT_0", "", "", "", "", "", "", "", ""], // not accumuative W/m2
        ["SHTFL_SFC_0", "", "", "", "", "", "", "", ""], // not accumuative W/m2
        ["LHTFL_SFC_0", "", "", "", "", "", "", "", ""], // not accumuative W/m2

        ["SHOWA_SFC_0", "", "", "", "", "", "", "", ""],
        ["4LFTX_SFC_0", "", "", "", "", "", "", "", ""],
        ["CAPE_ETAL_10000", "", "", "", "", "", "", "", ""],
        ["HLCY_ETAL_10000", "", "", "", "", "", "", "", ""],

        ["WTMP_SFC_0", "", "", "", "", "", "", "", ""],
        ["ICEC_SFC_0", "", "", "", "", "", "", "", ""],
        ["LAND_SFC_0", "", "", "", "", "", "", "", ""],

        ["SNOD_SFC_0", "", "", "", "", "", "", "", ""],
        ["WEASD_SFC_0", "", "", "", "", "", "", "", ""],
        ["TSOIL_DBLL_10c", "", "", "", "", "", "", "", ""],
        ["VSOILM_DBLL_10c", "", "", "", "", "", "", "", ""],

        ["", "", "", "", "ABSV_ISBL_1000", "ABSV_ISBL_0850", "ABSV_ISBL_0700", "ABSV_ISBL_0500", "ABSV_ISBL_0250"],
        ["", "", "", "", "VVEL_ISBL_1000", "VVEL_ISBL_0850", "VVEL_ISBL_0700", "VVEL_ISBL_0500", "VVEL_ISBL_0250"],
        ["HGT_SFC_0", "", "", "", "HGT_ISBL_1000", "HGT_ISBL_0850", "HGT_ISBL_0700", "HGT_ISBL_0500", "HGT_ISBL_0250"],

        ["TMP_TGL_2", "TMP_TGL_40", "TMP_TGL_80", "TMP_TGL_120", "TMP_ISBL_1000", "TMP_ISBL_0850", "TMP_ISBL_0700", "TMP_ISBL_0500", "TMP_ISBL_0250"],
        ["DPT_TGL_2", "DPT_TGL_40", "DPT_TGL_80", "DPT_TGL_120", "", "", "", "", ""],
        ["DEPR_TGL_2", "DEPR_TGL_40", "DEPR_TGL_80", "DEPR_TGL_120", "DEPR_ISBL_1000", "DEPR_ISBL_0850", "DEPR_ISBL_0700", "DEPR_ISBL_0500", "DEPR_ISBL_0250"],
        ["SPFH_TGL_2", "SPFH_TGL_40", "SPFH_TGL_80", "SPFH_TGL_120", "SPFH_ISBL_1000", "SPFH_ISBL_0850", "SPFH_ISBL_0700", "SPFH_ISBL_0500", "SPFH_ISBL_0250"],
        ["RH_TGL_2", "RH_TGL_40", "RH_TGL_80", "RH_TGL_120", "RH_ISBL_1000", "RH_ISBL_0850", "RH_ISBL_0700", "RH_ISBL_0500", "RH_ISBL_0250"],

        ["UGRD_TGL_10", "UGRD_TGL_40", "UGRD_TGL_80", "UGRD_TGL_120", "UGRD_ISBL_1000", "UGRD_ISBL_0850", "UGRD_ISBL_0700", "UGRD_ISBL_0500", "UGRD_ISBL_0250"],
        ["VGRD_TGL_10", "VGRD_TGL_40", "VGRD_TGL_80", "VGRD_TGL_120", "VGRD_ISBL_1000", "VGRD_ISBL_0850", "VGRD_ISBL_0700", "VGRD_ISBL_0500", "VGRD_ISBL_0250"],
        ["WIND_TGL_10", "WIND_TGL_40", "WIND_TGL_80", "WIND_TGL_120", "WIND_ISBL_1000", "WIND_ISBL_0850", "WIND_ISBL_0700", "WIND_ISBL_0500", "WIND_ISBL_0250"],
        ["WDIR_TGL_10", "WDIR_TGL_40", "WDIR_TGL_80", "WDIR_TGL_120", "WDIR_ISBL_1000", "WDIR_ISBL_0850", "WDIR_ISBL_0700", "WDIR_ISBL_0500", "WDIR_ISBL_0250"],

        ["WVDIR_SFC_0", "", "", "", "", "", "", "", ""],
        ["SWDIR_SFC_0", "", "", "", "", "", "", "", ""],
        ["WVHGT_SFC_0", "", "", "", "", "", "", "", ""],
        ["SWELL_SFC_0", "", "", "", "", "", "", "", ""],
        ["HTSGW_SFC_0", "", "", "", "", "", "", "", ""],
        ["PWPER_SFC_0", "", "", "", "", "", "", "", ""],
        ["WVPER_SFC_0", "", "", "", "", "", "", "", ""],
        ["SWPER_SFC_0", "", "", "", "", "", "", "", ""],

        ["HG_TGL_0", "", "", "", "", "", "", "", ""],
        ["WVX_TGL_0", "", "", "", "", "", "", "", ""],
        ["WVY_TGL_0", "", "", "", "", "", "", "", ""],
        ["WVMD_TGL_0", "", "", "", "", "", "", "", ""],
        ["WVDR_TGL_0", "", "", "", "", "", "", "", ""],
        ["FRO_TGL_0", "", "", "", "", "", "", "", ""],
        ["VCIS_TGL_0", "", "", "", "", "", "", "", ""],
        ["QSP_TGL_0", "", "", "", "", "", "", "", ""],
        ["TDI_TGL_0", "", "", "", "", "", "", "", ""],
        ["TMPIL_TGL_0", "", "", "", "", "", "", "", ""],

        ["PRMSL_MSL_0", "", "", "", "", "", "", "", ""],
        ["PRES_SFC_0", "", "", "", "", "", "", "", ""],
        ["HGT", "", "", "", "", "", "", "", ""], // cloud ceiling
        ["HGT", "", "", "", "", "", "", "", ""], // cloud top
        ["HCDC_SFC_0", "", "", "", "", "", "", "", ""],
        ["MCDC_SFC_0", "", "", "", "", "", "", "", ""],
        ["LCDC_SFC_0", "", "", "", "", "", "", "", ""],
        ["TCDC_SFC_0", "", "", "", "", "", "", "", ""],
        ["ALBDO_SFC_0", "", "", "", "", "", "", "", ""],

        ["SOLAR_HOR", "", "", "", "", "", "", "", ""], // to be post-processed
        ["SOLAR_DIF", "", "", "", "", "", "", "", ""], // to be post-processed
        ["SOLAR_DIR", "", "", "", "", "", "", "", ""], // to be post-processed

        ["EFFECT_DIR", "", "", "", "", "", "", "", ""], // to be post-processed
        ["EFFECT_DIF", "", "", "", "", "", "", "", ""], // to be post-processed

        ["SOLAR_TRK", "", "", "", "", "", "", "", ""], // to be post-processed
        ["SOLAR_LAT", "", "", "", "", "", "", "", ""], // to be post-processed
        ["SOLAR_S45", "", "", "", "", "", "", "", ""], // to be post-processed
        ["SOLAR_S00", "", "", "", "", "", "", "", ""], // to be post-processed
        ["SOLAR_N00", "", "", "", "", "", "", "", ""], // to be post-processed
        ["SOLAR_E00", "", "", "", "", "", "", "", ""], // to be post-processed
        ["SOLAR_W00", "", "", "", "", "", "", "", ""], // to be post-processed

        ["WPOW_TGL_10", "WPOW_TGL_40", "WPOW_TGL_80", "WPOW_TGL_120", "WPOW_ISBL_1000", "WPOW_ISBL_0850", "WPOW_ISBL_0700", "WPOW_ISBL_0500", "WPOW_ISBL_0250"], // to be post-processed

        ["FLOWxONLY_TGL_10", "FLOWxONLY_TGL_40", "FLOWxONLY_TGL_80", "FLOWxONLY_TGL_120", "FLOWxONLY_ISBL_1000", "FLOWxONLY_ISBL_0850", "FLOWxONLY_ISBL_0700", "FLOWxONLY_ISBL_0500", "FLOWxONLY_ISBL_0250"], // to be post-processed
        ["FLOWxPRM_TGL_10", "FLOWxPRM_TGL_40", "FLOWxPRM_TGL_80", "FLOWxPRM_TGL_120", "FLOWxPRM_ISBL_1000", "FLOWxPRM_ISBL_0850", "FLOWxPRM_ISBL_0700", "FLOWxPRM_ISBL_0500", "FLOWxPRM_ISBL_0250"], // to be post-processed
        ["FLOWxPCP_TGL_10", "FLOWxPCP_TGL_40", "FLOWxPCP_TGL_80", "FLOWxPCP_TGL_120", "FLOWxPCP_ISBL_1000", "FLOWxPCP_ISBL_0850", "FLOWxPCP_ISBL_0700", "FLOWxPCP_ISBL_0500", "FLOWxPCP_ISBL_0250"], // to be post-processed
        ["FLOWxEFF_TGL_10", "FLOWxEFF_TGL_40", "FLOWxEFF_TGL_80", "FLOWxEFF_TGL_120", "FLOWxEFF_ISBL_1000", "FLOWxEFF_ISBL_0850", "FLOWxEFF_ISBL_0700", "FLOWxEFF_ISBL_0500", "FLOWxEFF_ISBL_0250"], // to be post-processed

];



var DOMAIN = {
        PROPERTY00: 0, // desirable name for model outside program
        PROPERTY01: 1, // type of model
        PROPERTY02: 2,
        PROPERTY03: 3,
        PROPERTY04: 4,
        PROPERTY05: 5,
        PROPERTY06: 6,
        PROPERTY07: 7,
        PROPERTY08: 8,
        PROPERTY09: 9,
        PROPERTY10: 10,
        PROPERTY11: 11
};

var Current_domainID = -1;

var num_Levels = 0;
function addLevel() {
        num_Levels += 1;
        return (num_Levels - 1);
}

var LEVEL_surface = addLevel();
var LEVEL_40m = addLevel();
var LEVEL_80m = addLevel();
var LEVEL_120m = addLevel();
var LEVEL_ISBL_1000 = addLevel();
var LEVEL_ISBL_0850 = addLevel();
var LEVEL_ISBL_0650 = addLevel();
var LEVEL_ISBL_0450 = addLevel();
var LEVEL_ISBL_0250 = addLevel();

var num_Layers = 0;
function addLayer() {
        num_Layers += 1;
        return (num_Layers - 1);
}

var LAYER_pastsnow = addLayer();
var LAYER_pastprecip = addLayer();
var LAYER_preciprate = addLayer();
var LAYER_precipitation = addLayer();
var LAYER_rain = addLayer();
var LAYER_freezingrain = addLayer();
var LAYER_icepellets = addLayer();
var LAYER_snow = addLayer();

var LAYER_solarcomingshort = addLayer();
var LAYER_solarabsrbdlong = addLayer();
var LAYER_solarabsrbdshort = addLayer();
var LAYER_solardownlong = addLayer();
var LAYER_solardownshort = addLayer();
var LAYER_solaruplong = addLayer();
var LAYER_solarupshort = addLayer();
var LAYER_surfsensibleheat = addLayer();
var LAYER_surflatentheat = addLayer();

var LAYER_surfshowalter = addLayer();
var LAYER_surflifted = addLayer();

var LAYER_convpotenergy = addLayer();
var LAYER_surfhelicity = addLayer();

var LAYER_watertemperature = addLayer();
var LAYER_ice = addLayer();
var LAYER_land = addLayer();

var LAYER_depthsnow = addLayer();
var LAYER_watersnow = addLayer();
var LAYER_soiltemperature = addLayer();
var LAYER_soilmoisture = addLayer();

var LAYER_absolutevorticity = addLayer();
var LAYER_verticalvelocity = addLayer();
var LAYER_height = addLayer();

var LAYER_drybulb = addLayer();
var LAYER_dewpoint = addLayer();
var LAYER_depression = addLayer();
var LAYER_spchum = addLayer();
var LAYER_relhum = addLayer();

var LAYER_windU = addLayer();
var LAYER_windV = addLayer();
var LAYER_windspd = addLayer();
var LAYER_winddir = addLayer();

var LAYER_windwavedirtrue = addLayer();
var LAYER_swellwavedirtrue = addLayer();
var LAYER_windwavesheight = addLayer();
var LAYER_swellwavesheight = addLayer();
var LAYER_combwavesheight = addLayer();
var LAYER_peakwaveperiod = addLayer();
var LAYER_windwaveperiod = addLayer();
var LAYER_swellwaveperiod = addLayer();

var LAYER_Water_level_above_mean_sea_level = addLayer();
var LAYER_X_component_of_the_water_velocity = addLayer();
var LAYER_Y_component_of_the_water_velocity = addLayer();
var LAYER_Modulus_of_the_water_velocity = addLayer();
var LAYER_Direction_of_the_water_velocity = addLayer();
var LAYER_Froude_number = addLayer();
var LAYER_Shear_of_the_water_velocity = addLayer();
var LAYER_Specific_discharge = addLayer();
var LAYER_Water_Transport_Diffusion_Index = addLayer();
var LAYER_Water_temperature = addLayer();

var LAYER_meanpressure = addLayer();
var LAYER_surfpressure = addLayer();
var LAYER_cloudceiling = addLayer();
var LAYER_cloudtop = addLayer();
var LAYER_cloudhigh = addLayer();
var LAYER_cloudmiddle = addLayer();
var LAYER_cloudlow = addLayer();
var LAYER_cloudcover = addLayer();
var LAYER_albedo = addLayer();
//---------------------------
var NumberOfRawDataLayers = LAYER_albedo;
//---------------------------
var LAYER_glohorrad = addLayer();
var LAYER_difhorrad = addLayer();
var LAYER_dirnorrad = addLayer();
var LAYER_dirnoreff = addLayer();
var LAYER_difhoreff = addLayer();
var LAYER_tracker = addLayer();
var LAYER_fixlat = addLayer();
var LAYER_south45 = addLayer();
var LAYER_south00 = addLayer();
var LAYER_north00 = addLayer();
var LAYER_east00 = addLayer();
var LAYER_west00 = addLayer();

var LAYER_windpower = addLayer();
var LAYER_flowXonly = addLayer();
var LAYER_flowXmeanpressure = addLayer();
var LAYER_flowXprecipitation = addLayer();
var LAYER_flowXdirecteffect = addLayer();

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

        Filename: ""
};


Current_domainID = 0;  // <<<<<<<<<<<<<<
if (DATA.allDomains[Current_domainID][DOMAIN.PROPERTY01] === "HRRR") {
        DATA.newLayers = [
          LAYER_drybulb
        ];

        DATA.allLayers = DATA.newLayers;
}












var link = "http://dd.weather.gc.ca/model_gem_regional/10km/grib2/18/000/CMC_reg_TMP_TGL_2_ps10km_2019070818_P000.grib2";
DATA.numMembers = 1; // not Ensemble for the moment!

var BaseFolder = ".";
var TempFolder = BaseFolder + "/temp/";
var OutputFolder = BaseFolder + "/output/";

var myGrid = new GRIB2CLASS(DATA, {
        TempFolder: TempFolder,
        OutputFolder: OutputFolder
});
console.log(myGrid);



var allChunks;
http.get(link, function (res) {
        allChunks = [];
        res.on("data", function (chunk) {
                allChunks.push(chunk);
        });
        res.on("end", function () {
                myGrid.fileBytes = Buffer.concat(allChunks);

                myGrid.readGrib2Members(DATA.numMembers);
        });
});

