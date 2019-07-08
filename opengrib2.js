/**
* Copyright 2016-2019, Mojtaba Samimi @solarchvision
* All rights reserved.
*
* Licensed under GPL.v2.0
*/

import processing.pdf.*;
PGraphics pdfExport;

import gifAnimation.*;
GifMaker gifExport;

import java.util.Calendar;

// The following libraries are needed for CMC grib2 models which are 'sadly' encoded in JPEG-2000!
import ucar.unidata.io.RandomAccessFile;
import ucar.jpeg.jj2000.j2k.decoder.Grib2JpegDecoder;


String BaseFolder = "C:/SOLARCHVISION/grib2_solarchvision";

String[] args = split(join(loadStrings(BaseFolder + "/scripts/node/gridConfig.txt"), " "), ' ');
/*
String[] args = {
  "domain=HRDPS_west",
  "run=00Z",
  "begin=6",
  "end=6",
  "step=3",
  "auto=USER",
  "tmpdir=/temp/",
  "outdir=/screenshot/",

  "layers+=drybulb",
  //"layers+=cloudcover",
  //"layers+=dirnoreff",

  "levels+=surface",

  "year="  + nf(year() , 4),
  "month=" + nf(month(), 2),
  "day="   + nf(day()  , 2)
};
*/

boolean log = false;

String[] asciiTable = {"NUL", "SOH", "STX", "ETX", "EOT", "ENQ", "ACK", "BEL", "BS", "HT", "LF", "VT", "FF", "CR", "SO", "SI", "DLE", "DC1", "DC2", "DC3", "DC4", "NAK", "SYN", "ETB", "CAN", "EM", "SUB", "ESC", "FS", "GS", "RS", "US"};

void cout (int c) {
  if (!log) return;
  if (c > 31) print(char(c));
  else {
    //print("[" + asciiTable[c] + "]");
    print("_");
  }
}

void sout(String a) {
  if (log) println(a);
}

String[] getfiles (String _Folder) {
  sout("IN='" + _Folder + "'");

  File dir = new File(_Folder);

  String[] filenames = dir.list();

  if (filenames == null) {
    filenames = new String [0];
  }

  sout("[");
  for (int i = 0; i < filenames.length; i++) {
    sout("\t'" + filenames[i] + "'");
  }
  sout("]");

  return filenames;
}

String CITIES_Coordinates = BaseFolder + "/input/coordinate/cities.txt";
String COUNTRY_Coordinates = BaseFolder + "/input/coordinate/boundaries.txt";
String SHOP_Coordinates = BaseFolder + "/input/coordinate/shop.csv";
String SWOB_Coordinates = BaseFolder + "/input/coordinate/swob.txt";

String TempFolder = BaseFolder + "/temp/";
String OutputFolder = BaseFolder + "/output/";

String Grib2Folder = TempFolder + "grib2/";
String Jpeg2000Folder = TempFolder + "jp2/";

String RECENT_OBSERVED_directory = TempFolder + "swob/";
String[] RECENT_OBSERVED_XML_Files = getfiles(RECENT_OBSERVED_directory);
int Download_RECENT_OBSERVED = 1;

int numberOfNearestStations_RECENT_OBSERVED = 1063; // <<<<<<<
int[] nearest_Station_RECENT_OBSERVED_id = new int [numberOfNearestStations_RECENT_OBSERVED];
float[] nearest_Station_RECENT_OBSERVED_dist = new float [numberOfNearestStations_RECENT_OBSERVED];

PImage[] EARTH_IMAGES;
float[][] EARTH_IMAGES_BoundariesX;
float[][] EARTH_IMAGES_BoundariesY;
String EARTH_IMAGES_Path = BaseFolder + "/input/earth_map";
String[] EARTH_IMAGES_Filenames = sort(getfiles(EARTH_IMAGES_Path));
int EARTH_BitmapChoice = 0;

final int STAT_N_Base = 0;

final int STAT_N_MidLow = 1;
final int STAT_N_Middle = 2;
final int STAT_N_MidHigh = 3;

final int STAT_N_M25 = 4;
final int STAT_N_M50 = 5;
final int STAT_N_M75 = 6;

final int STAT_N_Min = 7;
final int STAT_N_Ave = 8;
final int STAT_N_Max = 9;

final int STAT_N_SpecialMention = 10;

String[] STAT_N_Title = {
  "Base Scenarios ",

  "Mid-LOW*       ",
  "MIDDLE*        ",
  "Mid-HIGH*      ",

  "25th Percentile",
  "50th P.(Median)",
  "75th Percentile",

  "MINIMUM        ",
  "AVERAGE        ",
  "MAXIMUM        ",

  "SPECIAL-MENTION"
};

final int USER_INT = 0; // User interface
final int AUTO_PDF = 1; // Auto PDF
final int AUTO_GIF = 2; // Auto GIF
final int AUTO_BMP = 3; // Auto BMP
final int AUTO_JPG = 4; // Auto JPG
final int AUTO_PNG = 5; // Auto PNG
final int AUTO_TIF = 6; // Auto TIF

int automated = USER_INT;

int DATA_ModelYear = -1;
int DATA_ModelMonth = -1;
int DATA_ModelDay = -1;

int DATA_ModelRun = -1;
int DATA_ModelTime = -1; // i.e. forecast hour
int DATA_ModelBegin = -1;
int DATA_ModelStep = -1;
int DATA_ModelEnd = -1;

int[] DATA_allStatistics = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10}; // 0:Base 1:Mid-Low 2:Middle 3:Mid-High 4:25th-Percentile 5:Median 6:75th-Percentile 7:Minimum 8:Average 9:Maximum 10:Spetial-Mention

int DATA_numLevels = -1;
int DATA_numLayers = -1;
int DATA_numMembers = -1;
int DATA_numTimes = -1; // download n grib2 files in front

final int DOMAIN_PROPERTY00 = 0; // desirable name for model outside program
final int DOMAIN_PROPERTY01 = 1; // type of model
final int DOMAIN_PROPERTY02 = 2;
final int DOMAIN_PROPERTY03 = 3;
final int DOMAIN_PROPERTY04 = 4;
final int DOMAIN_PROPERTY05 = 5;
final int DOMAIN_PROPERTY06 = 6;
final int DOMAIN_PROPERTY07 = 7;
final int DOMAIN_PROPERTY08 = 8;
final int DOMAIN_PROPERTY09 = 9;
final int DOMAIN_PROPERTY10 = 10;
final int DOMAIN_PROPERTY11 = 11;

String[][] DATA_allDomains = {
  // Note: for hindcast we should use previous date:1981-2010
  //{ "CanSIPS_hindcast", "CanSIPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "ensemble/cansips/grib2/hindcast/raw", "cansips_hindcast_raw", "latlon2.5x2.5", "_allmembers.grib2", "250", "240", "1", "1" },
  { "CanSIPS_forecast", "CanSIPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "ensemble/cansips/grib2/forecast/raw", "cansips_forecast_raw", "latlon2.5x2.5", "_allmembers.grib2", "250", "240", "1", "1" },

  { "GEPS", "GEPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "ensemble/naefs/grib2/raw", "CMC_naefs-geps-raw", "latlon1p0x1p0", "_allmbrs.grib2", "100", "21", "6", "384" },

  { "REPS", "REPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "ensemble/reps/15km/grib2/raw", "CMC-reps-srpe-raw", "ps15km", "_allmbrs.grib2", "15", "21", "3", "72" },

  { "GDPS", "GDPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_gem_global/25km/grib2/lat_lon", "CMC_glb", "latlon.24x.24", ".grib2", "25", "1", "3", "240" },
  //{ "GDPS", "GDPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_gem_global/66km/grib2/lat_lon", "CMC_glb", "latlon.6x.6", ".grib2", "66", "1", "3", "144" },
  //{ "GDPS", "GDPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_gem_global/66km/grib2/polar_stereographic", "CMC_glb", "ps30km", ".grib2", "66", "1", "3", "144" },

  { "RDPS", "RDPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_gem_regional/10km/grib2", "CMC_reg", "ps10km", ".grib2", "10", "1", "3", "54" },

  { "HRDPS_arctic", "HRDPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_hrdps/arctic/grib2", "CMC_hrdps_arctic", "ps2.5km", "-00.grib2", "2.5", "1", "1", "24" },
  { "HRDPS_lancaster", "HRDPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_hrdps/lancaster/grib2", "CMC_hrdps_lancaster", "ps2.5km", "-00.grib2", "2.5", "1", "1", "30" },
  { "HRDPS_maritimes", "HRDPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_hrdps/maritimes/grib2", "CMC_hrdps_maritimes", "ps2.5km", "-00.grib2", "2.5", "1", "1", "48" },
  { "HRDPS_east", "HRDPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_hrdps/east/grib2", "CMC_hrdps_east", "ps2.5km", "-00.grib2", "2.5", "1", "1", "48" },
  { "HRDPS_prairies", "HRDPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_hrdps/prairies/grib2", "CMC_hrdps_prairies", "ps2.5km", "-00.grib2", "2.5", "1", "1", "48" },
  { "HRDPS_west", "HRDPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_hrdps/west/grib2", "CMC_hrdps_west", "ps2.5km", "-00.grib2", "2.5", "1", "1", "48" },
  { "HRDPS_continental", "HRDPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_hrdps/continental/grib2", "CMC_hrdps_continental", "ps2.5km", "-00.grib2", "2.5", "1", "1", "48" },
  { "HRDPS_north", "HRDPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_hrdps/north/grib2", "CMC_hrdps_north", "ps2.5km", "-00.grib2", "2.5", "1", "1", "30" },

  { "GDWPS", "GDWPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_wave/ocean/global/grib2", "CMC_gdwps_global", "latlon0.25x0.25", ".grib2", "25", "1", "3", "48" },

  { "RDWPS_lake_erie", "RDWPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_wave/great_lakes/erie/grib2", "CMC_rdwps_lake-erie", "latlon0.05x0.05", ".grib2", "5", "1", "6", "48" },
  { "RDWPS_lake_huron", "RDWPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_wave/great_lakes/huron/grib2", "CMC_rdwps_lake-huron", "latlon0.05x0.08", ".grib2", "5", "1", "6", "48" },
  { "RDWPS_lake_ontario", "RDWPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_wave/great_lakes/ontario/grib2", "CMC_rdwps_lake-ontario", "latlon0.05x0.08", ".grib2", "5", "1", "6", "48" },
  { "RDWPS_north_atlantic", "RDWPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_wave/ocean/atlantic_north/grib2", "CMC_rdwps_north-atlantic", "latlon0.15x0.15", ".grib2", "5", "1", "6", "48" },
  { "RDWPS_north_pacific", "RDWPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_wave/ocean/pacific_north/grib2", "CMC_rdwps_north-pacific", "latlon0.5x0.5", ".grib2", "40", "1", "6", "48" },
  { "RDWPS_arctic", "RDWPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_wave/ocean/arctic/grib2", "CMC_rdwps_arctic", "latlon0.04x0.08", ".grib2", "5", "1", "6", "48" },
  { "RDWPS_gulf_st_lawrence", "RDWPS", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "model_wave/ocean/gulf-st-lawrence/grib2", "CMC_rdwps_gulf-st-lawrence", "latlon0.05x0.05", ".grib2", "5", "1", "6", "48" },

  { "RDPA", "RDPA", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "analysis/precip/rdpa/grib2/polar_stereographic/06", "CMC_RDPA", "ps10km", "000.grib2", "5", "1", "6", "1" },
  //{ "RDPA", "RDPA", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "analysis/precip/rdpa/grib2/polar_stereographic/24", "CMC_RDPA", "ps10km", "000.grib2", "5", "1", "6", "1" },

  { "HRDPA", "HRDPA", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "analysis/precip/hrdpa/grib2/polar_stereographic/06", "CMC_HRDPA", "ps2.5km", "000.grib2", "5", "1", "6", "1" },
  //{ "HRDPA", "HRDPA", "CMC", "http://dd.weatheroffice.ec.gc.ca/", "analysis/precip/hrdpa/grib2/polar_stereographic/24", "CMC_HRDPA", "ps2.5km", "000.grib2", "5", "1", "6", "1" },

  //{ "SNOW", "SNOW", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "GRIB", "snow_density_dataset/RDPS", "reg", "", "15", "96", "6", "1" },
  //{ "SNOW", "SNOW", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "GRIB", "snow_density_dataset/HRDPS", "hrdps-national_west", "", "15", "96", "6", "1" },
  //{ "SNOW", "SNOW", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "GRIB", "snow_density_dataset/HRDPS", "hrdps-national_prairies", "", "15", "96", "6", "1" },
  { "SNOW", "SNOW", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "GRIB", "snow_density_dataset/HRDPS", "hrdps-national_east", "", "15", "96", "6", "1" },
  //{ "SNOW", "SNOW", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "GRIB", "snow_density_dataset/HRDPS", "hrdps-national_maritimes", "", "15", "96", "6", "1" },

  { "SHOP", "SHOP", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "SHOP/data/csv", "CMC_shop-analysis", "Montreal-TroisRivieres", "000.csv", "1", "1", "24", "0" },
  //{ "SHOP", "SHOP", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "SHOP/data/csv", "CMC_shop-analysis", "Montreal-TroisRivieres-Assomption", "000.csv", "1", "1", "24", "0" },
  //{ "SHOP", "SHOP", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "SHOP/data/csv", "CMC_shop-analysis", "Montreal-TroisRivieres-DuLoup", "000.csv", "1", "1", "24", "0" },
  //{ "SHOP", "SHOP", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "SHOP/data/csv", "CMC_shop-analysis", "Montreal-TroisRivieres-GreatLakes", "000.csv", "1", "1", "24", "0" },
  //{ "SHOP", "SHOP", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "SHOP/data/csv", "CMC_shop-analysis", "Montreal-TroisRivieres-Maskinonge", "000.csv", "1", "1", "24", "0" },
  //{ "SHOP", "SHOP", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "SHOP/data/csv", "CMC_shop-analysis", "Montreal-TroisRivieres-Mip", "000.csv", "1", "1", "24", "0" },
  //{ "SHOP", "SHOP", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "SHOP/data/csv", "CMC_shop-analysis", "Montreal-TroisRivieres-Nicolet", "000.csv", "1", "1", "24", "0" },
  //{ "SHOP", "SHOP", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "SHOP/data/csv", "CMC_shop-analysis", "Montreal-TroisRivieres-Richelieu", "000.csv", "1", "1", "24", "0" },
  //{ "SHOP", "SHOP", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "SHOP/data/csv", "CMC_shop-analysis", "Montreal-TroisRivieres-RiveSudCanal", "000.csv", "1", "1", "24", "0" },
  //{ "SHOP", "SHOP", "CMC", "http://collaboration.cmc.ec.gc.ca/cmc/cmoi/", "SHOP/data/csv", "CMC_shop-analysis", "Montreal-TroisRivieres-SaintFrancois", "000.csv", "1", "1", "24", "0" },

  { "GEFS", "GEFS", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", "_gens.pl", "gefs", "1p00", "pgrb2", "100", "1", "6", "384" },

  //{ "GFS", "GFS", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", ".pl", "gfs", "1p00", "pgrb2", "100", "1", "3", "384" },
  //{ "GFS", "GFS", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", ".pl", "gfs", "0p50", "pgrb2full", "50", "1", "3", "384" },
  { "GFS", "GFS", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", ".pl", "gfs", "0p25", "pgrb2", "25", "1", "1", "384" },
  //{ "GFS", "GFS", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", "_1hr.pl", "gfs", "0p25", "pgrb2", "25", "1", "1", "384" },
  //{ "GFS", "GFS", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", "b.pl", "gfs", "0p25", "pgrb2b", "25", "1", "1", "384" },

  { "NAM11", "NAM11", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", "_ak.pl", "nam", "awak3d", "grb2", "11", "1", "3", "60" },

  { "NAM12", "NAM12", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", "_conusnest.pl", "nam", "conusnest.hiresf", "grib2", "11", "1", "3", "60" },
  //{ "NAM12", "NAM12", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", "_hawaiinest.pl", "nam", "hawaiinest.hiresf", "grib2", "11", "1", "3", "60" },
  //{ "NAM12", "NAM12", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", "_priconest.pl", "nam", "priconest.hiresf", "grib2", "11", "1", "3", "60" },

  { "NAM32", "NAM32", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", "_na.pl", "nam", "awip32", "grib2", "32", "1", "3", "84" },

  { "RAP", "RAP", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", ".pl", "rap", "awp130pgrbf", "grib2", "13", "1", "1", "18" },
  //{ "RAP", "RAP", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", "32.pl", "rap", "awip32f", "grib2", "32", "1", "1", "18" },

  { "HRRR", "HRRR", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", "_2d.pl", "hrrr", "wrfsfcf", "grib2", "3", "1", "1", "15" },

  { "SREF", "SREF", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", "_132.pl", "sref", "132", "pgrb", "16", "1", "3", "87" },
  //{ "SREF", "SREF", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", "_na.pl", "sref", "221", "pgrb", "32", "1", "3", "87" },
  //{ "SREF", "SREF", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", ".pl", "sref", "212", "pgrb", "32", "1", "1", "87" },

  { "WAVE", "WAVE", "NOAA", "http://nomads.ncep.noaa.gov/cgi-bin/filter", ".pl", "wave", "nah", "grib.grib2", "25", "1", "6", "18"} // as 127 member ensembles
};

int Current_domainID = -1;

String[][] DATA_ParameterLevel = {
  {"snowdensity-Dube141_1h", "", "", "", "", "", "", "", ""},
  {"APCP-006-0700cutoff_SFC_0", "", "", "", "", "", "", "", ""},

  {"PRATE_SFC_0", "", "", "", "", "", "", "", ""},
  {"APCP_SFC_0", "", "", "", "", "", "", "", ""}, // accumuative
  {"ARAIN_SFC_0", "", "", "", "", "", "", "", ""}, // accumuative
  {"AFRAIN_SFC_0", "", "", "", "", "", "", "", ""}, // accumuative
  {"AICEP_SFC_0", "", "", "", "", "", "", "", ""}, // accumuative
  {"ASNOW_SFC_0", "", "", "", "", "", "", "", ""}, // accumuative

  {"DSWRF_NTAT_0", "", "", "", "", "", "", "", ""}, // accumuative
  {"NLWRS_SFC_0", "", "", "", "", "", "", "", ""}, // accumuative
  {"NSWRS_SFC_0", "", "", "", "", "", "", "", ""}, // accumuative
  {"DLWRF_SFC_0", "", "", "", "", "", "", "", ""}, // accumuative
  {"DSWRF_SFC_0", "", "", "", "", "", "", "", ""}, // accumuative

  {"USWRF_NTAT_0", "", "", "", "", "", "", "", ""}, // not accumuative W/m2
  {"ULWRF_NTAT_0", "", "", "", "", "", "", "", ""}, // not accumuative W/m2
  {"SHTFL_SFC_0", "", "", "", "", "", "", "", ""}, // not accumuative W/m2
  {"LHTFL_SFC_0", "", "", "", "", "", "", "", ""}, // not accumuative W/m2

  {"SHOWA_SFC_0", "", "", "", "", "", "", "", ""},
  {"4LFTX_SFC_0", "", "", "", "", "", "", "", ""},
  {"CAPE_ETAL_10000", "", "", "", "", "", "", "", ""},
  {"HLCY_ETAL_10000", "", "", "", "", "", "", "", ""},

  {"WTMP_SFC_0", "", "", "", "", "", "", "", ""},
  {"ICEC_SFC_0", "", "", "", "", "", "", "", ""},
  {"LAND_SFC_0", "", "", "", "", "", "", "", ""},

  {"SNOD_SFC_0", "", "", "", "", "", "", "", ""},
  {"WEASD_SFC_0", "", "", "", "", "", "", "", ""},
  {"TSOIL_DBLL_10c", "", "", "", "", "", "", "", ""},
  {"VSOILM_DBLL_10c", "", "", "", "", "", "", "", ""},

  {""         ,             "",             "",             "", "ABSV_ISBL_1000", "ABSV_ISBL_0850", "ABSV_ISBL_0700", "ABSV_ISBL_0500", "ABSV_ISBL_0250"},
  {""         ,             "",             "",             "", "VVEL_ISBL_1000", "VVEL_ISBL_0850", "VVEL_ISBL_0700", "VVEL_ISBL_0500", "VVEL_ISBL_0250"},
  {"HGT_SFC_0",             "",             "",             "",  "HGT_ISBL_1000",  "HGT_ISBL_0850",  "HGT_ISBL_0700",  "HGT_ISBL_0500",  "HGT_ISBL_0250"},

  {"TMP_TGL_2",    "TMP_TGL_40",  "TMP_TGL_80",  "TMP_TGL_120",  "TMP_ISBL_1000", "TMP_ISBL_0850",  "TMP_ISBL_0700",  "TMP_ISBL_0500",  "TMP_ISBL_0250"},
  {"DPT_TGL_2",    "DPT_TGL_40",  "DPT_TGL_80",  "DPT_TGL_120",               "",              "",               "",               "",               ""},
  {"DEPR_TGL_2",  "DEPR_TGL_40", "DEPR_TGL_80", "DEPR_TGL_120", "DEPR_ISBL_1000", "DEPR_ISBL_0850", "DEPR_ISBL_0700", "DEPR_ISBL_0500", "DEPR_ISBL_0250"},
  {"SPFH_TGL_2",  "SPFH_TGL_40", "SPFH_TGL_80", "SPFH_TGL_120", "SPFH_ISBL_1000", "SPFH_ISBL_0850", "SPFH_ISBL_0700", "SPFH_ISBL_0500", "SPFH_ISBL_0250"},
  {"RH_TGL_2",      "RH_TGL_40",   "RH_TGL_80",   "RH_TGL_120",   "RH_ISBL_1000",   "RH_ISBL_0850",   "RH_ISBL_0700",   "RH_ISBL_0500",   "RH_ISBL_0250"},

  {"UGRD_TGL_10", "UGRD_TGL_40", "UGRD_TGL_80", "UGRD_TGL_120", "UGRD_ISBL_1000", "UGRD_ISBL_0850", "UGRD_ISBL_0700", "UGRD_ISBL_0500", "UGRD_ISBL_0250"},
  {"VGRD_TGL_10", "VGRD_TGL_40", "VGRD_TGL_80", "VGRD_TGL_120", "VGRD_ISBL_1000", "VGRD_ISBL_0850", "VGRD_ISBL_0700", "VGRD_ISBL_0500", "VGRD_ISBL_0250"},
  {"WIND_TGL_10", "WIND_TGL_40", "WIND_TGL_80", "WIND_TGL_120", "WIND_ISBL_1000", "WIND_ISBL_0850", "WIND_ISBL_0700", "WIND_ISBL_0500", "WIND_ISBL_0250"},
  {"WDIR_TGL_10", "WDIR_TGL_40", "WDIR_TGL_80", "WDIR_TGL_120", "WDIR_ISBL_1000", "WDIR_ISBL_0850", "WDIR_ISBL_0700", "WDIR_ISBL_0500", "WDIR_ISBL_0250"},

  {"WVDIR_SFC_0", "", "", "", "", "", "", "", ""},
  {"SWDIR_SFC_0", "", "", "", "", "", "", "", ""},
  {"WVHGT_SFC_0", "", "", "", "", "", "", "", ""},
  {"SWELL_SFC_0", "", "", "", "", "", "", "", ""},
  {"HTSGW_SFC_0", "", "", "", "", "", "", "", ""},
  {"PWPER_SFC_0", "", "", "", "", "", "", "", ""},
  {"WVPER_SFC_0", "", "", "", "", "", "", "", ""},
  {"SWPER_SFC_0", "", "", "", "", "", "", "", ""},

  {"HG_TGL_0", "", "", "", "", "", "", "", ""},
  {"WVX_TGL_0", "", "", "", "", "", "", "", ""},
  {"WVY_TGL_0", "", "", "", "", "", "", "", ""},
  {"WVMD_TGL_0", "", "", "", "", "", "", "", ""},
  {"WVDR_TGL_0", "", "", "", "", "", "", "", ""},
  {"FRO_TGL_0", "", "", "", "", "", "", "", ""},
  {"VCIS_TGL_0", "", "", "", "", "", "", "", ""},
  {"QSP_TGL_0", "", "", "", "", "", "", "", ""},
  {"TDI_TGL_0", "", "", "", "", "", "", "", ""},
  {"TMPIL_TGL_0", "", "", "", "", "", "", "", ""},

  {"PRMSL_MSL_0", "", "", "", "", "", "", "", ""},
  {"PRES_SFC_0", "", "", "", "", "", "", "", ""},
  {"HGT", "", "", "", "", "", "", "", ""}, // cloud ceiling
  {"HGT", "", "", "", "", "", "", "", ""}, // cloud top
  {"HCDC_SFC_0", "", "", "", "", "", "", "", ""},
  {"MCDC_SFC_0", "", "", "", "", "", "", "", ""},
  {"LCDC_SFC_0", "", "", "", "", "", "", "", ""},
  {"TCDC_SFC_0", "", "", "", "", "", "", "", ""},
  {"ALBDO_SFC_0", "", "", "", "", "", "", "", ""},

  {"SOLAR_HOR", "", "", "", "", "", "", "", ""}, // to be post-processed
  {"SOLAR_DIF", "", "", "", "", "", "", "", ""}, // to be post-processed
  {"SOLAR_DIR", "", "", "", "", "", "", "", ""}, // to be post-processed

  {"EFFECT_DIR", "", "", "", "", "", "", "", ""}, // to be post-processed
  {"EFFECT_DIF", "", "", "", "", "", "", "", ""}, // to be post-processed

  {"SOLAR_TRK", "", "", "", "", "", "", "", ""}, // to be post-processed
  {"SOLAR_LAT", "", "", "", "", "", "", "", ""}, // to be post-processed
  {"SOLAR_S45", "", "", "", "", "", "", "", ""}, // to be post-processed
  {"SOLAR_S00", "", "", "", "", "", "", "", ""}, // to be post-processed
  {"SOLAR_N00", "", "", "", "", "", "", "", ""}, // to be post-processed
  {"SOLAR_E00", "", "", "", "", "", "", "", ""}, // to be post-processed
  {"SOLAR_W00", "", "", "", "", "", "", "", ""}, // to be post-processed

  {"WPOW_TGL_10", "WPOW_TGL_40", "WPOW_TGL_80", "WPOW_TGL_120", "WPOW_ISBL_1000", "WPOW_ISBL_0850", "WPOW_ISBL_0700", "WPOW_ISBL_0500", "WPOW_ISBL_0250"}, // to be post-processed

  {"FLOWxONLY_TGL_10", "FLOWxONLY_TGL_40", "FLOWxONLY_TGL_80", "FLOWxONLY_TGL_120", "FLOWxONLY_ISBL_1000", "FLOWxONLY_ISBL_0850", "FLOWxONLY_ISBL_0700", "FLOWxONLY_ISBL_0500", "FLOWxONLY_ISBL_0250"}, // to be post-processed
  {"FLOWxPRM_TGL_10",  "FLOWxPRM_TGL_40",  "FLOWxPRM_TGL_80",  "FLOWxPRM_TGL_120",  "FLOWxPRM_ISBL_1000",  "FLOWxPRM_ISBL_0850",   "FLOWxPRM_ISBL_0700",  "FLOWxPRM_ISBL_0500",  "FLOWxPRM_ISBL_0250"}, // to be post-processed
  {"FLOWxPCP_TGL_10",  "FLOWxPCP_TGL_40",  "FLOWxPCP_TGL_80",  "FLOWxPCP_TGL_120",  "FLOWxPCP_ISBL_1000",  "FLOWxPCP_ISBL_0850",   "FLOWxPCP_ISBL_0700",  "FLOWxPCP_ISBL_0500",  "FLOWxPCP_ISBL_0250"}, // to be post-processed
  {"FLOWxEFF_TGL_10",  "FLOWxEFF_TGL_40",  "FLOWxEFF_TGL_80",  "FLOWxEFF_TGL_120",  "FLOWxEFF_ISBL_1000",  "FLOWxEFF_ISBL_0850",   "FLOWxEFF_ISBL_0700",  "FLOWxEFF_ISBL_0500",  "FLOWxEFF_ISBL_0250"}, // to be post-processed

};

int num_Levels = 0;
int addLevel () {
  num_Levels += 1;
  return(num_Levels - 1);
}

int LEVEL_surface    = addLevel();
int LEVEL_40m        = addLevel();
int LEVEL_80m        = addLevel();
int LEVEL_120m       = addLevel();
int LEVEL_ISBL_1000  = addLevel();
int LEVEL_ISBL_0850  = addLevel();
int LEVEL_ISBL_0650  = addLevel();
int LEVEL_ISBL_0450  = addLevel();
int LEVEL_ISBL_0250  = addLevel();

int num_Layers = 0;
int addLayer () {
  num_Layers += 1;
  return(num_Layers - 1);
}

int LAYER_pastsnow           = addLayer();
int LAYER_pastprecip         = addLayer();
int LAYER_preciprate         = addLayer();
int LAYER_precipitation      = addLayer();
int LAYER_rain               = addLayer();
int LAYER_freezingrain       = addLayer();
int LAYER_icepellets         = addLayer();
int LAYER_snow               = addLayer();

int LAYER_solarcomingshort   = addLayer();
int LAYER_solarabsrbdlong    = addLayer();
int LAYER_solarabsrbdshort   = addLayer();
int LAYER_solardownlong      = addLayer();
int LAYER_solardownshort     = addLayer();
int LAYER_solaruplong        = addLayer();
int LAYER_solarupshort       = addLayer();
int LAYER_surfsensibleheat   = addLayer();
int LAYER_surflatentheat     = addLayer();

int LAYER_surfshowalter      = addLayer();
int LAYER_surflifted         = addLayer();

int LAYER_convpotenergy      = addLayer();
int LAYER_surfhelicity       = addLayer();

int LAYER_watertemperature   = addLayer();
int LAYER_ice                = addLayer();
int LAYER_land               = addLayer();

int LAYER_depthsnow          = addLayer();
int LAYER_watersnow          = addLayer();
int LAYER_soiltemperature    = addLayer();
int LAYER_soilmoisture       = addLayer();

int LAYER_absolutevorticity  = addLayer();
int LAYER_verticalvelocity   = addLayer();
int LAYER_height             = addLayer();

int LAYER_drybulb            = addLayer();
int LAYER_dewpoint           = addLayer();
int LAYER_depression         = addLayer();
int LAYER_spchum             = addLayer();
int LAYER_relhum             = addLayer();

int LAYER_windU              = addLayer();
int LAYER_windV              = addLayer();
int LAYER_windspd            = addLayer();
int LAYER_winddir            = addLayer();

int LAYER_windwavedirtrue    = addLayer();
int LAYER_swellwavedirtrue   = addLayer();
int LAYER_windwavesheight    = addLayer();
int LAYER_swellwavesheight   = addLayer();
int LAYER_combwavesheight    = addLayer();
int LAYER_peakwaveperiod     = addLayer();
int LAYER_windwaveperiod     = addLayer();
int LAYER_swellwaveperiod    = addLayer();

int LAYER_Water_level_above_mean_sea_level  = addLayer();
int LAYER_X_component_of_the_water_velocity = addLayer();
int LAYER_Y_component_of_the_water_velocity = addLayer();
int LAYER_Modulus_of_the_water_velocity     = addLayer();
int LAYER_Direction_of_the_water_velocity   = addLayer();
int LAYER_Froude_number                     = addLayer();
int LAYER_Shear_of_the_water_velocity       = addLayer();
int LAYER_Specific_discharge                = addLayer();
int LAYER_Water_Transport_Diffusion_Index   = addLayer();
int LAYER_Water_temperature                 = addLayer();

int LAYER_meanpressure       = addLayer();
int LAYER_surfpressure       = addLayer();
int LAYER_cloudceiling       = addLayer();
int LAYER_cloudtop           = addLayer();
int LAYER_cloudhigh          = addLayer();
int LAYER_cloudmiddle        = addLayer();
int LAYER_cloudlow           = addLayer();
int LAYER_cloudcover         = addLayer();
int LAYER_albedo             = addLayer();
//---------------------------
int NumberOfRawDataLayers = LAYER_albedo;
//---------------------------
int LAYER_glohorrad          = addLayer();
int LAYER_difhorrad          = addLayer();
int LAYER_dirnorrad          = addLayer();
int LAYER_dirnoreff          = addLayer();
int LAYER_difhoreff          = addLayer();
int LAYER_tracker            = addLayer();
int LAYER_fixlat             = addLayer();
int LAYER_south45            = addLayer();
int LAYER_south00            = addLayer();
int LAYER_north00            = addLayer();
int LAYER_east00             = addLayer();
int LAYER_west00             = addLayer();

int LAYER_windpower          = addLayer();
int LAYER_flowXonly          = addLayer();
int LAYER_flowXmeanpressure  = addLayer();
int LAYER_flowXprecipitation = addLayer();
int LAYER_flowXdirecteffect  = addLayer();

int[] DATA_allLayers = new int[0];
int[] DATA_allLevels = new int[0];

//setting program arguments

{
  for (int i = 0 ; i < args.length ; i++) {
    String CAP_arg = args[i].toUpperCase();

    int _at = 0;
    int input_int = 0;
    float input_float = 0;
    String input_str = "";
    String[] _tokens;

    _at = CAP_arg.indexOf("TMPDIR");
    if (_at == 0) {
      _tokens = split(args[i], '=');
      if (_tokens.length > 1) {
        input_str = _tokens[1];
        TempFolder = input_str;
        println("TempFolder is set to: '" + TempFolder + "'");
      }
    }

    _at = CAP_arg.indexOf("OUTDIR");
    if (_at == 0) {
      _tokens = split(args[i], '=');
      if (_tokens.length > 1) {
        input_str = _tokens[1];
        OutputFolder = input_str;
        println("OutputFolder is set to: '" + OutputFolder + "'");
      }
    }

    _at = CAP_arg.indexOf("DOMAIN");
    if (_at == 0) {
      _tokens = split(CAP_arg, '=');
      if (_tokens.length > 1) {
        input_str = _tokens[1];

        Current_domainID = -1;
        for (int q = 0; q < DATA_allDomains.length; q++) {
          if (input_str.equals(DATA_allDomains[q][DOMAIN_PROPERTY00].toUpperCase())) {
            Current_domainID = q;
            println("Domain is set to:", DATA_allDomains[q][DOMAIN_PROPERTY00]);
            break;
          }
        }
      }
    }

    _at = CAP_arg.indexOf("LEVELS+");
    if (_at == 0) {
      _tokens = split(CAP_arg, '=');
      if (_tokens.length > 1) {
        input_str = _tokens[1];

        int[] newLevel = {-1};

             if (input_str.equals("surface".toUpperCase())) {
                newLevel[0] = LEVEL_surface;
        }
        else if (input_str.equals("40m".toUpperCase())) {
                newLevel[0] = LEVEL_40m;
        }
        else if (input_str.equals("80m".toUpperCase())) {
                newLevel[0] = LEVEL_80m;
        }
        else if (input_str.equals("120m".toUpperCase())) {
                newLevel[0] = LEVEL_120m;
        }
        else if (input_str.equals("ISBL_1000".toUpperCase())) {
                newLevel[0] = LEVEL_ISBL_1000;
        }
        else if (input_str.equals("ISBL_0850".toUpperCase())) {
                newLevel[0] = LEVEL_ISBL_0850;
        }
        else if (input_str.equals("ISBL_0650".toUpperCase())) {
                newLevel[0] = LEVEL_ISBL_0650;
        }
        else if (input_str.equals("ISBL_0450".toUpperCase())) {
                newLevel[0] = LEVEL_ISBL_0450;
        }
        else if (input_str.equals("ISBL_0250".toUpperCase())) {
                newLevel[0] = LEVEL_ISBL_0250;
        }

        if (newLevel[0] != -1) {
          DATA_allLevels = (int[]) concat (DATA_allLevels, newLevel);
        }
      }
    }

    _at = CAP_arg.indexOf("LAYERS+");
    if (_at == 0) {
      _tokens = split(CAP_arg, '=');
      if (_tokens.length > 1) {
        input_str = _tokens[1];

        int[] newLayer = {-1};

             if (input_str.equals("pastsnow".toUpperCase())) {
                newLayer[0] = LAYER_pastsnow;
        }
        else if (input_str.equals("pastprecip".toUpperCase())) {
                newLayer[0] = LAYER_pastprecip;
        }
        else if (input_str.equals("preciprate".toUpperCase())) {
                newLayer[0] = LAYER_preciprate;
        }
        else if (input_str.equals("precipitation".toUpperCase())) {
                newLayer[0] = LAYER_precipitation;
        }
        else if (input_str.equals("rain".toUpperCase())) {
                newLayer[0] = LAYER_rain;
        }
        else if (input_str.equals("freezingrain".toUpperCase())) {
                newLayer[0] = LAYER_freezingrain;
        }
        else if (input_str.equals("icepellets".toUpperCase())) {
                newLayer[0] = LAYER_icepellets;
        }
        else if (input_str.equals("snow".toUpperCase())) {
                newLayer[0] = LAYER_snow;
        }
        else if (input_str.equals("solarcomingshort".toUpperCase())) {
                newLayer[0] = LAYER_solarcomingshort;
        }
        else if (input_str.equals("solarabsrbdlong".toUpperCase())) {
                newLayer[0] = LAYER_solarabsrbdlong;
        }
        else if (input_str.equals("solarabsrbdshort".toUpperCase())) {
                newLayer[0] = LAYER_solarabsrbdshort;
        }
        else if (input_str.equals("solardownlong".toUpperCase())) {
                newLayer[0] = LAYER_solardownlong;
        }
        else if (input_str.equals("solardownshort".toUpperCase())) {
                newLayer[0] = LAYER_solardownshort;
        }
        else if (input_str.equals("solaruplong".toUpperCase())) {
                newLayer[0] = LAYER_solaruplong;
        }
        else if (input_str.equals("solarupshort".toUpperCase())) {
                newLayer[0] = LAYER_solarupshort;
        }
        else if (input_str.equals("surfsensibleheat".toUpperCase())) {
                newLayer[0] = LAYER_surfsensibleheat;
        }
        else if (input_str.equals("surflatentheat".toUpperCase())) {
                newLayer[0] = LAYER_surflatentheat;
        }
        else if (input_str.equals("surfshowalter".toUpperCase())) {
                newLayer[0] = LAYER_surfshowalter;
        }
        else if (input_str.equals("surflifted".toUpperCase())) {
                newLayer[0] = LAYER_surflifted;
        }
        else if (input_str.equals("convpotenergy".toUpperCase())) {
                newLayer[0] = LAYER_convpotenergy;
        }
        else if (input_str.equals("surfhelicity".toUpperCase())) {
                newLayer[0] = LAYER_surfhelicity;
        }
        else if (input_str.equals("watertemperature".toUpperCase())) {
                newLayer[0] = LAYER_watertemperature;
        }
        else if (input_str.equals("ice".toUpperCase())) {
                newLayer[0] = LAYER_ice;
        }
        else if (input_str.equals("land".toUpperCase())) {
                newLayer[0] = LAYER_land;
        }
        else if (input_str.equals("depthsnow".toUpperCase())) {
                newLayer[0] = LAYER_depthsnow;
        }
        else if (input_str.equals("watersnow".toUpperCase())) {
                newLayer[0] = LAYER_watersnow;
        }
        else if (input_str.equals("soiltemperature".toUpperCase())) {
                newLayer[0] = LAYER_soiltemperature;
        }
        else if (input_str.equals("soilmoisture".toUpperCase())) {
                newLayer[0] = LAYER_soilmoisture;
        }
        else if (input_str.equals("absolutevorticity".toUpperCase())) {
                newLayer[0] = LAYER_absolutevorticity;
        }
        else if (input_str.equals("verticalvelocity".toUpperCase())) {
                newLayer[0] = LAYER_verticalvelocity;
        }
        else if (input_str.equals("height".toUpperCase())) {
                newLayer[0] = LAYER_height;
        }
        else if (input_str.equals("drybulb".toUpperCase())) {
                newLayer[0] = LAYER_drybulb;
        }
        else if (input_str.equals("dewpoint".toUpperCase())) {
                newLayer[0] = LAYER_dewpoint;
        }
        else if (input_str.equals("depression".toUpperCase())) {
                newLayer[0] = LAYER_depression;
        }
        else if (input_str.equals("spchum".toUpperCase())) {
                newLayer[0] = LAYER_spchum;
        }
        else if (input_str.equals("relhum".toUpperCase())) {
                newLayer[0] = LAYER_relhum;
        }
        else if (input_str.equals("windU".toUpperCase())) {
                newLayer[0] = LAYER_windU;
        }
        else if (input_str.equals("windV".toUpperCase())) {
                newLayer[0] = LAYER_windV;
        }
        else if (input_str.equals("windspd".toUpperCase())) {
                newLayer[0] = LAYER_windspd;
        }
        else if (input_str.equals("winddir".toUpperCase())) {
                newLayer[0] = LAYER_winddir;
        }
        else if (input_str.equals("windwavedirtrue".toUpperCase())) {
                newLayer[0] = LAYER_windwavedirtrue;
        }
        else if (input_str.equals("swellwavedirtrue".toUpperCase())) {
                newLayer[0] = LAYER_swellwavedirtrue;
        }
        else if (input_str.equals("windwavesheight".toUpperCase())) {
                newLayer[0] = LAYER_windwavesheight;
        }
        else if (input_str.equals("swellwavesheight".toUpperCase())) {
                newLayer[0] = LAYER_swellwavesheight;
        }
        else if (input_str.equals("combwavesheight".toUpperCase())) {
                newLayer[0] = LAYER_combwavesheight;
        }
        else if (input_str.equals("peakwaveperiod".toUpperCase())) {
                newLayer[0] = LAYER_peakwaveperiod;
        }
        else if (input_str.equals("windwaveperiod".toUpperCase())) {
                newLayer[0] = LAYER_windwaveperiod;
        }
        else if (input_str.equals("swellwaveperiod".toUpperCase())) {
                newLayer[0] = LAYER_swellwaveperiod;
        }
        else if (input_str.equals("Water_level_above_mean_sea_level".toUpperCase())) {
                newLayer[0] = LAYER_Water_level_above_mean_sea_level;
        }
        else if (input_str.equals("X_component_of_the_water_velocity".toUpperCase())) {
                newLayer[0] = LAYER_X_component_of_the_water_velocity;
        }
        else if (input_str.equals("Y_component_of_the_water_velocity".toUpperCase())) {
                newLayer[0] = LAYER_Y_component_of_the_water_velocity;
        }
        else if (input_str.equals("Modulus_of_the_water_velocity".toUpperCase())) {
                newLayer[0] = LAYER_Modulus_of_the_water_velocity;
        }
        else if (input_str.equals("Direction_of_the_water_velocity".toUpperCase())) {
                newLayer[0] = LAYER_Direction_of_the_water_velocity;
        }
        else if (input_str.equals("Froude_number".toUpperCase())) {
                newLayer[0] = LAYER_Froude_number;
        }
        else if (input_str.equals("Shear_of_the_water_velocity".toUpperCase())) {
                newLayer[0] = LAYER_Shear_of_the_water_velocity;
        }
        else if (input_str.equals("Specific_discharge".toUpperCase())) {
                newLayer[0] = LAYER_Specific_discharge;
        }
        else if (input_str.equals("Water_Transport_Diffusion_Index".toUpperCase())) {
                newLayer[0] = LAYER_Water_Transport_Diffusion_Index;
        }
        else if (input_str.equals("Water_temperature".toUpperCase())) {
                newLayer[0] = LAYER_Water_temperature;
        }
        else if (input_str.equals("meanpressure".toUpperCase())) {
                newLayer[0] = LAYER_meanpressure;
        }
        else if (input_str.equals("surfpressure".toUpperCase())) {
                newLayer[0] = LAYER_surfpressure;
        }
        else if (input_str.equals("cloudceiling".toUpperCase())) {
                newLayer[0] = LAYER_cloudceiling;
        }
        else if (input_str.equals("cloudtop".toUpperCase())) {
                newLayer[0] = LAYER_cloudtop;
        }
        else if (input_str.equals("cloudhigh".toUpperCase())) {
                newLayer[0] = LAYER_cloudhigh;
        }
        else if (input_str.equals("cloudmiddle".toUpperCase())) {
                newLayer[0] = LAYER_cloudmiddle;
        }
        else if (input_str.equals("cloudlow".toUpperCase())) {
                newLayer[0] = LAYER_cloudlow;
        }
        else if (input_str.equals("cloudcover".toUpperCase())) {
                newLayer[0] = LAYER_cloudcover;
        }
        else if (input_str.equals("albedo".toUpperCase())) {
                newLayer[0] = LAYER_albedo;
        }
        else if (input_str.equals("glohorrad".toUpperCase())) {
                newLayer[0] = LAYER_glohorrad;
        }
        else if (input_str.equals("difhorrad".toUpperCase())) {
                newLayer[0] = LAYER_difhorrad;
        }
        else if (input_str.equals("dirnorrad".toUpperCase())) {
                newLayer[0] = LAYER_dirnorrad;
        }
        else if (input_str.equals("dirnoreff".toUpperCase())) {
                newLayer[0] = LAYER_dirnoreff;
        }
        else if (input_str.equals("difhoreff".toUpperCase())) {
                newLayer[0] = LAYER_difhoreff;
        }
        else if (input_str.equals("tracker".toUpperCase())) {
                newLayer[0] = LAYER_tracker;
        }
        else if (input_str.equals("fixlat".toUpperCase())) {
                newLayer[0] = LAYER_fixlat;
        }
        else if (input_str.equals("south45".toUpperCase())) {
                newLayer[0] = LAYER_south45;
        }
        else if (input_str.equals("south00".toUpperCase())) {
                newLayer[0] = LAYER_south00;
        }
        else if (input_str.equals("north00".toUpperCase())) {
                newLayer[0] = LAYER_north00;
        }
        else if (input_str.equals("east00".toUpperCase())) {
                newLayer[0] = LAYER_east00;
        }
        else if (input_str.equals("west00".toUpperCase())) {
                newLayer[0] = LAYER_west00;
        }
        else if (input_str.equals("windpower".toUpperCase())) {
                newLayer[0] = LAYER_windpower;
        }
        else if (input_str.equals("flowXonly".toUpperCase())) {
                newLayer[0] = LAYER_flowXonly;
        }
        else if (input_str.equals("flowXmeanpressure".toUpperCase())) {
                newLayer[0] = LAYER_flowXmeanpressure;
        }
        else if (input_str.equals("flowXprecipitation".toUpperCase())) {
                newLayer[0] = LAYER_flowXprecipitation;
        }
        else if (input_str.equals("flowXdirecteffect".toUpperCase())) {
                newLayer[0] = LAYER_flowXdirecteffect;
        }

        if (newLayer[0] != -1) {
          DATA_allLayers = (int[]) concat (DATA_allLayers, newLayer);
        }
      }
    }

    _at = CAP_arg.indexOf("RUN");
    if (_at == 0) {
      _tokens = split(CAP_arg, '=');
      if (_tokens.length > 1) {
        input_int = int(_tokens[1].replace("Z", ""));
        DATA_ModelRun = input_int;
        println("ModelRun is set to:", DATA_ModelRun);
      }
    }

    _at = CAP_arg.indexOf("BEGIN");
    if (_at == 0) {
      _tokens = split(CAP_arg, '=');
      if (_tokens.length > 1) {
        input_int = int(_tokens[1]);
        DATA_ModelBegin = input_int;
        println("ModelBegin is set to:", DATA_ModelBegin);
      }
    }

    _at = CAP_arg.indexOf("END");
    if (_at == 0) {
      _tokens = split(CAP_arg, '=');
      if (_tokens.length > 1) {
        input_int = int(_tokens[1]);
        DATA_ModelEnd = input_int;
        println("ModelEnd is set to:", DATA_ModelEnd);
      }
    }

    _at = CAP_arg.indexOf("STEP");
    if (_at == 0) {
      _tokens = split(CAP_arg, '=');
      if (_tokens.length > 1) {
        input_int = int(_tokens[1]);
        DATA_ModelStep = input_int;
        println("ModelStep is set to:", DATA_ModelStep);
      }
    }

    _at = CAP_arg.indexOf("DAY");
    if (_at == 0) {
      _tokens = split(CAP_arg, '=');
      if (_tokens.length > 1) {
        input_int = int(_tokens[1]);
        DATA_ModelDay = input_int;
        println("ModelDay is set to:", DATA_ModelDay);
      }
    }

    _at = CAP_arg.indexOf("MONTH");
    if (_at == 0) {
      _tokens = split(CAP_arg, '=');
      if (_tokens.length > 1) {
        input_int = int(_tokens[1]);
        DATA_ModelMonth = input_int;
        println("ModelMonth is set to:", DATA_ModelMonth);
      }
    }

    _at = CAP_arg.indexOf("YEAR");
    if (_at == 0) {
      _tokens = split(CAP_arg, '=');
      if (_tokens.length > 1) {
        input_int = int(_tokens[1]);
        DATA_ModelYear = input_int;
        println("ModelYear is set to:", DATA_ModelYear);
      }
    }

    _at = CAP_arg.indexOf("AUTO");
    if (_at == 0) {
      _tokens = split(CAP_arg, '=');
      if (_tokens.length > 1) {
        input_str = _tokens[1];
        if (input_str.equals("USER")) automated = USER_INT;
        else if (input_str.equals("PDF")) automated = AUTO_PDF;
        else if (input_str.equals("GIF")) automated = AUTO_GIF;
        else if (input_str.equals("BMP")) automated = AUTO_BMP;
        else if (input_str.equals("JPG")) automated = AUTO_JPG;
        else if (input_str.equals("PNG")) automated = AUTO_PNG;
        else if (input_str.equals("TIF")) automated = AUTO_TIF;
      }
    }
  }

  if ((DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("RDWPS")) ||
      (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("GDWPS")) ||
      (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("GEPS"))) {
    EARTH_BitmapChoice = 1;
  }

/*

  if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("SHOP")) {
    int[] DATA_newLayers = {
      LAYER_Water_temperature,
      LAYER_Water_level_above_mean_sea_level,
      //LAYER_X_component_of_the_water_velocity,
      //LAYER_Y_component_of_the_water_velocity,
      //LAYER_Modulus_of_the_water_velocity,
      //LAYER_Direction_of_the_water_velocity,
      //LAYER_Froude_number,
      //LAYER_Shear_of_the_water_velocity,
      //LAYER_Specific_discharge,
      //LAYER_Water_Transport_Diffusion_Index,
    };

    DATA_allLayers = DATA_newLayers;
  }
  else if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("RDWPS")) {
    int[] DATA_newLayers = {
      LAYER_windwavesheight,
      LAYER_swellwavesheight,
      LAYER_combwavesheight,
      LAYER_peakwaveperiod,
      LAYER_windwaveperiod,
      LAYER_swellwaveperiod,
      LAYER_windU,
      LAYER_windV,
      LAYER_meanpressure,
      LAYER_flowXmeanpressure,
    };

    DATA_allLayers = DATA_newLayers;
  }
  else if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("SNOW")) {
    int[] DATA_newLayers = {
      LAYER_pastsnow,
    };

    DATA_allLayers = DATA_newLayers;
  }
  else if ((DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("RDPA")) ||
           (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("HRDPA")) {
    int[] DATA_newLayers = {
      LAYER_pastprecip,
    };

    DATA_allLayers = DATA_newLayers;
  }
  else if ((DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("GEPS")) ||
           (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("REPS"))) {
    int[] DATA_newLayers = {
      LAYER_drybulb,

      LAYER_meanpressure,

      LAYER_windU,
      LAYER_windV,

      LAYER_precipitation,

      //LAYER_cloudcover,
      //LAYER_albedo,

      LAYER_flowXmeanpressure,
      LAYER_flowXprecipitation,
    };

    DATA_allLayers = DATA_newLayers;
  }
  else if ((DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("GDPS")) ||
           (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("RDPS")) ||
           (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("HRDPS"))) {
    int[] DATA_newLayers = {
      LAYER_drybulb,
    //  LAYER_dewpoint,
    //  LAYER_depression,
    //  LAYER_spchum,
    //  LAYER_relhum,

      LAYER_meanpressure,
    //  LAYER_surfpressure,

      LAYER_windU,
      LAYER_windV,
    //  LAYER_windspd,
    //  LAYER_winddir,

    //  LAYER_pastsnow
    //  LAYER_pastprecip,
    //  LAYER_preciprate,
      LAYER_precipitation,
    //  LAYER_rain,
    //  LAYER_freezingrain,
    //  LAYER_icepellets,
    //  LAYER_snow,

    //  LAYER_solarcomingshort,
    //  LAYER_solarabsrbdlong,
    //  LAYER_solarabsrbdshort,
    //  LAYER_solardownlong,
    //  LAYER_solardownshort,
    //  LAYER_solaruplong,
    //  LAYER_solarupshort,
    //  LAYER_surfsensibleheat,
    //  LAYER_surflatentheat,

    //  LAYER_surfshowalter,
    //  LAYER_surflifted,

    //  LAYER_convpotenergy,
    //  LAYER_surfhelicity,

    //  LAYER_watertemperature,
    //  LAYER_ice,
    //  LAYER_land,

    //  LAYER_depthsnow,
    //  LAYER_watersnow,
    //  LAYER_soiltemperature,
    //  LAYER_soilmoisture,

    //  LAYER_absolutevorticity,
    //  LAYER_verticalvelocity,
    //  LAYER_height,

    //  LAYER_cloudceiling,
    //  LAYER_cloudtop,
    //  LAYER_cloudhigh,
    //  LAYER_cloudmiddle,
    //  LAYER_cloudlow,
      LAYER_cloudcover,
      LAYER_albedo,

      LAYER_glohorrad,
      LAYER_difhorrad,
      LAYER_dirnorrad,
      LAYER_dirnoreff,
      //LAYER_difhoreff,
      //LAYER_tracker,
      //LAYER_fixlat,
      //LAYER_south45,
      LAYER_south00,
      //LAYER_north00,
      //LAYER_east00,
      //LAYER_west00,

      LAYER_windspd,
      //LAYER_windpower,
      //LAYER_flowXonly,
      LAYER_flowXmeanpressure,
      LAYER_flowXprecipitation,
      //LAYER_flowXdirecteffect,

    };

    DATA_allLayers = DATA_newLayers;
  }
  else if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("HRRR")) {
    int[] DATA_newLayers = {
      LAYER_drybulb,
      //LAYER_dewpoint,
      //LAYER_spchum,
      LAYER_relhum,

      LAYER_meanpressure,
      //LAYER_surfpressure,

      LAYER_windU,
      LAYER_windV,

      //LAYER_preciprate,
      LAYER_precipitation,
      //LAYER_rain,
      //LAYER_freezingrain,
      //LAYER_icepellets,
      //LAYER_snow,

      //LAYER_cloudcover,

      LAYER_flowXprecipitation,
    };

    DATA_allLayers = DATA_newLayers;
  }
  else {
    int[] DATA_newLayers = {
      LAYER_meanpressure,
    };

    DATA_allLayers = DATA_newLayers;
  }
  DATA_numMembers

*/

  DATA_numLevels = DATA_allLevels.length;
  DATA_numLayers = DATA_allLayers.length;
  DATA_numMembers = int(DATA_allDomains[Current_domainID][DOMAIN_PROPERTY09]);
  if (DATA_ModelStep == -1) { // use the default interval value of the model, if the interval is not defined by the arguments
    DATA_ModelStep = int(DATA_allDomains[Current_domainID][DOMAIN_PROPERTY10]);
  }
  DATA_numTimes = 1 + floor((DATA_ModelEnd - DATA_ModelBegin) / DATA_ModelStep);

  if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY02].equals("NOAA")) {
    for (int i = 0; i < DATA_ParameterLevel.length; i++) {
      for (int j = 0; j < DATA_ParameterLevel[i].length; j++) {
        if (DATA_ParameterLevel[i][j].equals("PRMSL_MSL_0")) { DATA_ParameterLevel[i][j] = "MSLMA_MSL_0"; }
        if (DATA_ParameterLevel[i][j].equals("ARAIN_SFC_0")) { DATA_ParameterLevel[i][j] = "CRAIN_SFC_0"; }
        if (DATA_ParameterLevel[i][j].equals("AFRAIN_SFC_0")) { DATA_ParameterLevel[i][j] = "CFRZR_SFC_0"; }
        if (DATA_ParameterLevel[i][j].equals("AICEP_SFC_0")) { DATA_ParameterLevel[i][j] = "CICEP_SFC_0"; }
        if (DATA_ParameterLevel[i][j].equals("ASNOW_SFC_0")) { DATA_ParameterLevel[i][j] = "CSNOW_SFC_0"; }
      }
    }
  }

  // copying surface definitaion for levels above in case they were empty
  for (int i = 0; i < DATA_ParameterLevel.length; i++) {
    for (int j = 1; j < DATA_ParameterLevel[i].length; j++) {
      if (DATA_ParameterLevel[i][j].equals("")) {
        DATA_ParameterLevel[i][j] = DATA_ParameterLevel[i][0];
      }
    }
  }
}

int SOLARCHVISION_H_Pixel = 550;
int SOLARCHVISION_W_Pixel = int(SOLARCHVISION_H_Pixel * 2.0);

float MessageSize =  SOLARCHVISION_W_Pixel / 120.0; // screen width

int SOLARCHVISION_A_Pixel = 0; //int(1.5 * MessageSize); // menu bar
int SOLARCHVISION_B_Pixel = int(3.0 * MessageSize); // 3D tool bar
int SOLARCHVISION_C_Pixel = int(3.0 * MessageSize); // command bar
int SOLARCHVISION_D_Pixel = int(7.5 * MessageSize); // time bar
{
  if (automated != USER_INT) { // remove upper and lower bars
    SOLARCHVISION_A_Pixel = 0;
    SOLARCHVISION_D_Pixel = 0;
  }
}

int SavedScreenShots = 0;

int Current_statisticID = 0;
int Current_layerID = 0;
int Current_levelID = 0;
int Current_memberID = 0;
int Current_timeID = 0;

int pre_Current_statisticID = -1;
int pre_Current_layerID = -1;
int pre_Current_levelID = -1;
int pre_Current_memberID = -1;
int pre_Current_timeID = -1;

String[] downloadList;
String[] postprocessList;

void setup () {
  size(SOLARCHVISION_W_Pixel, SOLARCHVISION_A_Pixel + SOLARCHVISION_B_Pixel + SOLARCHVISION_H_Pixel + SOLARCHVISION_C_Pixel + SOLARCHVISION_D_Pixel, P2D);

  LOAD_EARTH_IMAGES();

  LOAD_COUNTRIES();

  LOAD_LOCATIONS();

  //DOWNLOAD_DATA_SWOB();

  if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("SHOP")) {
    LOAD_SHOP_POSITIONS();
  }

  downloadList    = DOWNLOAD_DATA_GRID(-1);          // passing with -1 to create the list
  postprocessList = POST_PROCESS_WIND_AND_SOLAR(-1); // passing with -1 to create the list

  textSize(80); // help initialization of fonts

  for (int layerID = 0; layerID < DATA_numLayers; layerID += 1) {
    create_gridPalettes(layerID);
  }

  for (int layerID = 0; layerID < DATA_numLayers; layerID += 1) {
    for (int levelID = 0; levelID < DATA_numLevels; levelID += 1) {
      allParameterNamesAndUnits[layerID][levelID] = "";
    }
  }

  DATA_Viewport_Zoom = 1;
  DATA_Viewport_Width = SOLARCHVISION_W_Pixel;
  DATA_Viewport_Height = SOLARCHVISION_H_Pixel;
  DATA_Viewport_CenX = 0;
  DATA_Viewport_CenY = 0;

}

float DATA_Viewport_Zoom = 1;
float DATA_Viewport_Width = 1;
float DATA_Viewport_Height = 1;
float DATA_Viewport_CenX = 0;
float DATA_Viewport_CenY = 0;

int DATA_Viewport_CornerX = 0;
int DATA_Viewport_CornerY = SOLARCHVISION_A_Pixel + SOLARCHVISION_B_Pixel;

boolean DATA_Viewport_Update = true;

boolean DATA_Downloaded = false;
boolean DATA_Postprocessed = false;

int progressID = -1;

void draw () {
  if ((DATA_Downloaded == false) || (DATA_Postprocessed == false)) {
    background(223);

    noStroke();
    textAlign(CENTER, CENTER);
    fill(191,191,63);
    textSize(80);
    text("SOLARCHVISION", width / 2, height / 2);
    fill(0);
    textSize(30);
    text("GRIB2 DATA VISUALIZATION & ANALYSIS TOOL\ndeveloped by Mojtaba Samimi (2016)", width / 2, height / 4);

    noStroke();
    fill(255);
    rect(0, 3 * height / 4 - 20, width, 40);

    float progressRatio = 1.0;
    if (DATA_Downloaded == false) {
      if (downloadList.length != 0) {
        progressRatio = (progressID + 1) / float(downloadList.length);
      }
      fill(0, 127, 255);
    }
    else if (DATA_Postprocessed == false) {
      if (postprocessList.length != 0) {
        progressRatio = (progressID + 1) / float(postprocessList.length);
      }
      fill(255, 127, 0);
    }
    if (progressRatio > 1.0) progressRatio = 1.0;
    rect(0 , 3 * height / 4 - 20, width * progressRatio, 40);

    textAlign(CENTER, CENTER);
    textSize(20);
    if (progressRatio < 1) {
      if (progressID + 1 >= 0) {
        if (DATA_Downloaded == false) {
          if (progressID + 1 < downloadList.length) {
            fill(0);
            text(downloadList[progressID + 1], width / 2, 3 * height / 4);
          }
        }
        else if (DATA_Postprocessed == false) {
          if (progressID + 1 < postprocessList.length) {
            fill(0);
            text(postprocessList[progressID + 1], width / 2, 3 * height / 4);
          }
        }
      }
    }
    else {
      fill(255);
      text("Please wait...", width / 2, 3 * height / 4);
    }

    if (DATA_Downloaded == false) {
      if ((progressID >= 0) && (progressID < downloadList.length)) {
        DOWNLOAD_DATA_GRID(progressID);
      }
    }
    else if (DATA_Postprocessed == false) {
      if ((progressID >= 0) && (progressID < postprocessList.length)) {
        POST_PROCESS_WIND_AND_SOLAR(progressID);
      }
    }
    progressID++;

    if (DATA_Downloaded == false) {
      if (progressID == downloadList.length) {
        DATA_Downloaded = true;
        progressID = -1;

        POST_PROCESS_RATES_FROM_ACCUMULATIONS();
      }
    }
    else if (DATA_Postprocessed == false) {
      if (progressID == postprocessList.length) {
        DATA_Postprocessed = true;

        FILL_INFO_FOR_POST_PROCESSED_LAYERS();
      }
    }
  }
  else {
    if (DATA_Viewport_Update == true) {
      if (automated == AUTO_PDF) {
        pdfExport = createGraphics(width, height, PDF,
          getOutputFolder(Current_timeID, Current_layerID, Current_levelID, Current_memberID) + "/" +
                FileStamp(Current_timeID, Current_layerID, Current_levelID, Current_memberID) + ".pdf");

        beginRecord(pdfExport);
      }

      //println(frameCount);

      pushMatrix();
      translate(DATA_Viewport_CornerX, DATA_Viewport_CornerY);

      tint(255);

      noStroke();

      fill(0);
      rect(0, 0, DATA_Viewport_Width, DATA_Viewport_Height);

      noFill();

      SOLARCHVISION_draw_EARTH();

      int scenarios_DisplayOption = 0; // 0: (loop) single 1: overlay <<<<<<<< Note: overlay now only works well with interactive window! should modify the cases in the draw function

      int num_forecastOverlay = 1;
      int num_memberOverlay = 1;
      int num_levelOverlay = 1;

      int memberDir = 1;

      if (STUDY_memberBegin != STUDY_memberEnd) scenarios_DisplayOption = 1;

      if (scenarios_DisplayOption == 1) {
        if (STUDY_memberBegin < STUDY_memberEnd) {
          num_memberOverlay = 1 + STUDY_memberEnd - STUDY_memberBegin;
          memberDir = 1;
        }
        else if (STUDY_memberBegin > STUDY_memberEnd) {
          num_memberOverlay = 1 + STUDY_memberEnd - STUDY_memberBegin + DATA_numMembers;
          memberDir = -1;
        }
      }

      int timeDir = 1;

      if (STUDY_timeBegin != STUDY_timeEnd) scenarios_DisplayOption = 1;

      if (scenarios_DisplayOption == 1) {
        if (STUDY_timeBegin < STUDY_timeEnd) {
          num_forecastOverlay = 1 + STUDY_timeEnd - STUDY_timeBegin;
          timeDir = 1;
        }
        else if (STUDY_timeBegin > STUDY_timeEnd) {
          num_forecastOverlay = 1 + STUDY_timeEnd - STUDY_timeBegin + DATA_numTimes;
          timeDir = -1;
        }
      }

      int levelDir = 1;

      if (STUDY_levelBegin != STUDY_levelEnd) scenarios_DisplayOption = 1;

      if (scenarios_DisplayOption == 1) {
        if (STUDY_levelBegin < STUDY_levelEnd) {
          num_levelOverlay = 1 + STUDY_levelEnd - STUDY_levelBegin;
          levelDir = 1;
        }
        else if (STUDY_levelBegin > STUDY_levelEnd) {
          num_levelOverlay = 1 + STUDY_levelEnd - STUDY_levelBegin + DATA_numLevels;
          levelDir = -1;
        }
      }

      if (pre_Current_timeID != Current_timeID) {
        pre_Current_timeID = Current_timeID;
      }
      if (pre_Current_memberID != Current_memberID) {
        pre_Current_memberID = Current_memberID;
      }
      if (pre_Current_levelID != Current_levelID) {
        pre_Current_levelID = Current_levelID;
      }
      if (pre_Current_layerID != Current_layerID) {
        pre_Current_layerID = Current_layerID;
      }
      if (pre_Current_statisticID != Current_statisticID) {
        pre_Current_statisticID = Current_statisticID;
      }

      int num_overlay = num_forecastOverlay * num_memberOverlay * num_levelOverlay;

      int[] timeIDs = new int[num_overlay];
      int[] memberIDs = new int[num_overlay];
      int[] levelIDs = new int[num_overlay];

      {
        int nDrw = 0;

        for (int f = 0; f < num_forecastOverlay; f += 1) {
          for (int m = 0; m < num_memberOverlay; m += 1) {
            for (int l = 0; l < num_levelOverlay; l += 1) {
              timeIDs[nDrw] = Current_timeID;
              memberIDs[nDrw] = Current_memberID;
              levelIDs[nDrw] = Current_levelID;

              nDrw += 1;

              Current_levelID += levelDir;
              if ((Current_levelID > DATA_numLevels - 1) || (Current_levelID < 0)) {
                Current_levelID = (Current_levelID + DATA_numLevels) % DATA_numLevels;
              }
            }
            Current_levelID = pre_Current_levelID;

            Current_memberID += memberDir;
            if ((Current_memberID > DATA_numMembers - 1) || (Current_memberID < 0)) {
              Current_memberID = (Current_memberID + DATA_numMembers) % DATA_numMembers;
            }
          }
          Current_memberID = pre_Current_memberID;

          Current_timeID += timeDir;
          if ((Current_timeID > DATA_numTimes - 1) || (Current_timeID < 0)) {
            Current_timeID = (Current_timeID + DATA_numTimes) % DATA_numTimes;
          }
        }
        Current_timeID = pre_Current_timeID;

      }

      for (int nDrw = 0; nDrw < num_overlay; nDrw += 1) {
        Current_timeID = timeIDs[nDrw];
        Current_memberID = memberIDs[nDrw];
        Current_levelID = levelIDs[nDrw];

        boolean write_map_info_now = false;
        if (nDrw == num_overlay - 1) write_map_info_now = true;

        PImage img;

        imageMode(CENTER);
        if (DATA_allStatistics[Current_statisticID] == 0) {
          tint(255, 255 / float(num_overlay));

          if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("SHOP")) {
            img = create_gridImage_SHOP(Current_timeID, Current_layerID, Current_levelID, Current_memberID);
          }
          else {
            img = create_gridImage_basic(Current_timeID, Current_layerID, Current_levelID, Current_memberID);
          }

          image(img, DATA_Viewport_CenX + DATA_Viewport_Width / 2, DATA_Viewport_CenY + DATA_Viewport_Height / 2, DATA_Viewport_Width * DATA_Viewport_Zoom, DATA_Viewport_Height * DATA_Viewport_Zoom);
        }
        else {
          if (nDrw == 0) {
            tint(255, 255);

            img = create_gridImage_statistics(timeIDs, Current_layerID, levelIDs, memberIDs, num_overlay);

            image(img, DATA_Viewport_CenX + DATA_Viewport_Width / 2, DATA_Viewport_CenY + DATA_Viewport_Height / 2, DATA_Viewport_Width * DATA_Viewport_Zoom, DATA_Viewport_Height * DATA_Viewport_Zoom);
          }
        }
        imageMode(CORNER);

        if ((DATA_allLayers[Current_layerID] == LAYER_flowXonly) ||
            (DATA_allLayers[Current_layerID] == LAYER_flowXmeanpressure) ||
            (DATA_allLayers[Current_layerID] == LAYER_flowXprecipitation) ||
            (DATA_allLayers[Current_layerID] == LAYER_flowXdirecteffect)) {
          int AirTemperature_layerID = -1;
          int WindU_layerID = -1;
          int WindV_layerID = -1;
          int MeanPressure_layerID = -1;
          int Precipitation_layerID = -1;
          int DirectEffect_layerID = -1;

          for (int id = 0; id < DATA_numLayers; id++) {
            if (DATA_allLayers[id] == LAYER_drybulb) AirTemperature_layerID = id;
            if (DATA_allLayers[id] == LAYER_windU) WindU_layerID = id;
            if (DATA_allLayers[id] == LAYER_windV) WindV_layerID = id;
            if (DATA_allLayers[id] == LAYER_meanpressure) MeanPressure_layerID = id;
            if (DATA_allLayers[id] == LAYER_precipitation) Precipitation_layerID = id;
            if (DATA_allLayers[id] == LAYER_dirnoreff) DirectEffect_layerID = id;
          }

          if ((WindU_layerID != -1) && (WindV_layerID != -1)) {
            float Aspect = (gridNy / float(gridNx)) / (DATA_Viewport_Width / (float) DATA_Viewport_Height);

            int stp = 16;

            if (Precipitation_layerID != -1) {
              if ((DATA_allLayers[Current_layerID] == LAYER_flowXmeanpressure) ||
                  (DATA_allLayers[Current_layerID] == LAYER_flowXdirecteffect)) {
                strokeWeight(1);
                stroke(0);

                int PAL_TYPE = 1;

                for (int Px = 0; Px < DATA_Viewport_Width; Px += stp / 2) {
                  for (int Py = 0; Py < DATA_Viewport_Height;  Py += stp / 2) {
                    float x = (Px - DATA_Viewport_Width / 2 - DATA_Viewport_CenX) / DATA_Viewport_Zoom + DATA_Viewport_Width / 2;
                    float y = (Py - DATA_Viewport_Height / 2 - DATA_Viewport_CenY) / DATA_Viewport_Zoom + DATA_Viewport_Height / 2;

                    int ix = int(roundTo(gridNx * x / (float) DATA_Viewport_Width, 1));
                    int iy = (gridNy - 1) - int(roundTo(gridNy * y / (float) DATA_Viewport_Height, 1));

                    if ((0 <= ix) && (ix < gridNx) && (0 <= iy) && (iy < gridNy)) {
                      pushMatrix();
                      translate(Px, Py);

                      float PRECIPITATION = allDataValues[Current_timeID][Precipitation_layerID][Current_levelID][Current_memberID][iy * gridNx + ix];

                      if (is_undefined_FLOAT(PRECIPITATION) == false) {
                        float _val = -0.15 * PRECIPITATION;

                        if (DATA_allLayers[Current_layerID] == LAYER_flowXdirecteffect) _val *= -1;

                        float _u = 0.5 + 0.5 * 0.75 * _val;

                        float[] COL = SOLARCHVISION_GET_COLOR_STYLE(PAL_TYPE, _u);

                        //fill(COL[1], COL[2], COL[3], COL[0]);
                        //fill(COL[1], COL[2], COL[3], 127);
                        fill(COL[1], COL[2], COL[3], 255 / float(num_overlay));

                        float d = 0.2 * stp * pow(PRECIPITATION, 0.5);

                        ellipse(0, 0, d, d);
                      }

                      popMatrix();

                    }
                  }
                }
              }
            }

            {
              strokeWeight(1);
              stroke(127);

              int PAL_TYPE = 1;

              for (int Px = 0; Px < DATA_Viewport_Width; Px += stp) {
                for (int Py = 0; Py < DATA_Viewport_Height;  Py += stp) {
                  float x = (Px - DATA_Viewport_Width / 2 - DATA_Viewport_CenX) / DATA_Viewport_Zoom + DATA_Viewport_Width / 2;
                  float y = (Py - DATA_Viewport_Height / 2 - DATA_Viewport_CenY) / DATA_Viewport_Zoom + DATA_Viewport_Height / 2;

                  int ix = int(roundTo(gridNx * x / (float) DATA_Viewport_Width, 1));
                  int iy = (gridNy - 1) - int(roundTo(gridNy * y / (float) DATA_Viewport_Height, 1));

                  if ((0 <= ix) && (ix < gridNx) && (0 <= iy) && (iy < gridNy)) {
                    pushMatrix();
                    translate(Px, Py);

                    float AIR_TEMPERATURE = 0;
                    if (DATA_allLayers[Current_layerID] == LAYER_flowXdirecteffect) AIR_TEMPERATURE = allDataValues[Current_timeID][AirTemperature_layerID][Current_levelID][Current_memberID][iy * gridNx + ix];

                    float WIND_U = allDataValues[Current_timeID][WindU_layerID][Current_levelID][Current_memberID][iy * gridNx + ix];
                    float WIND_V = allDataValues[Current_timeID][WindV_layerID][Current_levelID][Current_memberID][iy * gridNx + ix];

                    if (is_undefined_FLOAT(WIND_U) == false) {
                      float WIND_SPEED = pow(WIND_U * WIND_U + WIND_V * WIND_V, 0.5);

                      float teta = 180 + atan2_ang(WIND_U, WIND_V * Aspect);
                      float D_teta = 15;
                      float R = WIND_SPEED * 0.15 * stp; // <<<<<<<<<<<<

                      if (R > 2) {
                        float R_in = 0.0 * R;
                        float x1 = (R_in * cos_ang(90 - (teta - 0.5 * D_teta)));
                        float y1 = (R_in * -sin_ang(90 - (teta - 0.5 * D_teta)));
                        float x2 = (R_in * cos_ang(90 - (teta + 0.5 * D_teta)));
                        float y2 = (R_in * -sin_ang(90 - (teta + 0.5 * D_teta)));

                        float x4 = (R * cos_ang(90 - (teta - 0.5 * D_teta)));
                        float y4 = (R * -sin_ang(90 - (teta - 0.5 * D_teta)));
                        float x3 = (R * cos_ang(90 - (teta + 0.5 * D_teta)));
                        float y3 = (R * -sin_ang(90 - (teta + 0.5 * D_teta)));

                        float ox = -2 * (R * cos_ang(90 - teta)) / 3.0;
                        float oy = -2 * (R * -sin_ang(90 - teta)) / 3.0;

                        float _val = 0.2 * WIND_SPEED;

                        if (DATA_allLayers[Current_layerID] == LAYER_flowXdirecteffect) _val *= 0.2 * (AIR_TEMPERATURE - 18);

                        float _u = 0.5 + 0.5 * 0.75 * _val;

                        float[] COL = SOLARCHVISION_GET_COLOR_STYLE(PAL_TYPE, _u);

                        //fill(COL[1], COL[2], COL[3], COL[0]);
                        fill(COL[1], COL[2], COL[3], 255 / float(num_overlay));

                        quad(x1 + ox, y1 + oy, x2 + ox, y2 + oy, x3 + ox, y3 + oy, x4 + ox, y4 + oy);
                      }
                    }

                    popMatrix();
                  }
                }
              }
            }
          }
        }

        if (write_map_info_now == true) {
          strokeWeight(1);
          stroke(127);

          for (float lat = 90 - 5; lat > -90; lat -= 5) {
            for (float lon = 180; lon > -180; lon -= 2.5) {
              float[] Pa = getIxIy(lon, lat);
              float[] Pb = getIxIy(lon - 2.5, lat);

              float ix1 = Pa[0];
              float iy1 = Pa[1];

              float ix2 = Pb[0];
              float iy2 = Pb[1];

              float x1 = ix1 * DATA_Viewport_Width / gridNx;
              float y1 = (gridNy - 1 - iy1) * DATA_Viewport_Height / gridNy;

              float x2 = ix2 * DATA_Viewport_Width / gridNx;
              float y2 = (gridNy - 1 - iy2) * DATA_Viewport_Height / gridNy;

              x1 = (x1 - DATA_Viewport_Width / 2) * DATA_Viewport_Zoom + DATA_Viewport_Width / 2 + DATA_Viewport_CenX;
              x2 = (x2 - DATA_Viewport_Width / 2) * DATA_Viewport_Zoom + DATA_Viewport_Width / 2 + DATA_Viewport_CenX;

              y1 = (y1 - DATA_Viewport_Height / 2) * DATA_Viewport_Zoom + DATA_Viewport_Height / 2 + DATA_Viewport_CenY;
              y2 = (y2 - DATA_Viewport_Height / 2) * DATA_Viewport_Zoom + DATA_Viewport_Height / 2 + DATA_Viewport_CenY;

              if ((isInside (x1, y1, 0, 0, DATA_Viewport_Width, DATA_Viewport_Height) == 1) ||
                  (isInside (x2, y2, 0, 0, DATA_Viewport_Width, DATA_Viewport_Height) == 1)) {
                if (dist(x1, y1, x2, y2) < DATA_Viewport_Height) {
                    line(x1, y1, x2, y2);
                }
              }
            }
          }

          for (float lon = 180; lon > -180; lon -= 5) {
            for (float lat = 90 - 5; lat > -90; lat -= 5) {
              float[] Pa = getIxIy(lon, lat);
              float[] Pb = getIxIy(lon, lat - 5);

              float ix1 = Pa[0];
              float iy1 = Pa[1];

              float ix2 = Pb[0];
              float iy2 = Pb[1];

              float x1 = ix1 * DATA_Viewport_Width / gridNx;
              float y1 = (gridNy - 1 - iy1) * DATA_Viewport_Height / gridNy;

              float x2 = ix2 * DATA_Viewport_Width / gridNx;
              float y2 = (gridNy - 1 - iy2) * DATA_Viewport_Height / gridNy;

              x1 = (x1 - DATA_Viewport_Width / 2) * DATA_Viewport_Zoom + DATA_Viewport_Width / 2 + DATA_Viewport_CenX;
              x2 = (x2 - DATA_Viewport_Width / 2) * DATA_Viewport_Zoom + DATA_Viewport_Width / 2 + DATA_Viewport_CenX;

              y1 = (y1 - DATA_Viewport_Height / 2) * DATA_Viewport_Zoom + DATA_Viewport_Height / 2 + DATA_Viewport_CenY;
              y2 = (y2 - DATA_Viewport_Height / 2) * DATA_Viewport_Zoom + DATA_Viewport_Height / 2 + DATA_Viewport_CenY;

              if ((isInside (x1, y1, 0, 0, DATA_Viewport_Width, DATA_Viewport_Height) == 1) ||
                  (isInside (x2, y2, 0, 0, DATA_Viewport_Width, DATA_Viewport_Height) == 1)) {
                if (dist(x1, y1, x2, y2) < DATA_Viewport_Height) {
                  line(x1, y1, x2, y2);
                }
              }
            }
          }

          stroke(255, 127);
          fill(0);
          strokeWeight(1);

          for (int n_Countries = 0; n_Countries < COUNTRIES_NUMBER; n_Countries += 1){
            //stroke(random(255));

            for (int f = int(COUNTRIES_INFO[n_Countries][0]); f < int(COUNTRIES_INFO[n_Countries][1]) - 1; f += 1){
              float lon1 = COUNTRIES_SEGMENTS[f][0];
              float lat1 = COUNTRIES_SEGMENTS[f][1];

              float lon2 = COUNTRIES_SEGMENTS[f + 1][0];
              float lat2 = COUNTRIES_SEGMENTS[f + 1][1];

              if (dist_lon_lat(lon1, lat1, lon2, lat2) < 400) {
                float[] Pa = getIxIy(lon1, lat1);
                float[] Pb = getIxIy(lon2, lat2);

                float ix1 = Pa[0];
                float iy1 = Pa[1];

                float ix2 = Pb[0];
                float iy2 = Pb[1];

                float x1 = ix1 * DATA_Viewport_Width / gridNx;
                float y1 = (gridNy - 1 - iy1) * DATA_Viewport_Height / gridNy;

                float x2 = ix2 * DATA_Viewport_Width / gridNx;
                float y2 = (gridNy - 1 - iy2) * DATA_Viewport_Height / gridNy;

                if (dist(ix1, iy1, ix2, iy2) < 150) // not the best way of doing it!
                {
                  x1 = (x1 - DATA_Viewport_Width / 2) * DATA_Viewport_Zoom + DATA_Viewport_Width / 2 + DATA_Viewport_CenX;
                  x2 = (x2 - DATA_Viewport_Width / 2) * DATA_Viewport_Zoom + DATA_Viewport_Width / 2 + DATA_Viewport_CenX;

                  y1 = (y1 - DATA_Viewport_Height / 2) * DATA_Viewport_Zoom + DATA_Viewport_Height / 2 + DATA_Viewport_CenY;
                  y2 = (y2 - DATA_Viewport_Height / 2) * DATA_Viewport_Zoom + DATA_Viewport_Height / 2 + DATA_Viewport_CenY;

                  if ((isInside (x1, y1, 0, 0, DATA_Viewport_Width, DATA_Viewport_Height) == 1) ||
                      (isInside (x2, y2, 0, 0, DATA_Viewport_Width, DATA_Viewport_Height) == 1)) {
                      line(x1, y1, x2, y2);

                  }
                }
              }
            }
          }

          strokeWeight(0);
          noStroke();
          fill(0);

          textSize(12.5);
          textAlign(CENTER, CENTER);
          for (int q = 0; q < LOCATIONS_NUMBER; q++) {
            boolean display_it = true;

            /*
            if ((DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("GEPS")) ||
                (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("GDPS"))) {
            }
            else {
              if ((LOCATIONS_INFO[q][2].equals("CAN")) ||
                  (LOCATIONS_INFO[q][2].equals("USA"))) {
              }
              else {
                display_it = false;
              }
            }
            */

            //if (float(LOCATIONS_INFO[q][5]) - 1 > DATA_Viewport_Zoom * 0.0025 * (gridNy * gridDy)) display_it = false;
            if (float(LOCATIONS_INFO[q][5]) - 1 > DATA_Viewport_Zoom * 0.0010 * (gridNy * gridDy)) display_it = false;

            if (display_it == true) {
              float lat = float(LOCATIONS_INFO[q][3]);
              float lon = float(LOCATIONS_INFO[q][4]);

              float[] P = getIxIy(lon, lat);

              float ix = P[0];
              float iy = P[1];

              float x = ix * DATA_Viewport_Width / gridNx;
              float y = (gridNy - 1 - iy) * DATA_Viewport_Height / gridNy;

              x = (x - DATA_Viewport_Width / 2) * DATA_Viewport_Zoom + DATA_Viewport_Width / 2 + DATA_Viewport_CenX;
              y = (y - DATA_Viewport_Height / 2) * DATA_Viewport_Zoom + DATA_Viewport_Height / 2 + DATA_Viewport_CenY;

              if (isInside (x, y, 0, 0, DATA_Viewport_Width, DATA_Viewport_Height) == 1) {
                text(LOCATIONS_INFO[q][0], x, y);
              }
            }
          }

          strokeWeight(0);
          noStroke();
          fill(0);

  /*

          textSize(12.5);
          textAlign(CENTER, CENTER);
          for (int q = 0; q < STATION_SWOB_NUMBER; q++) {
            boolean display_it = true;

            // ... conditions for not displaying the SWOB points

            if (display_it == true) {
              float lat = float(STATION_SWOB_INFO[q][3]);
              float lon = float(STATION_SWOB_INFO[q][4]);

              float[] P = getIxIy(lon, lat);

              float ix = P[0];
              float iy = P[1];

              float x = ix * DATA_Viewport_Width / gridNx;
              float y = (gridNy - 1 - iy) * DATA_Viewport_Height / gridNy;

              x = (x - DATA_Viewport_Width / 2) * DATA_Viewport_Zoom + DATA_Viewport_Width / 2 + DATA_Viewport_CenX;
              y = (y - DATA_Viewport_Height / 2) * DATA_Viewport_Zoom + DATA_Viewport_Height / 2 + DATA_Viewport_CenY;

              if (isInside (x, y, 0, 0, DATA_Viewport_Width, DATA_Viewport_Height) == 1) {
                text(STATION_SWOB_INFO[q][0], x, y);
              }
            }
          }
      */

        }
      }

      if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("SHOP")) {
      }
      else {
        if (automated == USER_INT) {
          float x = (get_GRID_Mouse_X() - DATA_Viewport_Width / 2 - DATA_Viewport_CenX) / DATA_Viewport_Zoom + DATA_Viewport_Width / 2;
          float y = (get_GRID_Mouse_Y() - DATA_Viewport_Height / 2 - DATA_Viewport_CenY) / DATA_Viewport_Zoom + DATA_Viewport_Height / 2;

          int ix = int(roundTo(gridNx * x / (float) DATA_Viewport_Width, 1));
          int iy = (gridNy - 1) - int(roundTo(gridNy * y / (float) DATA_Viewport_Height, 1));

          float[] P = getLonLat(ix, iy);

          float lon = P[0];
          float lat = P[1];

          textSize(10);

          textAlign(CENTER, BOTTOM);
          text(nf(lon, 0, 2) + "X" + nf(lat, 0, 2), mouseX, mouseY);

          if ((0 <= ix) && (ix < gridNx) && (0 <= iy) && (iy < gridNy)) {
            textAlign(CENTER, BOTTOM);
            text("[" + nf(ix, 0) + "][" + nf(iy, 0) + "]\n", mouseX, mouseY);

            textAlign(RIGHT, TOP);

            float _val = 0;

            if (DATA_allStatistics[Current_statisticID] == 0) {
              _val = allDataValues[Current_timeID][Current_layerID][Current_levelID][Current_memberID][iy * gridNx + ix];
            }
            else {
              float[] _values = new float[num_overlay];

              for (int nDrw = 0; nDrw < num_overlay; nDrw += 1) {
                Current_timeID = timeIDs[nDrw];
                Current_memberID = memberIDs[nDrw];
                Current_levelID = levelIDs[nDrw];

                _values[nDrw] = allDataValues[Current_timeID][Current_layerID][Current_levelID][Current_memberID][iy * gridNx + ix];
              }

              float[] normals = SOLARCHVISION_NORMAL(_values);

              _val = normals[DATA_allStatistics[Current_statisticID]];

            }

            String txt = STRING_undefined;

            if (is_undefined_FLOAT(_val) == false) txt = nf(_val, 0, 3);
            text(txt, mouseX, mouseY);
          }
        }
      }

      Current_timeID = pre_Current_timeID;
      Current_memberID = pre_Current_memberID;
      Current_levelID = pre_Current_levelID;

      popMatrix();
    }

    if ((DATA_Viewport_Update == true)) {
      tint(255);

      noStroke();
      fill(63);
      rect(0, SOLARCHVISION_A_Pixel, width, SOLARCHVISION_B_Pixel);

      noStroke();
      fill(255);
      textSize(1.5 * MessageSize);
      textAlign(LEFT, CENTER);
      text("SOLARCHVISION-GRIB2 DATA VISUALIZATION:", 10, SOLARCHVISION_A_Pixel + 0.5 * SOLARCHVISION_B_Pixel);

      noStroke();
      fill(255);
      textSize(1.5 * MessageSize);
      textAlign(RIGHT, CENTER);
      text(allDataTitles[Current_timeID][Current_layerID][Current_levelID][Current_memberID], SOLARCHVISION_W_Pixel - 10, SOLARCHVISION_A_Pixel + 0.5 * SOLARCHVISION_B_Pixel);

      noStroke();
      fill(191);
      rect(0, SOLARCHVISION_A_Pixel + SOLARCHVISION_B_Pixel + SOLARCHVISION_H_Pixel, width, SOLARCHVISION_C_Pixel);

      imageMode(CENTER);
      image(gridPalettes[Current_layerID], 0.5 * SOLARCHVISION_W_Pixel, SOLARCHVISION_A_Pixel + SOLARCHVISION_B_Pixel + SOLARCHVISION_H_Pixel + 0.5 * SOLARCHVISION_C_Pixel);
      imageMode(CORNER);

      if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("SHOP")) {
      }
      else {
        noStroke();
        fill(0);
        textSize(1.5 * MessageSize);
        textAlign(LEFT, CENTER);
        text(allParameterNamesAndUnits[Current_layerID][Current_levelID], 10, SOLARCHVISION_A_Pixel + SOLARCHVISION_B_Pixel + SOLARCHVISION_H_Pixel + 0.5 * SOLARCHVISION_C_Pixel);

        noStroke();
        fill(0);
        textSize(1.5 * MessageSize);
        textAlign(RIGHT, CENTER);
        text(
             nf(gridYear                 [Current_timeID][Current_layerID][Current_levelID][Current_memberID], 4) + "-" +
             nf(gridMonth                [Current_timeID][Current_layerID][Current_levelID][Current_memberID], 2) + "-" +
             nf(gridDay                  [Current_timeID][Current_layerID][Current_levelID][Current_memberID], 2) + "T" +
             nf(gridHour                 [Current_timeID][Current_layerID][Current_levelID][Current_memberID], 2) + ":" +
             nf(gridMinute               [Current_timeID][Current_layerID][Current_levelID][Current_memberID], 2) + ":" +
             nf(gridSecond               [Current_timeID][Current_layerID][Current_levelID][Current_memberID], 2) + "Z-P" +
             nf(gridForecastConvertedTime[Current_timeID][Current_layerID][Current_levelID][Current_memberID], 3, 2)
             , SOLARCHVISION_W_Pixel - 10, SOLARCHVISION_A_Pixel + SOLARCHVISION_B_Pixel + SOLARCHVISION_H_Pixel + 0.5 * SOLARCHVISION_C_Pixel);

      }
    }

    if (DATA_Viewport_Update == true) {
      UI_BAR_d_Update = true;
    }

    if (automated == USER_INT) {
      DATA_Viewport_Update = false;

      frameRate(16);

  /*
      if (frameCount % 16 == 0) {
        Current_timeID += 1;
        Current_timeID %= DATA_numTimes;

        if (DATA_numTimes > 1) {
          DATA_Viewport_Update = true;
          UI_BAR_d_Update = true;
        }
      }

      if (scenarios_DisplayOption == 0) {
        if (frameCount % 1 == 0) {
          Current_memberID += 1;
          Current_memberID %= DATA_numMembers;

          if (DATA_numMembers > 1) {
            DATA_Viewport_Update = true;
            UI_BAR_d_Update = true;
          }
        }
      }

  */

    }
    else if ((automated == AUTO_BMP) ||
             (automated == AUTO_JPG) ||
             (automated == AUTO_PNG) ||
             (automated == AUTO_TIF) ||
             (automated == AUTO_PDF)) {
      if (automated == AUTO_PDF) {
        endRecord();
      }
      else {
        recordFrame(Current_timeID, Current_layerID, Current_levelID, Current_memberID);
      }

      Current_timeID += 1;
      if (Current_timeID == DATA_numTimes) {
        Current_timeID = 0;
        Current_memberID += 1;
      }
      if (Current_memberID == DATA_numMembers) {
        Current_memberID = 0;
        Current_layerID += 1;
      }
      if (Current_layerID == DATA_numLayers) {
        Current_layerID = 0;
        Current_levelID += 1;
      }
      if (Current_levelID == DATA_numLevels) exit();
    }

    else if (automated == AUTO_GIF) {
      if (Current_timeID == 0) {
        gifExport = new GifMaker(this,
          getOutputFolder(Current_timeID, Current_layerID, Current_levelID, Current_memberID) + "/" +
                FileStamp(Current_timeID, Current_layerID, Current_levelID, Current_memberID) + ".gif");

        gifExport.setQuality(255);               // default: 10
        gifExport.setRepeat(0);                  // make it an "endless" animation
        //gifExport.setTransparent(255,255,255);   // white is transparent
      }

      // we decided not to add the very first frame to solve the issue with the display of zero values of the accumulative layers.
      if (Current_timeID > 0) {
        gifExport.setDelay(1000);
        gifExport.addFrame();
      }

      Current_timeID += 1;
      if (Current_timeID == DATA_numTimes) {
        gifExport.finish();

        Current_timeID = 0;
        Current_layerID += 1;
      }
      if (Current_layerID == DATA_numLayers) {
        Current_layerID = 0;
        Current_levelID += 1;
      }
      if (Current_levelID == DATA_numLevels) exit();

    }

    if (UI_BAR_d_Update == true) {
      if (automated == USER_INT) {
        //////////////////////////////////////

        UI_BAR_d_Update = true; //<<<<
        SOLARCHVISION_draw_window_BAR_d(); // <<<<<<<<<<<<<<<

        //////////////////////////////////////
      }
    }
  }

/*
  gridSouthLat = -(90 - 180 * (mouseY - (SOLARCHVISION_A_Pixel + SOLARCHVISION_B_Pixel)) / (1.0 * SOLARCHVISION_H_Pixel));
  gridSouthLon = -180 + 360 * mouseX / (1.0 * SOLARCHVISION_W_Pixel);

  DATA_Viewport_Update = true;

  textSize(25);
  text("gridSouthLat = " + nf(gridSouthLat, 0, 0) + "\n" +
       "gridSouthLon = " + nf(gridSouthLon, 0, 0) + "\n" +
       "gridRotation = " + nf(gridRotation, 0, 0), width/2, height/2);
*/

}

String DATA_Filename = "";

String getGrib2Link () {
  String l = "";

  if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY02].equals("CMC")) {
    if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("SHOP")) {
      l = DATA_allDomains[Current_domainID][DOMAIN_PROPERTY03] + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY04] + "/" + nf(DATA_ModelYear, 4) + nf(DATA_ModelMonth, 2) + nf(DATA_ModelDay, 2) + nf(DATA_ModelRun, 2) + "_" + DATA_Filename;
    }
    else if ((DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("RDPA")) ||
             (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("HRDPA")) ||
             (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("SNOW"))) {
      l = DATA_allDomains[Current_domainID][DOMAIN_PROPERTY03] + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY04] + "/" + DATA_Filename;
    }
    else if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("CanSIPS")) {
      l = DATA_allDomains[Current_domainID][DOMAIN_PROPERTY03] + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY04] + "/" + nf(DATA_ModelYear, 2) + "/" + nf(DATA_ModelMonth, 2) + "/" + DATA_Filename;
    }
    else if ((DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("GDWPS")) ||
             (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("RDWPS"))) {
      l = DATA_allDomains[Current_domainID][DOMAIN_PROPERTY03] + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY04] + "/" + nf(DATA_ModelRun, 2) + "/" + DATA_Filename;
    }
    else {
      l = DATA_allDomains[Current_domainID][DOMAIN_PROPERTY03] + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY04] + "/" + nf(DATA_ModelRun, 2) + "/" + nf(DATA_ModelTime, 3) + "/" + DATA_Filename;
    }
  }
  else if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY02].equals("NOAA")) {
    if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("SREF")) {
      l = DATA_allDomains[Current_domainID][DOMAIN_PROPERTY03] + "_" + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY05] + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY04] + "?file=" + DATA_Filename;
      l += "&dir=%2F" + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY05] + "." + nf(DATA_ModelYear, 4) + nf(DATA_ModelMonth, 2) + nf(DATA_ModelDay, 2) + "/" + nf(DATA_ModelRun, 2) + "/" + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY07];
    }
    else if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("GEFS")) {
      l = DATA_allDomains[Current_domainID][DOMAIN_PROPERTY03] + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY04] + "?file=" + DATA_Filename;
      l += "&dir=%2F" + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY05] + "." + nf(DATA_ModelYear, 4) + nf(DATA_ModelMonth, 2) + nf(DATA_ModelDay, 2) + "/" + nf(DATA_ModelRun, 2) + "/" + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY07];
    }
    else if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("GFS")) {
      l = DATA_allDomains[Current_domainID][DOMAIN_PROPERTY03] + "_" + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY05] + "_" + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY06] + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY04] + "?file=" + DATA_Filename;
      l += "&dir=%2F" + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY05] + "." + nf(DATA_ModelYear, 4) + nf(DATA_ModelMonth, 2) + nf(DATA_ModelDay, 2) + nf(DATA_ModelRun, 2);
    }
    else if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("WAVE")) {
      l = DATA_allDomains[Current_domainID][DOMAIN_PROPERTY03] + "_" + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY05] + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY04] + "?file=" + DATA_Filename;
      l += "&dir=%2F" + "multi_2" + "." + nf(DATA_ModelYear, 4) + nf(DATA_ModelMonth, 2) + nf(DATA_ModelDay, 2);
    }
    else {
      l = DATA_allDomains[Current_domainID][DOMAIN_PROPERTY03] + "_" + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY05] + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY04] + "?file=" + DATA_Filename;
      l += "&dir=%2F" + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY05] + "." + nf(DATA_ModelYear, 4) + nf(DATA_ModelMonth, 2) + nf(DATA_ModelDay, 2);
    }
  }

  println(l);

  return l;
}

String getGrib2Filename (int k, int l, int h) {
  String return_txt = "";

  String F_L = DATA_ParameterLevel[l][h];

  if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY02].equals("CMC")) {
    if (l == LAYER_rain) {
      if ((DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("GDPS")) ||
          (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("RDPS")) ||
          (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("HRDPS"))) {
        F_L = "WEARN_SFC_0";
        DATA_ParameterLevel[l][h] = F_L;
      }
    }

    if (l == LAYER_freezingrain) {
      if ((DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("GDPS")) ||
          (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("RDPS")) ||
          (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("HRDPS"))) {
        F_L = "WEAFR_SFC_0";
        DATA_ParameterLevel[l][h] = F_L;
      }
    }

    if (l == LAYER_icepellets) {
      if ((DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("GDPS")) ||
          (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("RDPS")) ||
           (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("HRDPS"))) {
        F_L = "WEAPE_SFC_0";
        DATA_ParameterLevel[l][h] = F_L;
      }
    }

    if (l == LAYER_snow) {
      if ((DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("GDPS")) ||
          (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("RDPS")) ||
          (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("HRDPS"))) {
        F_L = "WEASN_SFC_0";
        DATA_ParameterLevel[l][h] = F_L;
      }
    }

    if (l == LAYER_windU) {
      if ((DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("GEPS")) ||
          (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("REPS"))) {
        F_L = "UGRD_TGL_10m";
        DATA_ParameterLevel[l][h] = F_L;
      }
    }

    if (l == LAYER_windV) {
      if ((DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("GEPS")) ||
          (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("REPS"))) {
        F_L = "VGRD_TGL_10m";
        DATA_ParameterLevel[l][h] = F_L;
      }
    }

    if (l == LAYER_soilmoisture) {
      if ((DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("GEPS")) ||
          (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("REPS"))) {
        F_L = "VSOILM_DBLL_10cm";
        DATA_ParameterLevel[l][h] = F_L;
      }
    }

    if (l == LAYER_soiltemperature) {
      if ((DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("GEPS")) ||
          (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("REPS"))) {
        F_L = "TSOIL_DBLL_10cm";
        DATA_ParameterLevel[l][h] = F_L;
      }
    }

    if (l == LAYER_drybulb) {
      if ((DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("GEPS")) ||
          (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("REPS")) ||
          (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("CanSIPS"))) {
        F_L = "TMP_TGL_2m";
        DATA_ParameterLevel[l][h] = F_L;
      }
    }

    if (l == LAYER_dewpoint) {
      if ((DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("GEPS")) ||
          (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("REPS"))) {
        F_L = "DPT_TGL_2m";
        DATA_ParameterLevel[l][h] = F_L;
      }
    }

    if (l == LAYER_depression) {
      if ((DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("GEPS")) ||
          (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("REPS"))) {
        F_L = "DEPR_TGL_2m";
        DATA_ParameterLevel[l][h] = F_L;
      }
    }

    if (l == LAYER_relhum) {
      if ((DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("GEPS")) ||
          (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("REPS"))) {
        F_L = "RH_TGL_2m";
        DATA_ParameterLevel[l][h] = F_L;
      }
    }

    if (l == LAYER_spchum) {
      if ((DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("GEPS")) ||
          (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("REPS"))) {
        F_L = "SPFH_TGL_2m";
        DATA_ParameterLevel[l][h] = F_L;
      }
    }

    if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("SHOP")) {
      return_txt = DATA_allDomains[Current_domainID][DOMAIN_PROPERTY05] + "_" + F_L + "_" + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY06] + "_" + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY07];
    }
    else if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("CanSIPS")) {
      return_txt = DATA_allDomains[Current_domainID][DOMAIN_PROPERTY05] + "_" + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY06] + "_" + F_L + "_" + nf(DATA_ModelYear, 4) + "-" + nf(DATA_ModelMonth, 2) + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY07];
    }
    else if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("SNOW")) {
      return_txt = DATA_allDomains[Current_domainID][DOMAIN_PROPERTY05] + "/" + nf(DATA_ModelYear, 4) + nf(DATA_ModelMonth, 2) + nf(DATA_ModelDay, 2) + nf(DATA_ModelRun, 2) + "_" + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY06] + "_" + F_L + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY07];
    }
    else if ((DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("RDPA")) ||
             (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("HRDPA"))) {
      Calendar timeNow = Calendar.getInstance();
      timeNow.set(Calendar.YEAR,  DATA_ModelYear);
      timeNow.set(Calendar.MONTH, DATA_ModelMonth - 1);
      timeNow.set(Calendar.DATE,  DATA_ModelDay);
      timeNow.set(Calendar.HOUR_OF_DAY, DATA_ModelRun);
      timeNow.add(Calendar.HOUR_OF_DAY, DATA_ModelTime);

      return_txt = DATA_allDomains[Current_domainID][DOMAIN_PROPERTY05] + "_" + F_L + "_" + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY06] + "_" + nf(timeNow.get(Calendar.YEAR), 4) + nf(timeNow.get(Calendar.MONTH) + 1, 2) + nf(timeNow.get(Calendar.DATE), 2) + nf(timeNow.get(Calendar.HOUR_OF_DAY), 2) + "_" + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY07];
    }
    else {
      return_txt = DATA_allDomains[Current_domainID][DOMAIN_PROPERTY05] + "_" + F_L + "_" + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY06] + "_" + nf(DATA_ModelYear, 4) + nf(DATA_ModelMonth, 2) + nf(DATA_ModelDay, 2) + nf(DATA_ModelRun, 2) + "_P" + nf(k, 3) + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY07];
    }
  }

  else if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY02].equals("NOAA")) {
    if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("SREF")) {
      String option1 = "_arw"; // "_nmb";

      String option2 = ".ctl"; // ".n1"; ".n5"; ".p1"; "p5";

      return_txt = DATA_allDomains[Current_domainID][DOMAIN_PROPERTY05] + option1 + ".t" + nf(DATA_ModelRun, 2) + "z." + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY07] + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY06] + option2 + ".f" + nf(k, 2) + ".grib2";
    }
    else if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("GEFS")) {
      //"gec00", "gep01", "gep02", ... "gep20"

      return_txt = "gep01" + ".t" + nf(DATA_ModelRun, 2) + "z." + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY07] + "f" + nf(k, 2);
    }
    else if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("GFS")) {
      return_txt = DATA_allDomains[Current_domainID][DOMAIN_PROPERTY05] + ".t" + nf(DATA_ModelRun, 2) + "z." + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY07] + "." + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY06] + ".f" + nf(k, 3);
    }
    else if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("NAM11")) {
      return_txt = DATA_allDomains[Current_domainID][DOMAIN_PROPERTY05] + ".t" + nf(DATA_ModelRun, 2) + "z." + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY06] + nf(k, 2) +"." + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY07] + ".tm" + nf(DATA_ModelRun, 2);
    }
    else if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("NAM12")) {
      return_txt = DATA_allDomains[Current_domainID][DOMAIN_PROPERTY05] + ".t" + nf(DATA_ModelRun, 2) + "z." + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY06] + nf(k, 2) + ".tm" + nf(DATA_ModelRun, 2) +"." + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY07];
    }
    else if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("NAM32")) {
      return_txt = DATA_allDomains[Current_domainID][DOMAIN_PROPERTY05] + ".t" + nf(DATA_ModelRun, 2) + "z." + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY06] + nf(k, 2) + ".tm" + nf(DATA_ModelRun, 2) +"." + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY07];
    }
    else if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("WAVE")) {
      return_txt = DATA_allDomains[Current_domainID][DOMAIN_PROPERTY06] + ".t" + nf(DATA_ModelRun, 2) + "z." + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY07];
    }
    else {
      return_txt = DATA_allDomains[Current_domainID][DOMAIN_PROPERTY05] + ".t" + nf(DATA_ModelRun, 2) + "z." + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY06] + nf(k, 2) + "." + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY07];
    }

    return_txt += "&var_" + split(F_L, "_")[0] +"=on";

    if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("WAVE")) {
    }
    else {
      if (l == LAYER_cloudcover) {
        return_txt += "&lev_entire_atmosphere=on";
      }
      else if (l == LAYER_cloudhigh) {
        return_txt += "&lev_high_cloud_layer=on";
      }
      else if (l == LAYER_cloudmiddle) {
        return_txt += "&lev_middle_cloud_layer=on";
      }
      else if (l == LAYER_cloudlow) {
        return_txt += "&lev_low_cloud_layer=on";
      }
      else if (l == LAYER_cloudceiling) {
        return_txt += "&lev_cloud_ceiling=on";
      }
      else if (l == LAYER_cloudtop) {
        return_txt += "&lev_cloud_top=on";
      }
      else if (l == LAYER_meanpressure) {
        return_txt += "&lev_mean_sea_level=on";
      }

      else {
        if (h == 0) {
          if ((l == LAYER_windU) ||
              (l == LAYER_windV) ||
              (l == LAYER_windspd) ||
              (l == LAYER_winddir)) {
            return_txt += "&lev_10_m_above_ground=on";
          }
          if ((l == LAYER_drybulb) ||
              (l == LAYER_dewpoint) ||
              (l == LAYER_depression) ||
              (l == LAYER_spchum) ||
              (l == LAYER_relhum)) {
            return_txt += "&lev_2_m_above_ground=on";
          }
          else {
            return_txt += "&lev_surface=on";
          }
        }
        else if ((h == 1) || (h == 2)) {
          return_txt += "&lev_80_m_above_ground=on";
        }
        else if (h == 3) {
          return_txt += "&lev_100_m_above_ground=o";
        }
        else if (h == 4) {
          return_txt += "&lev_850_mb=on";
        }
        else if (h == 5) {
          return_txt += "&lev_700_mb=on";
        }
        else if (h == 6) {
          return_txt += "&lev_500_mb=on";
        }
        else if (h == 7) {
          return_txt += "&lev_250_mb=on";
        }
      }
    }

    //return_txt += "&subregion=&leftlon=270&rightlon=300&toplat=50&bottomlat=40";
  }

/*
//if (l == LAYER_drybulb) return_txt="CMC_reg_TMP_ISBL_1000_ps10km_2018030600_P000.grib2";
//else if (l == LAYER_windU) return_txt="CMC_reg_UGRD_ISBL_1000_ps10km_2018030600_P000.grib2";
//else if (l == LAYER_windV) return_txt="CMC_reg_VGRD_ISBL_1000_ps10km_2018030600_P000.grib2";
//else if (l == LAYER_albedo) return_txt="CMC_reg_TMP_ISBL_1000_ps10km_2018030600_P000.grib2"; // patch to have a albedo file!
//else return_txt = "";

if (l == LAYER_drybulb) return_txt="prog_regpres_2018030600_000.grib2_TT_1000";
else if (l == LAYER_windU) return_txt="prog_regpres_2018030600_000.grib2_UU_1000";
else if (l == LAYER_windV) return_txt="prog_regpres_2018030600_000.grib2_VV_1000";
else if (l == LAYER_albedo) return_txt="prog_regpres_2018030600_000.grib2_WW_1000"; // patch to have a albedo file!
else return_txt = "";

////return_txt="t_rot.grib";
*/
  return return_txt;
}

void setAdjustParameters (int layerID) {
  PAL_Multiplier = 1;
  PAL_Offset = 0;
  PAL_Scale = 1;
  Impact_TYPE = Impact_PASSIVE;

  if (DATA_allLayers[layerID] == LAYER_flowXonly) {
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_flowXmeanpressure) {
    PAL_Offset = 101325;
    PAL_Scale = 0.0005;
  }

  else if (DATA_allLayers[layerID] == LAYER_meanpressure) {
    PAL_Offset = 101325;
    PAL_Scale = 0.0005;
  }

  else if (DATA_allLayers[layerID] == LAYER_surfpressure) {
    PAL_Offset = 101325;
    PAL_Scale = 0.00005;
  }

  else if (DATA_allLayers[layerID] == LAYER_surfshowalter) {
    PAL_Multiplier = -1;
    PAL_Scale = -0.1;
  }

  else if (DATA_allLayers[layerID] == LAYER_surflifted) {
    PAL_Multiplier = -1;
    PAL_Scale = -0.1;
  }

  else if (DATA_allLayers[layerID] == LAYER_convpotenergy) {
    PAL_Multiplier = -1;
    PAL_Scale = -0.001;
  }

  else if (DATA_allLayers[layerID] == LAYER_surfhelicity) {
    PAL_Scale = 0.01;
  }

  else if (DATA_allLayers[layerID] == LAYER_surfsensibleheat) {
    PAL_Multiplier = -1;
    PAL_Scale = -0.002;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_surflatentheat) {
    PAL_Multiplier = -1;
    PAL_Scale = -0.002;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_solarcomingshort) {
    PAL_Multiplier = -1;
    PAL_Scale = -0.002;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_solarabsrbdshort) {
    PAL_Scale = 0.002;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_solarabsrbdlong) {
    PAL_Scale = 0.002;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_solarupshort) {
    PAL_Multiplier = -1;
    PAL_Scale = -0.002;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_solaruplong) {
    PAL_Multiplier = -1;
    PAL_Scale = -0.002;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_solardownshort) {
    PAL_Multiplier = -1;
    PAL_Scale = -0.002;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_solardownlong) {
    PAL_Multiplier = -1;
    PAL_Scale = -0.002;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_glohorrad) {
    PAL_Multiplier = -1;
    PAL_Scale = -0.002;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_difhorrad) {
    PAL_Multiplier = -1;
    PAL_Scale = -0.002;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_dirnorrad) {
    PAL_Multiplier = -1;
    PAL_Scale = -0.002;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_tracker) {
    PAL_Multiplier = -1;
    PAL_Scale = -0.002;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_fixlat) {
    PAL_Multiplier = -1;
    PAL_Scale = -0.002;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_south45) {
    PAL_Multiplier = -1;
    PAL_Scale = -0.002;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_south00) {
    PAL_Multiplier = -1;
    PAL_Scale = -0.002;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_north00) {
    PAL_Multiplier = -1;
    PAL_Scale = -0.002;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_east00) {
    PAL_Multiplier = -1;
    PAL_Scale = -0.002;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_west00) {
    PAL_Multiplier = -1;
    PAL_Scale = -0.002;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_difhoreff) {
    PAL_Scale = 0.0001;
  }

  else if (DATA_allLayers[layerID] == LAYER_dirnoreff) {
    PAL_Scale = 0.0001;
  }

  else if (DATA_allLayers[layerID] == LAYER_flowXdirecteffect) {
    PAL_Scale = 0.0001;
  }

  else if (DATA_allLayers[layerID] == LAYER_windpower) {
    PAL_Multiplier = -1;
    PAL_Scale = -0.001;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_flowXprecipitation) {
    PAL_Multiplier = -1;
    PAL_Scale = -0.4;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if ((DATA_allLayers[layerID] == LAYER_precipitation) ||
           (DATA_allLayers[layerID] == LAYER_rain) ||
           (DATA_allLayers[layerID] == LAYER_freezingrain) ||
           (DATA_allLayers[layerID] == LAYER_icepellets) ||
           (DATA_allLayers[layerID] == LAYER_snow)) {
    PAL_Scale = 0.4;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_preciprate) {
    PAL_Scale = 0.4 * 3600;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_pastprecip) {
    PAL_Scale = 0.4 * 1 / 6.0;
  }

  else if (DATA_allLayers[layerID] == LAYER_pastsnow) {
    PAL_Scale = 0.4 * 1 / 6.0;
  }

  else if (DATA_allLayers[layerID] == LAYER_cloudcover) {
    PAL_Multiplier = 0.5;
    PAL_Scale = 0.01;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_cloudhigh) {
    PAL_Multiplier = 0.5;
    PAL_Scale = 0.01;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_cloudmiddle) {
    PAL_Multiplier = 0.5;
    PAL_Scale = 0.01;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_cloudlow) {
    PAL_Multiplier = 0.5;
    PAL_Scale = 0.01;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_relhum) {
    PAL_Scale = 0.04;
    PAL_Offset = 50;
  }

  else if (DATA_allLayers[layerID] == LAYER_albedo) {
    PAL_Multiplier = -1;
    PAL_Scale = -0.04;
    PAL_Offset = 50;
  }

  else if (DATA_allLayers[layerID] == LAYER_land) {
    PAL_Offset = 0.5;
    PAL_Multiplier = -1;
    PAL_Scale = -2.5;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_ice) {
    PAL_Offset = 0.5;
    PAL_Scale = 2.5;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_depthsnow) {
    PAL_Offset = 0;
    PAL_Scale = 0.125;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_watersnow) {
    PAL_Offset = 0;
    PAL_Scale = 0.001;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_height) {
    PAL_Multiplier = -1;
    PAL_Scale = -0.00075;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_cloudtop) {
    PAL_Scale = 0.001;
  }

  else if (DATA_allLayers[layerID] == LAYER_cloudceiling) {
    PAL_Scale = 0.001;
  }
  else if (DATA_allLayers[layerID] == LAYER_combwavesheight) {
    PAL_Scale = 0.4;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_swellwavesheight) {
    PAL_Scale = 0.4;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_windwavesheight) {
    PAL_Scale = 0.4;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_windwaveperiod) {
    PAL_Scale = 0.1;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_swellwaveperiod) {
    PAL_Scale = 0.1;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_peakwaveperiod) {
    PAL_Scale = 0.1;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_spchum) {
    PAL_Scale = 200;
    PAL_Offset = 0.01;
  }

  else if (DATA_allLayers[layerID] == LAYER_soilmoisture) {
    PAL_Scale = 2;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_soiltemperature) {
    PAL_Multiplier = -1;
    PAL_Scale = -0.05;
  }

  else if (DATA_allLayers[layerID] == LAYER_watertemperature) {
    PAL_Multiplier = -1;
    PAL_Scale = -0.05;
  }

  else if (DATA_allLayers[layerID] == LAYER_drybulb) {
    PAL_Multiplier = -1;
    PAL_Scale = -0.05;
  }

  else if (DATA_allLayers[layerID] == LAYER_dewpoint) {
    PAL_Multiplier = -1;
    PAL_Scale = -0.05;
  }

  else if (DATA_allLayers[layerID] == LAYER_depression) {
    PAL_Multiplier = -1;
    PAL_Scale = -0.05;
  }

  else if (DATA_allLayers[layerID] == LAYER_swellwavedirtrue) {
    PAL_Offset = 180;
    PAL_Multiplier = -1;
    PAL_Scale = -0.01;
  }

  else if (DATA_allLayers[layerID] == LAYER_windwavedirtrue) {
    PAL_Offset = 180;
    PAL_Multiplier = -1;
    PAL_Scale = -0.01;
  }

  else if (DATA_allLayers[layerID] == LAYER_winddir) {
    PAL_Offset = 180;
    PAL_Multiplier = -1;
    PAL_Scale = -1 / 90.0;
  }

  else if (DATA_allLayers[layerID] == LAYER_windspd) {
    PAL_Scale = 0.1;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_windU) {
    PAL_Scale = 0.1;
  }

  else if (DATA_allLayers[layerID] == LAYER_windV) {
    PAL_Scale = 0.1;
  }

  else if (DATA_allLayers[layerID] == LAYER_verticalvelocity) {
  }

  else if (DATA_allLayers[layerID] == LAYER_absolutevorticity) {
    PAL_Scale = 3600.0;
  }

  else if (DATA_allLayers[layerID] == LAYER_Water_level_above_mean_sea_level) {
    PAL_Offset = 5;
    PAL_Multiplier = -1;
    PAL_Scale = -1;
  }

  else if (DATA_allLayers[layerID] == LAYER_X_component_of_the_water_velocity) {
    PAL_Scale = 2;
  }

  else if (DATA_allLayers[layerID] == LAYER_Y_component_of_the_water_velocity) {
    PAL_Scale = 2;
  }

  else if (DATA_allLayers[layerID] == LAYER_Modulus_of_the_water_velocity) {
    PAL_Scale = 2;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_Direction_of_the_water_velocity) {
    PAL_Offset = 180;
    PAL_Scale = 1 / 90.0;
  }

  else if (DATA_allLayers[layerID] == LAYER_Froude_number) {
    PAL_Scale = 10;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_Shear_of_the_water_velocity) {
    PAL_Scale = 50;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_Specific_discharge) {
    PAL_Scale = 0.25;
    Impact_TYPE = Impact_ACTIVE;
  }

  else if (DATA_allLayers[layerID] == LAYER_Water_Transport_Diffusion_Index) {
    PAL_Scale = 100.0;
    Impact_TYPE = Impact_ACTIVE;
  }
}

float AdjustValue (float _val) {
  float _u = PAL_Scale * (_val - PAL_Offset);

  _u = 0.5 + 0.5 * _u;

  if (PAL_DIR == -1) _u = 1 - _u;
  if (PAL_DIR == -2) _u = 0.5 - 0.5 * _u;
  if (PAL_DIR == 2) _u =  0.5 * _u;

  return _u;

}

void create_gridPalettes (int layerID) {
  int pal_length = SOLARCHVISION_W_Pixel / 3;

  int RES1 = pal_length;
  int RES2 = int(0.05 * pal_length);

  PGraphics tmpGraphics = createGraphics(RES1, RES2);

  tmpGraphics.beginDraw();

  tmpGraphics.background(0);

  setAdjustParameters(layerID);

  for (int q = 0; q < 11; q += 1) {
    float _val = (q - 5) * 0.4;

    if (Impact_TYPE == Impact_ACTIVE) _val = q * 0.2;

    _val *= PAL_Multiplier;

    _val /= PAL_Scale;
    _val += PAL_Offset;

    float _u = AdjustValue(_val);

    float[] COL = SOLARCHVISION_GET_COLOR_STYLE(PAL_TYPE, _u);

    tmpGraphics.strokeWeight(0);
    tmpGraphics.stroke(COL[1], COL[2], COL[3], COL[0]);
    tmpGraphics.fill(COL[1], COL[2], COL[3], COL[0]);

    float x1 = q * (pal_length / 11.0);
    float x2 = x1 + pal_length / 11.0;
    float y1 = 0;
    float y2 = RES2;

    tmpGraphics.beginShape();
    tmpGraphics.vertex(x1, y1);
    tmpGraphics.vertex(x1, y2);
    tmpGraphics.vertex(x2, y2);
    tmpGraphics.vertex(x2, y1);
    tmpGraphics.endShape(CLOSE);

    if (COL[1] + COL[2] + COL[3] > 1.75 * 255) {
      tmpGraphics.stroke(127);
      tmpGraphics.fill(127);
      tmpGraphics.strokeWeight(0);
    } else {
      tmpGraphics.stroke(255);
      tmpGraphics.fill(255);
      tmpGraphics.strokeWeight(2);
    }

    String txtNumber = "";

    if (abs(_val) < 1) txtNumber = nf((roundTo(_val, 0.001)), 1, 3);
    else if (abs(_val) < 100) txtNumber = nf((roundTo(_val, 0.1)), 1, 1);
    else txtNumber = nf(int(roundTo(_val, 1)), 0);

    float txtSize = 0.5 * (y2 - y1);
    if (abs(_val) > 1000) txtSize *= 0.75;

    tmpGraphics.textSize(txtSize);
    tmpGraphics.textAlign(CENTER, CENTER);

    tmpGraphics.text(txtNumber, 0.5 * (x1 + x2), 0.5 * (y1 + y2) - 0.1 * txtSize, 0);

  }

  tmpGraphics.endDraw();

  gridPalettes[layerID] = tmpGraphics;

}

float[][] gridPositions; // used for SHOP models

float[][][][][] allDataValues;
boolean Allocated_allDataValues = false;

PImage[] gridPalettes = new PImage[DATA_numLayers];

PImage gridStatistics;

int Impact_ACTIVE = 1;
int Impact_PASSIVE = 2;

int Impact_TYPE = Impact_PASSIVE;

int PAL_TYPE = 1;
int PAL_DIR = 1;

float PAL_Multiplier = 1;
float PAL_Scale = 1;
float PAL_Offset = 0;

PImage create_gridImage_basic (int timeID, int layerID, int levelID, int memberID) {
  int RES1 = gridNx;
  int RES2 = gridNy;

  PImage img = createImage(RES1, RES2, ARGB);

  img.loadPixels();

  setAdjustParameters(layerID);

  for (int i = 0; i < gridNx * gridNy; i++) {
    int x = i % RES1;
    int y = i / RES1;

    float _val = allDataValues[timeID][layerID][levelID][memberID][i];

    if (is_undefined_FLOAT(_val) == false) {
      float _u = AdjustValue(_val);

      float[] COL = SOLARCHVISION_GET_COLOR_STYLE(PAL_TYPE, _u);

      if ((COL[1] > 254) && (COL[2] > 254) && (COL[3] > 254)) COL[0] = 0;

      img.pixels[(RES2 - y - 1) * RES1 + x] = color(COL[1], COL[2], COL[3], COL[0]);
    }
    else {
      img.pixels[(RES2 - y - 1) * RES1 + x] = color(0, 0, 0, 0);
    }
  }

  img.updatePixels();

  return img;
}

PImage create_gridImage_statistics (int[] timeIDs, int layerID, int[] levelIDs, int[] memberIDs, int num_overlay) {
  int RES1 = gridNx;
  int RES2 = gridNy;

  // note: there is no need to process when n==0 i.e. case of Base Scenarios

  PImage img = createImage(RES1, RES2, ARGB);

  img.loadPixels();

  setAdjustParameters(Current_layerID);

  for (int i = 0; i < gridNx * gridNy; i++) {
    int x = i % RES1;
    int y = i / RES1;

    float[] _values = new float[num_overlay];

    for (int nDrw = 0; nDrw < num_overlay; nDrw += 1) {
      Current_timeID = timeIDs[nDrw];
      Current_memberID = memberIDs[nDrw];
      Current_levelID = levelIDs[nDrw];

      _values[nDrw] = allDataValues[Current_timeID][Current_layerID][Current_levelID][Current_memberID][i];
    }

    float[] normals = SOLARCHVISION_NORMAL(_values);

    float _val = normals[DATA_allStatistics[Current_statisticID]];

    if (is_undefined_FLOAT(_val) == false) {
      float _u = AdjustValue(_val);

      float[] COL = SOLARCHVISION_GET_COLOR_STYLE(PAL_TYPE, _u);

      if ((COL[1] > 254) && (COL[2] > 254) && (COL[3] > 254)) COL[0] = 0;

      img.pixels[(RES2 - y - 1) * RES1 + x] = color(COL[1], COL[2], COL[3], COL[0]);
    }
    else {
      img.pixels[(RES2 - y - 1) * RES1 + x] = color(0, 0, 0, 0);
    }
  }

  img.updatePixels();

  return img;
}

PImage create_gridImage_SHOP (int timeID, int layerID, int levelID, int memberID) {
  int RES1 = gridNx;
  int RES2 = gridNy;

  PGraphics graphic = createGraphics(RES1, RES2);

  graphic.beginDraw();

  setAdjustParameters(layerID);

  for (int i = 0; i < SHOP_num_points; i++) {
    float _val = allDataValues[timeID][layerID][levelID][memberID][i];

    if (is_undefined_FLOAT(_val) == false) {
      float _u = AdjustValue(_val);

      float[] COL = SOLARCHVISION_GET_COLOR_STYLE(PAL_TYPE, _u);

      if ((COL[1] > 254) && (COL[2] > 254) && (COL[3] > 254)) COL[0] = 0;

      graphic.fill(COL[1], COL[2], COL[3], COL[0]);
      graphic.noStroke();

      float lon = gridPositions[i][0];
      float lat = gridPositions[i][1];

      float x = RES1 * (lon - SHOP_min_lon) / (SHOP_max_lon - SHOP_min_lon);
      float y = RES2 * (lat - SHOP_min_lat) / (SHOP_max_lat - SHOP_min_lat);

      graphic.ellipse(x, (RES2 - 1) - y, 3, 3);

    }
    else {
    }
  }

  graphic.endDraw();

  return graphic;
}

float[] getLonLat (float ix , float iy) {
  float lon = 0;
  float lat = 0;

  if (gridTypeOfProjection == 0) { // Latitude/longitude

    float lat1 = gridLa1;
    float lon1 = gridLo1;

    float lat2 = gridLa2;
    float lon2 = gridLo2;

    lon = ix * (lon2 - lon1) / float(gridNx) + lon1;
    lat = iy * (lat2 - lat1) / float(gridNy) + lat1;
  }

  if (gridTypeOfProjection == 1) { // Rotated latitude/longitude

    float lat1 = gridLa1;
    float lon1 = gridLo1;

    float lat2 = gridLa2;
    float lon2 = gridLo2;

    lon = ix * (lon2 - lon1) / float(gridNx) + lon1;
    lat = iy * (lat2 - lat1) / float(gridNy) + lat1;

    float t1 = gridSouthLon;
    float t2 = -gridSouthLat - 90;
    float t3 = gridRotation - 90;

    float x = cos_ang(lat) * cos_ang(lon);
    float y = cos_ang(lat) * sin_ang(lon);
    float z = sin_ang(lat);

    float t;

    t = -t3;
    {
      float tmp_x = x * cos_ang(t) - y * sin_ang(t);
      float tmp_y = y * cos_ang(t) + x * sin_ang(t);
      float tmp_z = z;
      x = tmp_x;
      y = tmp_y;
      z = tmp_z;
    }

    t = -t2;
    {
      float tmp_y = y * cos_ang(t) - z * sin_ang(t);
      float tmp_z = z * cos_ang(t) + y * sin_ang(t);
      float tmp_x = x;
      x = tmp_x;
      y = tmp_y;
      z = tmp_z;
    }

    t = -t1;
    {
      float tmp_x = x * cos_ang(t) - y * sin_ang(t);
      float tmp_y = y * cos_ang(t) + x * sin_ang(t);
      float tmp_z = z;
      x = tmp_x;
      y = tmp_y;
      z = tmp_z;
    }

    lat = asin_ang(z);
    lon = atan2_ang(y, x);

    if (lon < lon1) lon += 360;
    else if (lon > lon2) lon -= 360;

  }

  if (gridTypeOfProjection == 20) { // Polar Stereographic Projection

    float Lat1 = gridLa1;
    float Lon1 = gridLo1;

    float LatD = gridLaD;
    float LonV = gridLoV;

    float dx = gridDx;
    float dy = gridDy;

    if (gridScanX == 0) dx = -dx;
    if (gridScanY == 0) dy = -dy;

    float h = 1.0;
    if (gridPCF != 0) {
      h = -1.0;
      LonV -= 180;
    }

    float de = (1.0 + sin_ang(abs(LatD))) * FLOAT_r_Earth_km;
    float dr = de * cos_ang(Lat1) / (1 + h * sin_ang(Lat1));

    float xp = -h * (sin_ang(Lon1 - LonV)) * dr / dx;
    float yp = (cos_ang(Lon1 - LonV)) * dr / dy;

    float de2 = de * de;

    float di = (ix - xp) * dx;
    float dj = (-iy - yp) * dy;
    float dr2 = di * di + dj * dj;

    lat = h * asin_ang((de2 - dr2) / (de2 + dr2));
    lon = LonV + h * atan2_ang(di, -dj);

    lon = (lon + 360) % 360;
    if (lon > 180) lon -= 360;
  }

  if (gridTypeOfProjection == 30) { // Lambert Conformal Projection

    float Lat1 = gridLa1;
    float Lon1 = gridLo1;

    float LatD = gridLaD;
    float LonV = gridLoV;

    float dx = gridDx;
    float dy = gridDy;

    if (gridScanX == 0) dx = -dx;
    if (gridScanY == 0) dy = -dy;

    float h = 1.0;
    if (gridPCF != 0) {
      h = -1.0;
      LonV -= 180;
    }

    float latin1r = gridFirstLatIn;
    float latin2r = gridSecondLatIn;

    float n = 0;
    if (abs(latin1r - latin2r) < 0.000000001) {
      n = sin_ang(latin1r);
    }
    else {
      n = log(cos_ang(latin1r) / cos_ang(latin2r)) / log(tan_ang(45 + 0.5 * latin2r) / tan_ang(45 + 0.5 * latin1r));
    }

    float f = (cos_ang(latin1r) * pow(tan_ang(45 + 0.5 * latin1r), n)) / n;

    float rho_ooo = FLOAT_r_Earth_km * f * pow(tan_ang(45 + 0.5 * Lat1), -n);
    float rho_ref = FLOAT_r_Earth_km * f * pow(tan_ang(45 + 0.5 * LatD), -n);

    float d_lon = Lon1 - LonV;

    float theta_ooo = n * d_lon;

    float startx = rho_ooo * sin_ang(theta_ooo);
    float starty = rho_ref - rho_ooo * cos_ang(theta_ooo);

    float y = starty - iy * dy;
    float tmp = rho_ref - y;

    float x = startx + ix * dx;
    float theta_new = atan2_ang(x, tmp);
    float rho_new = sqrt(x * x + tmp * tmp);
    if (n < 0) rho_new *= -1;

    lat = 2.0 * atan_ang(pow(FLOAT_r_Earth_km * f / rho_new, 1.0 / n)) - 90;
    lon = LonV + theta_new / n;

    lon = (lon + 360) % 360;
    if (lon > 180) lon -= 360;
  }

  float[] P = {lon, lat};

  return P;
}

float[] getIxIy (float lon, float lat) {
  float ix = 0;
  float iy = 0;

  if (gridTypeOfProjection == 0) { // Latitude/longitude

    float lat1 = gridLa1;
    float lon1 = gridLo1;

    float lat2 = gridLa2;
    float lon2 = gridLo2;

    // to work with something like GEPS
    if (lon2 > 180) {
      if (lon < 0) lon += 360;
    }

    ix = (lon - lon1) * gridNx / (lon2 - lon1);
    iy = (lat - lat1) * gridNy / (lat2 - lat1);
  }

  if (gridTypeOfProjection == 1) { // Rotated latitude/longitude

    float lat1 = gridLa1;
    float lon1 = gridLo1;

    float lat2 = gridLa2;
    float lon2 = gridLo2;

//////////////////////
//    gridSouthLat = -15;
//    gridSouthLon = 45;
//    gridRotation = 0;
//////////////////////
//    gridSouthLat = -31.758312;
//    gridSouthLon = 267.59702 - 90;
//    gridRotation = 0;
//////////////////////

    float t1 = gridSouthLon;
    float t2 = -gridSouthLat - 90;
    float t3 = gridRotation - 90;

    float x = cos_ang(lat) * cos_ang(lon);
    float y = cos_ang(lat) * sin_ang(lon);
    float z = sin_ang(lat);

    float t;

    t = t1;
    {
      float tmp_x = x * cos_ang(t) - y * sin_ang(t);
      float tmp_y = y * cos_ang(t) + x * sin_ang(t);
      float tmp_z = z;
      x = tmp_x;
      y = tmp_y;
      z = tmp_z;
    }

    t = t2;
    {
      float tmp_y = y * cos_ang(t) - z * sin_ang(t);
      float tmp_z = z * cos_ang(t) + y * sin_ang(t);
      float tmp_x = x;
      x = tmp_x;
      y = tmp_y;
      z = tmp_z;
    }

    t = t3;
    {
      float tmp_x = x * cos_ang(t) - y * sin_ang(t);
      float tmp_y = y * cos_ang(t) + x * sin_ang(t);
      float tmp_z = z;
      x = tmp_x;
      y = tmp_y;
      z = tmp_z;
    }

    lat = asin_ang(z);
    lon = atan2_ang(y, x);

    if (lon < lon1) lon += 360;
    else if (lon > lon2) lon -= 360;

    ix = (lon - lon1) * gridNx / (lon2 - lon1);
    iy = (lat - lat1) * gridNy / (lat2 - lat1);
  }

  if (gridTypeOfProjection == 20) { // Polar Stereographic Projection

    float Lat1 = gridLa1;
    float Lon1 = gridLo1;

    float LatD = gridLaD;
    float LonV = gridLoV;

    float h = 1.0;
    if (gridPCF != 0) {
      h = -1.0;
      LonV -= 180;
    }

    float dx = gridDx;
    float dy = gridDy;

    if (gridScanX == 0) dx = -dx;
    if (gridScanY == 0) dy = -dy;

    float de = (1.0 + sin_ang(abs(LatD))) * FLOAT_r_Earth_km;
    float dr = de * cos_ang(Lat1) / (1 + h * sin_ang(Lat1));

    float xp = -h * (sin_ang(Lon1 - LonV)) * dr / dx;
    float yp = (cos_ang(Lon1 - LonV)) * dr / dy;

    float de2 = de * de;

    float M = sin_ang(lat / h);
    float dr2 = de2 * (1 - M) / (1 + M);

    float N = tan_ang((lon - LonV) / h);
    float dj = -pow(dr2 / (N * N + 1), 0.5);

    float LonQ = (lon + 180) % 360;

    if ((LonQ - LonV > -90) && (LonQ - LonV < 90)) dj *= -1;

    float di = N * (-dj);

    ix = (di / dx) + xp;
    iy = -((dj / dy) + yp);
  }

  if (gridTypeOfProjection == 30) { // Lambert Conformal Projection

    float Lat1 = gridLa1;
    float Lon1 = gridLo1;

    float LatD = gridLaD;
    float LonV = gridLoV;

    float dx = gridDx;
    float dy = gridDy;

    if (gridScanX == 0) dx = -dx;
    if (gridScanY == 0) dy = -dy;

    float h = 1.0;
    if (gridPCF != 0) {
      h = -1.0;
      LonV -= 180;
    }

    float latin1r = gridFirstLatIn;
    float latin2r = gridSecondLatIn;

    float n = 0;
    if (abs(latin1r - latin2r) < 0.000000001) {
      n = sin_ang(latin1r);
    }
    else {
      n = log(cos_ang(latin1r) / cos_ang(latin2r)) / log(tan_ang(45 + 0.5 * latin2r) / tan_ang(45 + 0.5 * latin1r));
    }

    float f = (cos_ang(latin1r) * pow(tan_ang(45 + 0.5 * latin1r), n)) / n;

    float rho_ooo = FLOAT_r_Earth_km * f * pow(tan_ang(45 + 0.5 * Lat1), -n);
    float rho_ref = FLOAT_r_Earth_km * f * pow(tan_ang(45 + 0.5 * LatD), -n);

    float d_lon = Lon1 - LonV;

    float theta_ooo = n * d_lon;

    float startx = rho_ooo * sin_ang(theta_ooo);
    float starty = rho_ref - rho_ooo * cos_ang(theta_ooo);

    lon = (lon + 180) % 360 + 180; // <<<<<<<<<<

    float theta_new = n * (lon - LonV);

    float rho_new = FLOAT_r_Earth_km * f / pow(tan_ang(0.5 * (lat + 90)), n);

    if (n < 0) rho_new *= -1;

    float tmp = rho_new * cos_ang(theta_new);

    float x = tmp * tan_ang(theta_new);

    ix = (x - startx) / dx;

    float y = rho_ref - tmp;

    iy = -(y - starty) / dy;
  }

  float[] P = {ix, iy};

  return P;

}

float asin_ang (float a) {
  return ((asin(a)) * 180/PI);
}

float acos_ang (float a) {
  return ((acos(a)) * 180/PI);
}

float atan_ang (float a) {
  return ((atan(a)) * 180/PI);
}

float atan2_ang (float a, float b) {
  return ((atan2(a, b)) * 180/PI);
}

float sin_ang (float a) {
  return sin(a * PI / 180);
}

float cos_ang (float a) {
  return cos(a * PI / 180);
}

float tan_ang (float a) {
  return tan(a * PI / 180);
}

float roundTo (float a, float b) {
  float a_floor = (floor (a / (1.0 * b))) * b;
  float a_ceil =  (ceil (a / (1.0 * b))) * b;
  float c;
  if ((a - a_floor) > (a_ceil - a)) {
    c = a_ceil;
  } else {
    c = a_floor;
  }
  return c;
}

String STRING_undefined = "N/A";
float FLOAT_undefined = 2000000000; // it must be a positive big number that is not included in any data
float FLOAT_max_defined = 0.95 * FLOAT_undefined;

boolean is_undefined_FLOAT (float a) {
  boolean b = false;
  if (a > FLOAT_max_defined) {
    b = true;
  }
  return b;
}

float FLOAT_r_Earth_km = 6367.470;

int STUDY_O_scale = 127;

float[] SOLARCHVISION_WBGRW (float _variable) {
  _variable *= 600.0;

  float v;
  float[] COL = {
    255, 0, 0, 0
  };

  if (_variable < 0) {
    COL[1] = 255;
    COL[2] = 255;
    COL[3] = 255;
  } else if (_variable < 100) {
    v = ((_variable) * 2.55);
    COL[1] = (255 - v);
    COL[2] = (255 - v);
    COL[3] = 255;
  } else if (_variable < 200) {
    v = ((_variable - 100) * 2.55);
    COL[1] = 0;
    COL[2] = v;
    COL[3] = 255;
  } else if (_variable < 300) {
    v = ((_variable - 200) * 2.55);
    COL[1] = 0;
    COL[2] = 255;
    COL[3] = (255 - v);
  } else if (_variable < 400) {
    v = ((_variable - 300) * 2.55);
    COL[1] = v;
    COL[2] = 255;
    COL[3] = 0;
  } else if (_variable < 500) {
    v = ((_variable - 400) * 2.55);
    COL[1] = 255;
    COL[2] = (255 - v);
    COL[3] = 0;
  } else if (_variable < 600) {
    v = ((_variable - 500) * 2.55);
    COL[1] = 255;
    COL[2] = v;
    COL[3] = v;
  } else {
    COL[1] = 255;
    COL[2] = 255;
    COL[3] = 255;
  }

  return COL;
}

float[] SOLARCHVISION_BGR (float _variable) {
  _variable *= 400.0;

  float v;
  float[] COL = {
    255, 0, 0, 0
  };

  if (_variable < 0) {
    COL[1] = 0;
    COL[2] = 0;
    COL[3] = 255;
  } else if (_variable < 100) {
    v = ((_variable) * 2.55);
    COL[1] = 0;
    COL[2] = v;
    COL[3] = 255;
  } else if (_variable < 200) {
    v = ((_variable - 100) * 2.55);
    COL[1] = 0;
    COL[2] = 255;
    COL[3] = (255 - v);
  } else if (_variable < 300) {
    v = ((_variable - 200) * 2.55);
    COL[1] = v;
    COL[2] = 255;
    COL[3] = 0;
  } else if (_variable < 400) {
    v = ((_variable - 300) * 2.55);
    COL[1] = 255;
    COL[2] = (255 - v);
    COL[3] = 0;
  } else {
    COL[1] = 255;
    COL[2] = 0;
    COL[3] = 0;
  }

  return COL;
}

float[] SOLARCHVISION_DBGR (float _variable) {
  _variable *= 500.0;

  float v;
  float[] COL = {
    255, 0, 0, 0
  };
  if (_variable < 0) {
    COL[1] = 0;
    COL[2] = 0;
    COL[3] = 0;
  } else if (_variable < 100) {
    v = ((_variable) * 2.55);
    COL[1] = 0;
    COL[2] = 0;
    COL[3] = v;
  } else if (_variable < 200) {
    v = ((_variable - 100) * 2.55);
    COL[1] = 0;
    COL[2] = v;
    COL[3] = 255;
  } else if (_variable < 300) {
    v = ((_variable - 200) * 2.55);
    COL[1] = 0;
    COL[2] = 255;
    COL[3] = (255 - v);
  } else if (_variable < 400) {
    v = ((_variable - 300) * 2.55);
    COL[1] = v;
    COL[2] = 255;
    COL[3] = 0;
  } else if (_variable < 500) {
    v = ((_variable - 400) * 2.55);
    COL[1] = 255;
    COL[2] = (255 - v);
    COL[3] = 0;
  } else {
    COL[1] = 255;
    COL[2] = 0;
    COL[3] = 0;
  }

  return COL;
}

float[] SOLARCHVISION_DWBGR (float _variable) {
  _variable *= 600.0;

  float v;
  float[] COL = {
    255, 0, 0, 0
  };
  if (_variable < 0) {
    COL[1] = 0;
    COL[2] = 0;
    COL[3] = 0;
  } else if (_variable < 100) {
    v = ((_variable) * 2.55);
    COL[1] = v;
    COL[2] = v;
    COL[3] = v;
  } else if (_variable < 200) {
    v = ((_variable - 100) * 2.55);
    COL[1] = (255 - v);
    COL[2] = (255 - v);
    COL[3] = 255;
  } else if (_variable < 300) {
    v = ((_variable - 200) * 2.55);
    COL[1] = 0;
    COL[2] = v;
    COL[3] = 255;
  } else if (_variable < 400) {
    v = ((_variable - 300) * 2.55);
    COL[1] = 0;
    COL[2] = 255;
    COL[3] = (255 - v);
  } else if (_variable < 500) {
    v = ((_variable - 400) * 2.55);
    COL[1] = v;
    COL[2] = 255;
    COL[3] = 0;
  } else if (_variable < 600) {
    v = ((_variable - 500) * 2.55);
    COL[1] = 255;
    COL[2] = (255 - v);
    COL[3] = 0;
  } else {
    COL[1] = 255;
    COL[2] = 0;
    COL[3] = 0;
  }

  return COL;
}

float[] SOLARCHVISION_DWYR (float _variable) {
  _variable *= 400.0;

  float v;
  float[] COL = {
    255, 0, 0, 0
  };
  if (_variable < 0) {
    COL[1] = 0;
    COL[2] = 0;
    COL[3] = 0;
  } else if (_variable < 100) {
    v = ((_variable) * 2.55);
    COL[1] = v;
    COL[2] = v;
    COL[3] = v;
  } else if (_variable < 200) {
    v = ((_variable - 100) * 2.55);
    COL[1] = 255;
    COL[2] = 255;
    COL[3] = (255 - v);
  } else if (_variable < 300) {
    v = ((_variable - 200) * 2.55);
    COL[1] = 255;
    COL[2] = (255 - v);
    COL[3] = 0;
  } else if (_variable < 400) {
    v = ((_variable - 300) * 2.55);
    COL[1] = 255 - 0.5 * v;
    COL[2] = 0;
    COL[3] = 0;
  } else {
    COL[1] = 127;
    COL[2] = 0;
    COL[3] = 0;
  }

  return COL;
}

float[] SOLARCHVISION_VDWBGR (float _variable) {
  _variable *= 700.0;

  float v;
  float[] COL = {
    255, 0, 0, 0
  };
  if (_variable < 0) {
    COL[1] = 255;
    COL[2] = 0;
    COL[3] = 255;
  } else if (_variable < 100) {
    v = ((_variable - 0) * 2.55);
    COL[1] = (255 - v);
    COL[2] = 0;
    COL[3] = (255 - v);
  } else if (_variable < 200) {
    v = ((_variable - 100) * 2.55);
    COL[1] = v;
    COL[2] = v;
    COL[3] = v;
  } else if (_variable < 300) {
    v = ((_variable - 200) * 2.55);
    COL[1] = (255 - v);
    COL[2] = (255 - v);
    COL[3] = 255;
  } else if (_variable < 400) {
    v = ((_variable - 300) * 2.55);
    COL[1] = 0;
    COL[2] = v;
    COL[3] = 255;
  } else if (_variable < 500) {
    v = ((_variable - 400) * 2.55);
    COL[1] = 0;
    COL[2] = 255;
    COL[3] = (255 - v);
  } else if (_variable < 600) {
    v = ((_variable - 500) * 2.55);
    COL[1] = v;
    COL[2] = 255;
    COL[3] = 0;
  } else if (_variable < 700) {
    v = ((_variable - 600) * 2.55);
    COL[1] = 255;
    COL[2] = (255 - v);
    COL[3] = 0;
  } else {
    COL[1] = 255;
    COL[2] = 0;
    COL[3] = 0;
  }

  return COL;
}

float[] SOLARCHVISION_DRYWCBD (float _variable) {
  _variable *= 1.5;

  float v;
  float[] COL = {
    255, 0, 0, 0
  };
  if (_variable <= -2.75) {
    COL[1] = 63;
    COL[2] = 0;
    COL[3] = 0;
  } else if (_variable < -2) {
    v = (-(_variable + 2) * 255);
    COL[1] = 255 - v;
    COL[2] = 0;
    COL[3] = 0;
  } else if (_variable < -1) {
    v = (-(_variable + 1) * 255);
    COL[1] = 255;
    COL[2] = 255 - v;
    COL[3] = 0;
  } else if (_variable < 0) {
    v = (-_variable * 255);
    COL[1] = 255;
    COL[2] = 255;
    COL[3] = 255 - v;
  } else if (_variable < 1) {
    v = (_variable * 255);
    COL[1] = 255 - v;
    COL[2] = 255;
    COL[3] = 255;
  } else if (_variable < 2) {
    v = ((_variable - 1) * 255);
    COL[1] = 0;
    COL[2] = 255 - v;
    COL[3] = 255;
  } else if (_variable < 2.75) {
    v = ((_variable - 2) * 255);
    COL[1] = 0;
    COL[2] = 0;
    COL[3] = 255 - v;
  } else {
    COL[1] = 0;
    COL[2] = 0;
    COL[3] = 63;
  }

  return COL;
}

float[] SOLARCHVISION_DBCW (float _variable) {
  _variable = 1 - _variable;
  _variable *= -3;

  float v;
  float[] COL = {
    255, 0, 0, 0
  };
  if (_variable < -3) {
    COL[1] = 0;
    COL[2] = 0;
    COL[3] = 0;
  } else if (_variable < -2) {
    v = (-(_variable + 2) * 255);
    COL[1] = 255 - v;
    COL[2] = 0;
    COL[3] = 0;
  } else if (_variable < -1) {
    v = (-(_variable + 1) * 255);
    COL[1] = 255;
    COL[2] = 255 - v;
    COL[3] = 0;
  } else if (_variable < 0) {
    v = (-_variable * 255);
    COL[1] = 255;
    COL[2] = 255;
    COL[3] = 255 - v;
  } else {
    COL[1] = 255;
    COL[2] = 255;
    COL[3] = 255;
  }

  float r, g, b;
  r = COL[3];
  g = COL[2];
  b = COL[1];
  COL[1] = r;
  COL[2] = g;
  COL[3] = b;

  return COL;
}

float[] SOLARCHVISION_GET_COLOR_STYLE (int COLOR_STYLE_Active, float j) {
  float[] c = {
    255, 0, 0, 0
  };

  if (COLOR_STYLE_Active == 0) {
    c[0] = 255;
    c[1] = 0;
    c[2] = 0;
    c[3] = 0;
  } else if (COLOR_STYLE_Active == 19) {
    float[] COL = SOLARCHVISION_DWYR(j);
    c[0] = 255;
    c[1] = COL[1];
    c[2] = COL[2];
    c[3] = COL[3];
  } else if (COLOR_STYLE_Active == 18) {
    float[] COL = SOLARCHVISION_DRYWCBD(2.0 * (j - 0.5));
    c[0] = 255;
    c[1] = COL[3];
    c[2] = COL[2];
    c[3] = COL[1];
  } else if (COLOR_STYLE_Active == 17) {
    float[] COL = SOLARCHVISION_DRYWCBD(2.0 * (j - 0.5));
    c[0] = 255;
    c[1] = 255 - COL[3];
    c[2] = 255 - COL[2];
    c[3] = 255 - COL[1];
  } else if (COLOR_STYLE_Active == 16) {
    float[] COL = SOLARCHVISION_DBCW(j);
    c[0] = 255;
    c[1] = COL[1];
    c[2] = COL[2];
    c[3] = COL[3];
  } else if (COLOR_STYLE_Active == 15) {
    float[] COL = SOLARCHVISION_DRYW(j);
    c[0] = 255;
    c[1] = COL[1];
    c[2] = COL[2];
    c[3] = COL[3];
  } else if (COLOR_STYLE_Active == 14) {
    float[] COL = SOLARCHVISION_DBGR(j);
    c[0] = 255;
    c[1] = COL[1];
    c[2] = COL[2];
    c[3] = COL[3];
  } else if (COLOR_STYLE_Active == 13) {
    float[] COL = SOLARCHVISION_DWBGR(j);
    c[0] = 255;
    c[1] = COL[1];
    c[2] = COL[2];
    c[3] = COL[3];
  } else if (COLOR_STYLE_Active == 12) {
    float[] COL = SOLARCHVISION_BGR(j);
    c[0] = 255;
    c[1] = COL[1];
    c[2] = COL[2];
    c[3] = COL[3];
  } else if (COLOR_STYLE_Active == 11) {
    float[] COL = SOLARCHVISION_BGR(j);
    c[0] = 127;
    c[1] = 255 - 0.5 * COL[1];
    c[2] = 255 - 0.5 * COL[2];
    c[3] = 255 - 0.5 * COL[3];
  } else if (COLOR_STYLE_Active == 10) {
    float[] COL = SOLARCHVISION_BGR(j);
    c[0] = 255;
    c[1] = 255 - COL[1];
    c[2] = 255 - COL[2];
    c[3] = 255 - COL[3];
  } else if (COLOR_STYLE_Active == 9) {
    float[] COL = SOLARCHVISION_WBGRW(j);
    c[0] = 255;
    c[1] = COL[1];
    c[2] = COL[2];
    c[3] = COL[3];
  } else if (COLOR_STYLE_Active == 8) {
    float[] COL = SOLARCHVISION_BGR(j);
    c[0] = 255;
    c[1] = 255 - COL[1];
    c[2] = 255 - COL[2];
    c[3] = 255 - COL[3];
  } else if (COLOR_STYLE_Active == 7) {
    float[] COL = SOLARCHVISION_WBGRW(j);
    c[0] = 255;
    c[1] = 255 - COL[1];
    c[2] = 255 - COL[2];
    c[3] = 255 - COL[3];
  } else if (COLOR_STYLE_Active == 6) {
    float[] COL = SOLARCHVISION_BGR(j);
    c[0] = 255;
    c[1] = COL[3];
    c[2] = COL[2];
    c[3] = COL[1];
  } else if (COLOR_STYLE_Active == 4) {
    float[] COL = SOLARCHVISION_VDWBGR(j);
    c[0] = STUDY_O_scale;
    c[1] = COL[1];
    c[2] = COL[2];
    c[3] = COL[3];
  } else if (COLOR_STYLE_Active == 3) {
    float[] COL = SOLARCHVISION_VDWBGR(j);
    c[0] = 255;
    c[1] = COL[1];
    c[2] = COL[2];
    c[3] = COL[3];
  } else if (COLOR_STYLE_Active == 2) {
    float[] COL = SOLARCHVISION_DRYWCBD(2.0 * (j - 0.5));
    c[0] = STUDY_O_scale;
    c[1] = COL[1];
    c[2] = COL[2];
    c[3] = COL[3];
  } else if (COLOR_STYLE_Active == 1) {
    float[] COL = SOLARCHVISION_DRYWCBD(2.0 * (j - 0.5));
    c[0] = 255;
    c[1] = COL[1];
    c[2] = COL[2];
    c[3] = COL[3];
  } else if (COLOR_STYLE_Active == 5) {
    c[0] = 255;
    c[1] = 0;
    c[2] = 0;
    c[3] = 0;
  } else if (COLOR_STYLE_Active == -1) {
    float[] COL = SOLARCHVISION_DRYWCBD(2.0 * (j - 0.5));
    c[0] = 255;
    c[1] = 255 - COL[3];
    c[2] = 255 - COL[2];
    c[3] = 255 - COL[1];
  }

  return c;
}

float[] SOLARCHVISION_DRYW (float _variable) {
  _variable = 1 - _variable;
  _variable *= -3;

  float v;
  float[] COL = {
    255, 0, 0, 0
  };
  if (_variable < -3) {
    COL[1] = 0;
    COL[2] = 0;
    COL[3] = 0;
  } else if (_variable < -2) {
    v = (-(_variable + 2) * 255);
    COL[1] = 255 - v;
    COL[2] = 0;
    COL[3] = 0;
  } else if (_variable < -1) {
    v = (-(_variable + 1) * 255);
    COL[1] = 255;
    COL[2] = 255 - v;
    COL[3] = 0;
  } else if (_variable < 0) {
    v = (-_variable * 255);
    COL[1] = 255;
    COL[2] = 255;
    COL[3] = 255 - v;
  } else {
    COL[1] = 255;
    COL[2] = 255;
    COL[3] = 255;
  }

  return COL;
}

float[] SOLARCHVISION_WYRD (float _variable) {
  _variable *= -3;

  float v;
  float[] COL = {
    255, 0, 0, 0
  };
  if (_variable < -3) {
    COL[1] = 0;
    COL[2] = 0;
    COL[3] = 0;
  } else if (_variable < -2) {
    v = (-(_variable + 2) * 255);
    COL[1] = 255 - v;
    COL[2] = 0;
    COL[3] = 0;
  } else if (_variable < -1) {
    v = (-(_variable + 1) * 255);
    COL[1] = 255;
    COL[2] = 255 - v;
    COL[3] = 0;
  } else if (_variable < 0) {
    v = (-_variable * 255);
    COL[1] = 255;
    COL[2] = 255;
    COL[3] = 255 - v;
  } else {
    COL[1] = 255;
    COL[2] = 255;
    COL[3] = 255;
  }

  return COL;
}

float EquationOfTime (float DateAngle) {
  float b = DateAngle;

  return 0.01  * (9.87 * sin_ang(2 * b) - 7.53 * cos_ang(b) - 1.5 * sin_ang(b));
}

float FLOAT_e = 2.7182818284;

float[] SOLARCHVISION_SunPositionRadiation (float DateAngle, float HourAngleOrigin, float LocationLatitude, float SurfacePressure, float CloudCover) {
// note the input variables are differnet from the other tools!

  float HourAngle = HourAngleOrigin + EquationOfTime(DateAngle);

  float Declination = 23.45 * sin_ang(DateAngle - 180.0);

  float a = sin_ang(Declination);
  float b = cos_ang(Declination) * -cos_ang(15.0 * HourAngleOrigin);
  float c = cos_ang(Declination) *  sin_ang(15.0 * HourAngleOrigin);

  float x = c;
  float y = -(a * cos_ang(LocationLatitude) + b * sin_ang(LocationLatitude));
  float z = -a * sin_ang(LocationLatitude) + b * cos_ang(LocationLatitude);

  float Io = 1367.0; // W/m²
  Io = Io * (1.0 - (0.0334 * sin_ang(DateAngle)));

  float ALT_ = (asin_ang(z)) * PI / 180;
  float ALT_true = ALT_ + 0.061359 * (0.1594 + 1.1230 * ALT_ + 0.065656 * ALT_ * ALT_) / (1 + 28.9344 * ALT_ + 277.3971 * ALT_ * ALT_);

  //////////////////////////////////////////////
  float LocationElevation = 0; //<<<<<<<<<<<<<<<<<<<<<< should compute elevation from pressure!
  //////////////////////////////////////////////

  float PPo = pow(FLOAT_e, (-LocationElevation / 8435.2));

  float Bb = ((sin_ang (ALT_true * 180 / PI)) + (0.50572 * pow((57.29578 * ALT_true + 6.07995), -1.6364)));
  float m = PPo / Bb;

  float StationTurbidity;

  //StationTurbidity = (2.0 - 0.2) * (0.01 * CloudCover) + 0.2;
  //StationTurbidity = (1.0 - 0.2) * (0.01 * CloudCover) + 0.2;
  //StationTurbidity = (2.0 - 0.4) * (0.01 * CloudCover) + 0.4;
  StationTurbidity = (2.0 - 0.3) * (0.01 * CloudCover) + 0.3;

  float AtmosphereRatio;
  if (z < 0.01) AtmosphereRatio = 0.0;
  else AtmosphereRatio = pow(FLOAT_e, (-m * StationTurbidity));

  float Idirect = Io * AtmosphereRatio; // Optical air mass: global Meteorological Database for Engineers, Planners and Education; Version 5.00 - Edition 2003

  float Idiffuse;
  if (z < 0.01) Idiffuse = 0.0;
  //else Idiffuse = ((0.5 + 0.5 * (0.01 * CloudCover)) * z * (Io - Idirect)) / (1.0 - 1.4 * z * log(Idirect / Io));
  else Idiffuse = (0.5 * z * (Io - Idirect)) / (1.0 - 1.4 * z * log(Idirect / Io));

  float[] return_array = {
    0, x, y, z, Idirect, Idiffuse
  };
  return return_array;
}

float SolarAtSurface (float SunR1, float SunR2, float SunR3, float SunR4, float SunR5, float Alpha, float Beta, float THE_ALBEDO) {
  float return_value = 0;

  float[] VECT = {0, 0, 0};

  if (abs(Alpha) > 89.99) {
    VECT[0] = 0;
    VECT[1] = 0;
    VECT[2] = 1;
  } else if (Alpha < -89.99) {
    VECT[0] = 0;
    VECT[1] = 0;
    VECT[2] = -1;
  } else {
    VECT[0] = sin_ang(Beta);
    VECT[1] = -cos_ang(Beta);
    VECT[2] = tan_ang(Alpha);
  }

  VECT = fn_normalize(VECT);

  float[] SunV = {SunR1, SunR2, SunR3};

  float SunMask = fn_dot(fn_normalize(SunV), fn_normalize(VECT));
  if (SunMask <= 0) SunMask = 0; // removes backing faces

  float SkyMask = (0.5 * (1.0 + (Alpha / 90.0)));

  return_value = (SunR4 * SunMask) + (SunR5 * SkyMask);

  float[] REF_SunV = {SunR1, SunR2, -SunR3};

  float REF_SunMask = fn_dot(fn_normalize(REF_SunV), fn_normalize(VECT));
  if (REF_SunMask <= 0) REF_SunMask = 0; // removes backing faces

  float REF_SkyMask = 1 - (0.5 * (1.0 + (Alpha / 90.0)));

  return_value += THE_ALBEDO * ((SunR4 * REF_SunMask) + (SunR5 * REF_SkyMask));

  return (return_value);
}

float[] fn_normalize (float[] a) {
  float[] b = a;
  float d = 0;
  for (int i = 0; i < a.length; i++) {
    d += pow(a[i], 2);
  }
  d = pow(d, 0.5);

  for (int i = 0; i < a.length; i++) {
    if (d != 0) b[i] = a[i]/d;
    else {
      b[i] = 0;
      //b[1] = 1; // << to have a normal vector.
    }
  }
  return b;
}

float fn_dot (float[] a, float b[]) {
  float d = 0;
  for (int i = 0; i < min (a.length, b.length); i++) {
    d += a[i] * b[i];
  }
  return d;
}

int isInside (float x, float y, float x1, float y1, float x2, float y2) {
  if ((x1 < x) && (x < x2) && (y1 < y) && (y < y2)) return 1;
  else return 0;
}

float dist_lon_lat (double lon1, double lat1, double lon2, double lat2) {
  float dLon = (float) (lon2 - lon1);
  float dLat = (float) (lat2 - lat1);

  float a = sin_ang(dLon / 2.0);
  float b = sin_ang(dLat / 2.0) * sin_ang(dLat / 2.0) + cos_ang((float) lat1) * cos_ang((float) lat2) * a * a;
  float d = 2 * atan2(sqrt(b), sqrt(1 - b)) * FLOAT_r_Earth_km;

  return(d);
}

int LOCATIONS_NUMBER = 0;

String[][] LOCATIONS_INFO;

void LOAD_LOCATIONS () {
  int n_Locations = 0;

  String[] FileALL = loadStrings(CITIES_Coordinates);

  String lineSTR;
  String[] input;

  int pre_LOCATIONS_NUMBER = LOCATIONS_NUMBER;
  LOCATIONS_NUMBER += FileALL.length - 1; // to skip the first description line

  LOCATIONS_INFO = new String[LOCATIONS_NUMBER][8];

  for (int f = pre_LOCATIONS_NUMBER; f < LOCATIONS_NUMBER; f += 1) {
    lineSTR = FileALL[f + 1 - pre_LOCATIONS_NUMBER]; // to skip the first description line

    String[] parts = split(lineSTR, '\t');

    if (23 < parts.length) {
      LOCATIONS_INFO[n_Locations][0] = parts[8];
      LOCATIONS_INFO[n_Locations][1] = parts[18];
      LOCATIONS_INFO[n_Locations][2] = parts[15]; //14, 15, 19
      LOCATIONS_INFO[n_Locations][3] = parts[21].replace(",", ".");
      LOCATIONS_INFO[n_Locations][4] = parts[22].replace(",", ".");
      LOCATIONS_INFO[n_Locations][5] = parts[0]; // ScaleRank

      n_Locations += 1;

    }
  }

  LOCATIONS_NUMBER = n_Locations;

}

float SHOP_min_lon = 360;
float SHOP_min_lat = 90;
float SHOP_max_lon = -360;
float SHOP_max_lat = -90;

float SHOP_num_points = 0;

void LOAD_SHOP_POSITIONS () {
  String[] fileStrings = loadStrings(SHOP_Coordinates); // loading the data as String array

  gridPositions = new float[fileStrings.length][2];

  int n = 0;

  for (int i = 0; i < fileStrings.length; i++) {
    String[] parts = split(fileStrings[i], ',');

    float lon = float(parts[2]);
    float lat = float(parts[1]);

    gridPositions[n][0] = lon;
    gridPositions[n][1] = lat;

    n += 1;

    if (SHOP_min_lon > lon) SHOP_min_lon = lon;
    if (SHOP_max_lon < lon) SHOP_max_lon = lon;
    if (SHOP_min_lat > lat) SHOP_min_lat = lat;
    if (SHOP_max_lat < lat) SHOP_max_lat = lat;
  }

  SHOP_num_points = n;

  allDataValues = new float[DATA_numTimes][DATA_numLayers][DATA_numLevels][DATA_numMembers][n];

  allDataTitles = new String[DATA_numTimes][DATA_numLayers][DATA_numLevels][DATA_numMembers];

  gridTypeOfProjection = 0; //Latitude/longitude

  gridLo1 = SHOP_min_lon;
  gridLo2 = SHOP_max_lon;

  gridLa1 = SHOP_min_lat;
  gridLa2 = SHOP_max_lat;

  gridNx = 4 * SOLARCHVISION_W_Pixel;
  gridNy = 4 * SOLARCHVISION_H_Pixel;

}

void DOWNLOAD_DATA_SWOB () {
  LOAD_SWOB_POSITIONS();

  { // downloads required SWOB files if they are not in the directory and then load the values into memory.

    ///////////////////////////////////////////////////////////////////
    for (int q = 0; q < numberOfNearestStations_RECENT_OBSERVED; q++) {
      nearest_Station_RECENT_OBSERVED_id[q] = q;
    }
    ///////////////////////////////////////////////////////////////////

    DATA_ModelTime = DATA_ModelEnd + DATA_ModelStep;

    for (int timeID = DATA_numTimes - 1; timeID >= 0; timeID -= 1) {
      DATA_ModelTime -= DATA_ModelStep;

      //////////////////////////////////
      int THE_HOUR = DATA_ModelTime; // note we should define what if the hour goes to the next day below!
      int THE_DAY = DATA_ModelDay;
      int THE_MONTH = DATA_ModelMonth;
      int THE_YEAR = DATA_ModelYear;
      //////////////////////////////////

      for (int q = 0; q < numberOfNearestStations_RECENT_OBSERVED; q++) {
        int f = nearest_Station_RECENT_OBSERVED_id[q];

        if (f != -1) {
          String FN = nf(THE_YEAR, 4) + "-" + nf(THE_MONTH, 2) + "-" + nf(THE_DAY, 2) + "-" + nf(THE_HOUR, 2) + "00-" + STATION_SWOB_INFO[f][6] + "-" + STATION_SWOB_INFO[f][11] + "-swob.xml";

          int File_Found = -1;

          //println(FN);
          for (int i = RECENT_OBSERVED_XML_Files.length - 1; i >= 0; i--) { // reverse search is faster
            //println(RECENT_OBSERVED_XML_Files[i]);

            if (RECENT_OBSERVED_XML_Files[i].equals(FN)) {
              File_Found = i;
              println("Found:", File_Found);

              break; // <<<<<<<<<<
            }
          }

          if ((File_Found == -1) && (Download_RECENT_OBSERVED != 0)) {
            String the_link = "http://dd.weatheroffice.gc.ca/observations/swob-ml/" + nf(THE_YEAR, 4) + nf(THE_MONTH, 2) + nf(THE_DAY, 2) + "/" + STATION_SWOB_INFO[f][6] + "/" + FN;
            String the_target = RECENT_OBSERVED_directory + "/" + FN;

            println("Try downloading: " + the_link);

            try {
              saveBytes(the_target, loadBytes(the_link));

              String[] new_file = {
                FN
              };
              RECENT_OBSERVED_XML_Files = concat(RECENT_OBSERVED_XML_Files, new_file);

              File_Found = RECENT_OBSERVED_XML_Files.length - 1;
              println("Added:", File_Found);
            }
            catch (Exception e) {
            }
          }

          if (File_Found != -1) LoadRECENT_OBSERVED((RECENT_OBSERVED_directory + "/" + FN), timeID, q);
          else println("FILE NOT FOUND:", FN);

        }
      }
    }
  }
}

String [] DOWNLOAD_DATA_GRID (int progressID) {
  String[] progressList = new String[0];

  int itemNumber = -1;

  // downloads required GRIB files and then load the values into memory.

  DATA_ModelTime = DATA_ModelEnd + DATA_ModelStep;

  for (int timeID = DATA_numTimes - 1; timeID >= 0; timeID -= 1) {
    DATA_ModelTime -= DATA_ModelStep;

    for (int levelID = 0; levelID < DATA_numLevels; levelID += 1) {
      for (int layerID = 0; layerID < DATA_numLayers; layerID += 1) {
        if (DATA_allLayers[layerID] > NumberOfRawDataLayers) { // that means it should be post-processed later

        }
        else {
          DATA_Filename = getGrib2Filename(DATA_ModelTime, DATA_allLayers[layerID], DATA_allLevels[levelID]);

          if (progressID == -1) {
            String[] newItem = {DATA_Filename};
            progressList = (String[]) concat(progressList, newItem);
          }
          else {
            itemNumber++;
            if (itemNumber == progressID) {
              if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("SHOP")) {
                String[] fileStrings = loadStrings(getGrib2Link());
                for (int memberID = 0; memberID < DATA_numMembers; memberID += 1) {
                  for (int i = 0; i < fileStrings.length; i++) {
                    allDataValues[timeID][layerID][levelID][memberID][i] = float(fileStrings[i]);
                  }

                  allDataTitles[timeID][layerID][levelID][memberID] = DATA_Filename;
                }
                println("SHOP model loaded");
              }
              else {
                if ((DATA_ModelTime == 0) && (isAccumulativeLayer(layerID) == true)) {
                  for (int memberID = 0; memberID < DATA_numMembers; memberID += 1) {
                    for (int q = 0; q < gridNx * gridNy; q++) {
                      allDataValues[timeID][layerID][levelID][memberID][q] = 0;
                    }
                    allDataTitles[timeID][layerID][levelID][memberID] = FileStamp(timeID, layerID, levelID, memberID); // <<<< should add title here!
                  }
                }
                else {
                  GRIB2CLASS myGrid = new GRIB2CLASS();

                  byte fileBytes[] = loadBytes(getGrib2Link());

                  myGrid.fileBytes = fileBytes;

                  myGrid.readGrib2Members(DATA_numMembers);

                  gridTypeOfProjection = myGrid.TypeOfProjection;

                  gridLa1 = myGrid.La1;
                  gridLo1 = myGrid.Lo1;
                  gridLa2 = myGrid.La2;
                  gridLo2 = myGrid.Lo2;

                  gridLaD = myGrid.LaD;
                  gridLoV = myGrid.LoV;
                  gridDx = myGrid.Dx;
                  gridDy = myGrid.Dy;

                  gridFirstLatIn = myGrid.FirstLatIn;
                  gridSecondLatIn = myGrid.SecondLatIn;
                  gridSouthLat = myGrid.SouthLat;
                  gridSouthLon = myGrid.SouthLon;
                  gridRotation = myGrid.Rotation;

                  gridPCF = myGrid.PCF;

                  gridScanX = myGrid.ScanX;
                  gridScanY = myGrid.ScanY;

                  gridNx = myGrid.Nx;
                  gridNy = myGrid.Ny;

                  if (Allocated_allDataValues == false) {
                    println("*****************************************");
                    println("*** Allocating memory to main data... ***");
                    allDataValues = new float [DATA_numTimes][DATA_numLayers][DATA_numLevels][DATA_numMembers][gridNx * gridNy];
                    Allocated_allDataValues = true;
                    println("*** Memory is allocated to main data. ***");
                    println("*****************************************");
                  }

                  for (int memberID = 0; memberID < DATA_numMembers; memberID += 1) {
                    gridYear                 [timeID][layerID][levelID][memberID] = myGrid.Year;
                    gridMonth                [timeID][layerID][levelID][memberID] = myGrid.Month;
                    gridDay                  [timeID][layerID][levelID][memberID] = myGrid.Day;
                    gridMinute               [timeID][layerID][levelID][memberID] = myGrid.Minute;
                    gridSecond               [timeID][layerID][levelID][memberID] = myGrid.Second;
                    gridForecastConvertedTime[timeID][layerID][levelID][memberID] = myGrid.ForecastConvertedTime;

                    for (int q = 0; q < gridNx * gridNy; q++) {
                      allDataValues[timeID][layerID][levelID][memberID][q] = myGrid.DataValues[memberID][q];
                    }

                    allDataTitles[timeID][layerID][levelID][memberID] = myGrid.DataTitles[memberID];
                  }

                  allParameterNamesAndUnits[layerID][levelID] = myGrid.ParameterNameAndUnit;
                }

                if ((DATA_allLayers[layerID] == LAYER_drybulb) ||
                    (DATA_allLayers[layerID] == LAYER_dewpoint) ||
                    (DATA_allLayers[layerID] == LAYER_watertemperature) ||
                    (DATA_allLayers[layerID] == LAYER_soiltemperature)) {
                  for (int memberID = 0; memberID < DATA_numMembers; memberID += 1) {
                    for (int q = 0; q < gridNx * gridNy; q++) {
                      allDataValues[timeID][layerID][levelID][memberID][q] -= 273.15; // °K > °C
                    }
                  }
                  allParameterNamesAndUnits[layerID][levelID] = allParameterNamesAndUnits[layerID][levelID].replace("(K)", "(C)");
                }

                if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY02].equals("CMC")) {
                  if ((DATA_allLayers[layerID] == LAYER_solardownshort) ||
                      (DATA_allLayers[layerID] == LAYER_solardownlong) ||
                      (DATA_allLayers[layerID] == LAYER_solarcomingshort) ||
                      (DATA_allLayers[layerID] == LAYER_solarabsrbdshort) ||
                      (DATA_allLayers[layerID] == LAYER_solarabsrbdlong)) {
                    for (int memberID = 0; memberID < DATA_numMembers; memberID += 1) {
                      for (int q = 0; q < gridNx * gridNy; q++) {
                        if (is_undefined_FLOAT(allDataValues[timeID][layerID][levelID][memberID][q]) == false) {
                          allDataValues[timeID][layerID][levelID][memberID][q] *= 0.001 / 3.6; // J > W
                        }
                      }
                    }
                    // no need to change the unit text here!
                  }
                }

                if ((DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("GEPS")) ||
                    (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01].equals("REPS"))) {
                  if (DATA_allLayers[layerID] == LAYER_height) {
                    for (int memberID = 0; memberID < DATA_numMembers; memberID += 1) {
                      for (int q = 0; q < gridNx * gridNy; q++) {
                        if (is_undefined_FLOAT(allDataValues[timeID][layerID][levelID][memberID][q]) == false) {
                          allDataValues[timeID][layerID][levelID][memberID][q] *= 9.80665; // gpm > m
                        }
                      }
                    }
                  }
                  allParameterNamesAndUnits[layerID][levelID] = allParameterNamesAndUnits[layerID][levelID].replace("(gpm)", "(m)");
                }
              }
            }
          }
        }
      }
    }
  }

  return progressList;
}

void POST_PROCESS_RATES_FROM_ACCUMULATIONS () {
  for (int timeID = DATA_numTimes - 1; timeID >= 0; timeID -= 1) {
    for (int levelID = 0; levelID < DATA_numLevels; levelID += 1) {
      for (int layerID = 0; layerID < DATA_numLayers; layerID += 1) {
        for (int memberID = 0; memberID < DATA_numMembers; memberID += 1) {
          if (isAccumulativeLayer(layerID) == true) {
            if ((DATA_allLayers[layerID] == LAYER_precipitation) ||
                (DATA_allLayers[layerID] == LAYER_rain) ||
                (DATA_allLayers[layerID] == LAYER_freezingrain) ||
                (DATA_allLayers[layerID] == LAYER_icepellets) ||
                (DATA_allLayers[layerID] == LAYER_snow) ||
                (DATA_allLayers[layerID] == LAYER_solardownshort) ||
                (DATA_allLayers[layerID] == LAYER_solardownlong) ||
                (DATA_allLayers[layerID] == LAYER_solarcomingshort) ||
                (DATA_allLayers[layerID] == LAYER_solarabsrbdshort) ||
                (DATA_allLayers[layerID] == LAYER_solarabsrbdlong)) {
              if (timeID > 0) {
                for (int q = 0; q < gridNx * gridNy; q++) {
                  if (is_undefined_FLOAT(allDataValues[timeID][layerID][levelID][memberID][q]) == false) {
                    if (is_undefined_FLOAT(allDataValues[timeID - 1][layerID][levelID][memberID][q]) == false) {
                      allDataValues[timeID][layerID][levelID][memberID][q] -= allDataValues[timeID - 1][layerID][levelID][memberID][q]; // converting from total accumolation to interval acculolation
                    }
                  }
                }

                for (int q = 0; q < gridNx * gridNy; q++) {
                  if (is_undefined_FLOAT(allDataValues[timeID][layerID][levelID][memberID][q]) == false) {
                    allDataValues[timeID][layerID][levelID][memberID][q] /= float(DATA_ModelStep); // converting to hourly rate
                  }
                }

                //allDataTitles[timeID][layerID][levelID][memberID] += " - " + allDataTitles[timeID - 1][layerID][levelID][memberID] ;
                //allDataTitles[timeID][layerID][levelID][memberID] += " devided by " + nf(DATA_ModelStep, 0);
              }
              else {
                for (int q = 0; q < gridNx * gridNy; q++) {
                  allDataValues[timeID][layerID][levelID][memberID][q] = 0;
                }
              }
            }
          }
        }
      }
    }
  }
}

void FILL_INFO_FOR_POST_PROCESSED_LAYERS () {
  for (int timeID = 0; timeID < DATA_numTimes; timeID += 1) {
    for (int layerID = 0; layerID < DATA_numLayers; layerID += 1) {
      for (int levelID = 0; levelID < DATA_numLevels; levelID += 1) {
        for (int memberID = 0; memberID < DATA_numMembers; memberID += 1) {
          if (gridYear[timeID][layerID][levelID][memberID] == 0) {
            gridYear                 [timeID][layerID][levelID][memberID] = gridYear                 [timeID][0][levelID][memberID];
            gridMonth                [timeID][layerID][levelID][memberID] = gridMonth                [timeID][0][levelID][memberID];
            gridDay                  [timeID][layerID][levelID][memberID] = gridDay                  [timeID][0][levelID][memberID];
            gridHour                 [timeID][layerID][levelID][memberID] = gridHour                 [timeID][0][levelID][memberID];
            gridMinute               [timeID][layerID][levelID][memberID] = gridMinute               [timeID][0][levelID][memberID];
            gridSecond               [timeID][layerID][levelID][memberID] = gridSecond               [timeID][0][levelID][memberID];
            gridForecastConvertedTime[timeID][layerID][levelID][memberID] = gridForecastConvertedTime[timeID][0][levelID][memberID];
          }
        }
      }
    }
  }
}

String[] POST_PROCESS_WIND_AND_SOLAR (int progressID) {
  String[] progressList = new String[0];

  int itemNumber = -1;

  int AirTemperature_layerID = -1;
  int MeanPressure_layerID = -1;
  int SurfacePressure_layerID = -1;
  int Precipitation_layerID = -1;
  int SurfaceAlbedo_layerID = -1;
  int CloudCover_layerID = -1;
  int GlobalHorizontal_layerID = -1;
  int DiffuseHorizontal_layerID = -1;
  int DirectNormal_layerID = -1;
  int DiffuseEffect_layerID = -1;
  int DirectEffect_layerID = -1;
  int SolarTracker_layerID = -1;
  int SolarFixLatitude_layerID = -1;
  int SolarSouth45_layerID = -1;
  int SolarSouth00_layerID = -1;
  int SolarNorth00_layerID = -1;
  int SolarEast00_layerID = -1;
  int SolarWest00_layerID = -1;
  int WindU_layerID = -1;
  int WindV_layerID = -1;
  int WindSpeed_layerID = -1;
  int WindPower_layerID = -1;
  int FlowXOnly_layerID = -1;
  int FlowXMeanPressure_layerID = -1;
  int FlowXPrecipitation_layerID = -1;
  int FlowXDirectEffect_layerID = -1;

  boolean run_solar = false;
  boolean run_wind = false;

  for (int id = 0; id < DATA_numLayers; id++) {
    if (DATA_allLayers[id] == LAYER_drybulb) { AirTemperature_layerID = id; }
    if (DATA_allLayers[id] == LAYER_meanpressure) { MeanPressure_layerID = id; }
    if (DATA_allLayers[id] == LAYER_surfpressure) { SurfacePressure_layerID = id; }
    if (DATA_allLayers[id] == LAYER_precipitation) { Precipitation_layerID = id; }
    if (DATA_allLayers[id] == LAYER_albedo) { SurfaceAlbedo_layerID = id; }
    if (DATA_allLayers[id] == LAYER_cloudcover) { CloudCover_layerID = id; }
    if (DATA_allLayers[id] == LAYER_glohorrad) { GlobalHorizontal_layerID = id; run_solar = true; }
    if (DATA_allLayers[id] == LAYER_difhorrad) { DiffuseHorizontal_layerID = id; run_solar = true; }
    if (DATA_allLayers[id] == LAYER_dirnorrad) { DirectNormal_layerID = id; run_solar = true; }
    if (DATA_allLayers[id] == LAYER_difhoreff) { DiffuseEffect_layerID = id; run_solar = true; }
    if (DATA_allLayers[id] == LAYER_dirnoreff) { DirectEffect_layerID = id; run_solar = true; }

    if (DATA_allLayers[id] == LAYER_tracker) { SolarTracker_layerID = id; run_solar = true; }
    if (DATA_allLayers[id] == LAYER_fixlat) { SolarFixLatitude_layerID = id; run_solar = true; }
    if (DATA_allLayers[id] == LAYER_south45) { SolarSouth45_layerID = id; run_solar = true; }
    if (DATA_allLayers[id] == LAYER_south00) { SolarSouth00_layerID = id; run_solar = true; }
    if (DATA_allLayers[id] == LAYER_north00) { SolarNorth00_layerID = id; run_solar = true; }
    if (DATA_allLayers[id] == LAYER_east00) { SolarEast00_layerID = id; run_solar = true; }
    if (DATA_allLayers[id] == LAYER_west00) { SolarWest00_layerID = id; run_solar = true; }

    if (DATA_allLayers[id] == LAYER_windU) { WindU_layerID = id; run_wind = true; }
    if (DATA_allLayers[id] == LAYER_windV) { WindV_layerID = id; run_wind = true; }
    if (DATA_allLayers[id] == LAYER_windspd) { WindSpeed_layerID = id; run_wind = true; }
    if (DATA_allLayers[id] == LAYER_windpower) { WindPower_layerID = id; run_wind = true; }
    if (DATA_allLayers[id] == LAYER_flowXonly) { FlowXOnly_layerID = id; run_wind = true; }
    if (DATA_allLayers[id] == LAYER_flowXmeanpressure) { FlowXMeanPressure_layerID = id; run_wind = true; }
    if (DATA_allLayers[id] == LAYER_flowXprecipitation) { FlowXPrecipitation_layerID = id; run_wind = true; }
    if (DATA_allLayers[id] == LAYER_flowXdirecteffect) { FlowXDirectEffect_layerID = id; run_wind = true; }
  }

  if (run_wind == true) {
    if ((WindU_layerID != -1) && (WindV_layerID != -1)) {
      for (int timeID = 0; timeID < DATA_numTimes; timeID += 1) {
        for (int levelID = 0; levelID < DATA_numLevels; levelID += 1) {
          for (int memberID = 0; memberID < DATA_numMembers; memberID += 1) {
            if (progressID == -1) {
              String[] newItem = {"Post-processing wind data..."};
              progressList = (String[]) concat(progressList, newItem);
            }
            else {
              itemNumber++;
              if (itemNumber == progressID) {
                //println("post-processing wind energy data for progressID:", progressID);

                for (int q = 0; q < gridNx * gridNy; q++) {
                  int ix = q % gridNx;
                  int iy = q / gridNx;

                  float WIND_U = allDataValues[timeID][WindU_layerID][levelID][memberID][iy * gridNx + ix];
                  float WIND_V = allDataValues[timeID][WindV_layerID][levelID][memberID][iy * gridNx + ix];

                  float WIND_SPEED = pow(WIND_U * WIND_U + WIND_V * WIND_V, 0.5);

                  if (WindPower_layerID != -1) {
                    allDataValues[timeID][WindPower_layerID][levelID][memberID][q] = 0.5 * 1.23 * 1 * pow(WIND_SPEED, 3);
                    if (q == 0) {
                      allDataTitles[timeID][WindPower_layerID][levelID][memberID] = FileStamp(timeID, WindPower_layerID, levelID, memberID); // <<<< should add title here!
                      allParameterNamesAndUnits[WindPower_layerID][levelID] = "Wind Power (W m-2)";
                    }
                  }

                  if (FlowXOnly_layerID != -1) {
                    allDataValues[timeID][FlowXOnly_layerID][levelID][memberID][q] = FLOAT_undefined;
                    if (q == 0) {
                      allDataTitles[timeID][FlowXOnly_layerID][levelID][memberID] = allDataTitles[timeID][WindU_layerID][levelID][memberID].replace("UGRD", "UVGRD");
                      allParameterNamesAndUnits[FlowXOnly_layerID][levelID] = "Wind Direction and Speed";
                    }
                  }

                  if (FlowXMeanPressure_layerID != -1) {
                    allDataValues[timeID][FlowXMeanPressure_layerID][levelID][memberID][q] = allDataValues[timeID][MeanPressure_layerID][levelID][memberID][q];
                    if (q == 0) {
                      allDataTitles[timeID][FlowXMeanPressure_layerID][levelID][memberID] = allDataTitles[timeID][MeanPressure_layerID][levelID][memberID];
                      allParameterNamesAndUnits[FlowXMeanPressure_layerID][levelID] = allParameterNamesAndUnits[MeanPressure_layerID][levelID];
                    }
                  }

                  if (FlowXPrecipitation_layerID != -1) {
                    allDataValues[timeID][FlowXPrecipitation_layerID][levelID][memberID][q] = allDataValues[timeID][Precipitation_layerID][levelID][memberID][q];
                    if (q == 0) {
                      allDataTitles[timeID][FlowXPrecipitation_layerID][levelID][memberID] = allDataTitles[timeID][Precipitation_layerID][levelID][memberID];
                      allParameterNamesAndUnits[FlowXPrecipitation_layerID][levelID] = allParameterNamesAndUnits[Precipitation_layerID][levelID];
                    }
                  }

                  if (FlowXDirectEffect_layerID != -1) {
                    allDataValues[timeID][FlowXDirectEffect_layerID][levelID][memberID][q] = allDataValues[timeID][DirectEffect_layerID][levelID][memberID][q];
                    if (q == 0) {
                      allDataTitles[timeID][FlowXDirectEffect_layerID][levelID][memberID] = allDataTitles[timeID][DirectEffect_layerID][levelID][memberID];
                      allParameterNamesAndUnits[FlowXDirectEffect_layerID][levelID] = allParameterNamesAndUnits[DirectEffect_layerID][levelID];
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  if (run_solar == true) {
    if (CloudCover_layerID != -1) {
      for (int timeID = 0; timeID < DATA_numTimes; timeID += 1) {
        for (int levelID = 0; levelID < DATA_numLevels; levelID += 1) {
          for (int memberID = 0; memberID < DATA_numMembers; memberID += 1) {
            if (progressID == -1) {
              String[] newItem = {"Post-processing solar data..."};
              progressList = (String[]) concat(progressList, newItem);
            }
            else {
              itemNumber++;
              if (itemNumber == progressID) {
                //println("post-processing solar energy data for progressID:", progressID);

                int NOW_MONTH = DATA_ModelMonth;
                int NOW_DAY = DATA_ModelDay;

                //int ElapsedTime = timeID * DATA_ModelStep + DATA_ModelBegin + DATA_ModelRun;
                float ElapsedTime = (timeID + 0.5) * DATA_ModelStep + DATA_ModelBegin + DATA_ModelRun;

                if (int(roundTo((ElapsedTime / 24), 1)) > 0) {
                  NOW_DAY += ElapsedTime / 24;

                  if (NOW_DAY > CalendarLength[NOW_MONTH - 1]) {
                    NOW_DAY -= CalendarLength[NOW_MONTH - 1];
                    NOW_MONTH += 1;
                    if (NOW_MONTH == 12) NOW_MONTH = 0;
                  }
                }
                // above we assumed long-term forecast is not available more than two months.

                float DATE_ANGLE = (360 * ((286 + Convert2Date(NOW_MONTH, NOW_DAY)) % 365) / 365.0);

                for (int q = 0; q < gridNx * gridNy; q++) {
                  int ix = q % gridNx;
                  int iy = q / gridNx;

                  float[] P = getLonLat(ix, iy);

                  float lon = P[0];
                  float lat = P[1];

                  float HOUR_ANGLE = ElapsedTime + (((lon + 360) % 360) / 15);

                  float CLOUD_COVER = allDataValues[timeID][CloudCover_layerID][levelID][memberID][iy * gridNx + ix];

                  if (is_undefined_FLOAT(CLOUD_COVER) == true) {
                    if (DirectEffect_layerID != -1) {
                      allDataValues[timeID][DirectEffect_layerID][levelID][memberID][q] = FLOAT_undefined;
                    }
                    if (DiffuseEffect_layerID != -1) {
                      allDataValues[timeID][DiffuseEffect_layerID][levelID][memberID][q] = FLOAT_undefined;
                    }
                    if (DirectNormal_layerID != -1) {
                      allDataValues[timeID][DirectNormal_layerID][levelID][memberID][q] = FLOAT_undefined;
                    }
                    if (DiffuseHorizontal_layerID != -1) {
                      allDataValues[timeID][DiffuseHorizontal_layerID][levelID][memberID][q] = FLOAT_undefined;
                    }
                    if (GlobalHorizontal_layerID != -1) {
                      allDataValues[timeID][GlobalHorizontal_layerID][levelID][memberID][q] = FLOAT_undefined;
                    }
                    if (SolarTracker_layerID != -1) {
                      allDataValues[timeID][SolarTracker_layerID][levelID][memberID][q] = FLOAT_undefined;
                    }
                    if (SolarFixLatitude_layerID != -1) {
                      allDataValues[timeID][SolarFixLatitude_layerID][levelID][memberID][q] = FLOAT_undefined;
                    }
                    if (SolarSouth45_layerID != -1) {
                      allDataValues[timeID][SolarSouth45_layerID][levelID][memberID][q] = FLOAT_undefined;
                    }
                    if (SolarSouth00_layerID != -1) {
                      allDataValues[timeID][SolarSouth00_layerID][levelID][memberID][q] = FLOAT_undefined;
                    }
                    if (SolarNorth00_layerID != -1) {
                      allDataValues[timeID][SolarNorth00_layerID][levelID][memberID][q] = FLOAT_undefined;
                    }
                    if (SolarEast00_layerID != -1) {
                      allDataValues[timeID][SolarEast00_layerID][levelID][memberID][q] = FLOAT_undefined;
                    }
                    if (SolarWest00_layerID != -1) {
                      allDataValues[timeID][SolarWest00_layerID][levelID][memberID][q] = FLOAT_undefined;
                    }
                  }
                  else {
                    float SURFACE_ALBEDO = 0;
                    if (SurfaceAlbedo_layerID != -1) SURFACE_ALBEDO = 0.01 * allDataValues[timeID][SurfaceAlbedo_layerID][levelID][memberID][iy * gridNx + ix];

                    float SURFACE_PRESSURE = 101325;
                    if (SurfacePressure_layerID != -1) SURFACE_PRESSURE = allDataValues[timeID][SurfacePressure_layerID][levelID][memberID][iy * gridNx + ix];

                    float AIR_TEMPERATURE = 18;
                    if (AirTemperature_layerID != -1) AIR_TEMPERATURE = allDataValues[timeID][AirTemperature_layerID][levelID][memberID][iy * gridNx + ix];

                    float[] SunR = SOLARCHVISION_SunPositionRadiation(DATE_ANGLE, HOUR_ANGLE, lat, SURFACE_PRESSURE, CLOUD_COVER);

                    if (DirectEffect_layerID != -1) {
                      allDataValues[timeID][DirectEffect_layerID][levelID][memberID][q] = SunR[4] * (18 - AIR_TEMPERATURE);
                      if (q == 0) {
                        allDataTitles[timeID][DirectEffect_layerID][levelID][memberID] = FileStamp(timeID, DirectEffect_layerID, levelID, memberID); // <<<< should add title here!
                        allParameterNamesAndUnits[DirectEffect_layerID][levelID] = "Direct Normal Effect (C W m-2)";
                      }
                    }

                    if (DiffuseEffect_layerID != -1) {
                      allDataValues[timeID][DiffuseEffect_layerID][levelID][memberID][q] = SunR[5] * (18 - AIR_TEMPERATURE);
                      if (q == 0) {
                        allDataTitles[timeID][DiffuseEffect_layerID][levelID][memberID] = FileStamp(timeID, DiffuseEffect_layerID, levelID, memberID); // <<<< should add title here!
                        allParameterNamesAndUnits[DiffuseEffect_layerID][levelID] = "Diffuse Horizontal Effect (C W m-2)";
                      }
                    }

                    if (DirectNormal_layerID != -1) {
                      allDataValues[timeID][DirectNormal_layerID][levelID][memberID][q] = SunR[4];
                      if (q == 0) {
                        allDataTitles[timeID][DirectNormal_layerID][levelID][memberID] = FileStamp(timeID, DirectNormal_layerID, levelID, memberID); // <<<< should add title here!
                        allParameterNamesAndUnits[DirectNormal_layerID][levelID] = "Direct Normal Radiation (W m-2)";
                      }
                    }
                    if (DiffuseHorizontal_layerID != -1) {
                      allDataValues[timeID][DiffuseHorizontal_layerID][levelID][memberID][q] = SunR[5];
                      if (q == 0) {
                        allDataTitles[timeID][DiffuseHorizontal_layerID][levelID][memberID] = FileStamp(timeID, DiffuseHorizontal_layerID, levelID, memberID); // <<<< should add title here!
                        allParameterNamesAndUnits[DiffuseHorizontal_layerID][levelID] = "Diffuse Horizontal Radiation (W m-2)";
                      }
                    }
                    if (GlobalHorizontal_layerID != -1) {
                      allDataValues[timeID][GlobalHorizontal_layerID][levelID][memberID][q] = SunR[5] + SunR[4] * SunR[3];
                      if (q == 0) {
                        allDataTitles[timeID][GlobalHorizontal_layerID][levelID][memberID] = FileStamp(timeID, GlobalHorizontal_layerID, levelID, memberID); // <<<< should add title here!
                        allParameterNamesAndUnits[GlobalHorizontal_layerID][levelID] = "Global Horizontal Radiation (W m-2)";
                      }
                    }

                    float Alpha = asin_ang(SunR[3]);
                    float Beta = atan2_ang(SunR[2], SunR[1]) + 90;

                    if (SolarTracker_layerID != -1) {
                      allDataValues[timeID][SolarTracker_layerID][levelID][memberID][q] = SolarAtSurface(SunR[1], SunR[2], SunR[3], SunR[4], SunR[5], Alpha, Beta, SURFACE_ALBEDO);
                      if (q == 0) {
                        allDataTitles[timeID][SolarTracker_layerID][levelID][memberID] = FileStamp(timeID, SolarTracker_layerID, levelID, memberID); // <<<< should add title here!
                        allParameterNamesAndUnits[SolarTracker_layerID][levelID] = "Solar Tracker Radiation (W m-2)";
                      }
                    }

                    if (SolarFixLatitude_layerID != -1) {
                      float angle1 = 90 - lat;
                      float angle2 = 0;

                      if (lat < 0) {
                        angle1 = 90 + lat;
                        angle2 = 180;
                      }

                      allDataValues[timeID][SolarFixLatitude_layerID][levelID][memberID][q] = SolarAtSurface(SunR[1], SunR[2], SunR[3], SunR[4], SunR[5], angle1, angle2, SURFACE_ALBEDO);
                      if (q == 0) {
                        allDataTitles[timeID][SolarFixLatitude_layerID][levelID][memberID] = FileStamp(timeID, SolarFixLatitude_layerID, levelID, memberID); // <<<< should add title here!
                        allParameterNamesAndUnits[SolarFixLatitude_layerID][levelID] = "Solar Fix Latitude Radiation (W m-2)";
                      }
                    }

                    if (SolarSouth45_layerID != -1) {
                      allDataValues[timeID][SolarSouth45_layerID][levelID][memberID][q] = SolarAtSurface(SunR[1], SunR[2], SunR[3], SunR[4], SunR[5], 90 - 45, 0, SURFACE_ALBEDO);
                      if (q == 0) {
                        allDataTitles[timeID][SolarSouth45_layerID][levelID][memberID] = FileStamp(timeID, SolarSouth45_layerID, levelID, memberID); // <<<< should add title here!
                        allParameterNamesAndUnits[SolarSouth45_layerID][levelID] = "Solar South45 Radiation (W m-2)";
                      }
                    }

                    if (SolarSouth00_layerID != -1) {
                      allDataValues[timeID][SolarSouth00_layerID][levelID][memberID][q] = SolarAtSurface(SunR[1], SunR[2], SunR[3], SunR[4], SunR[5], 0, 0, SURFACE_ALBEDO);
                      if (q == 0) {
                        allDataTitles[timeID][SolarSouth00_layerID][levelID][memberID] = FileStamp(timeID, SolarSouth00_layerID, levelID, memberID); // <<<< should add title here!
                        allParameterNamesAndUnits[SolarSouth00_layerID][levelID] = "Solar South00 Radiation (W m-2)";
                      }
                    }

                    if (SolarNorth00_layerID != -1) {
                      allDataValues[timeID][SolarNorth00_layerID][levelID][memberID][q] = SolarAtSurface(SunR[1], SunR[2], SunR[3], SunR[4], SunR[5], 0, 180, SURFACE_ALBEDO);
                      if (q == 0) {
                        allDataTitles[timeID][SolarNorth00_layerID][levelID][memberID] = FileStamp(timeID, SolarNorth00_layerID, levelID, memberID); // <<<< should add title here!
                        allParameterNamesAndUnits[SolarNorth00_layerID][levelID] = "Solar North00 Radiation (W m-2)";
                      }
                    }

                    if (SolarEast00_layerID != -1) {
                      allDataValues[timeID][SolarEast00_layerID][levelID][memberID][q] = SolarAtSurface(SunR[1], SunR[2], SunR[3], SunR[4], SunR[5], 0, 90, SURFACE_ALBEDO);
                      if (q == 0) {
                        allDataTitles[timeID][SolarEast00_layerID][levelID][memberID] = FileStamp(timeID, SolarEast00_layerID, levelID, memberID); // <<<< should add title here!
                        allParameterNamesAndUnits[SolarEast00_layerID][levelID] = "Solar East00 Radiation (W m-2)";
                      }
                    }

                    if (SolarWest00_layerID != -1) {
                      allDataValues[timeID][SolarWest00_layerID][levelID][memberID][q] = SolarAtSurface(SunR[1], SunR[2], SunR[3], SunR[4], SunR[5], 0, 270, SURFACE_ALBEDO);
                      if (q == 0) {
                        allDataTitles[timeID][SolarWest00_layerID][levelID][memberID] = FileStamp(timeID, SolarWest00_layerID, levelID, memberID); // <<<< should add title here!
                        allParameterNamesAndUnits[SolarWest00_layerID][levelID] = "Solar West00 Radiation (W m-2)";
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return progressList;
}

int X_click1 = -1;
int Y_click1 = -1;
int X_click2 = -1;
int Y_click2 = -1;

int dragging_started = 0;

void mouseDragged () {
  if (automated == USER_INT) {
    if (dragging_started == 0) {
      int x = get_GRID_PastMouse_X();
      int y = get_GRID_PastMouse_Y();

      if (isInside (x, y, 0, 0, DATA_Viewport_Width, DATA_Viewport_Height) == 1) {
        X_click1 = x;
        Y_click1 = y;

        dragging_started = 1;
      }
    }

    if (isInside (mouseX, mouseY, 0, SOLARCHVISION_A_Pixel + SOLARCHVISION_B_Pixel + SOLARCHVISION_H_Pixel + SOLARCHVISION_C_Pixel, width, SOLARCHVISION_A_Pixel + SOLARCHVISION_B_Pixel + SOLARCHVISION_H_Pixel + SOLARCHVISION_C_Pixel + SOLARCHVISION_D_Pixel) == 1) {
      UI_BAR_d_Update = true;
    }
  }
}

void mouseReleased () {
  if (automated == USER_INT) {
    int x = get_GRID_Mouse_X();
    int y = get_GRID_Mouse_Y();

    if (isInside (x, y, 0, 0, DATA_Viewport_Width, DATA_Viewport_Height) == 1) {
      if (dragging_started != 0) {
        X_click2 = x;
        Y_click2 = y;

        DATA_Viewport_CenX += X_click2 - X_click1;
        DATA_Viewport_CenY += Y_click2 - Y_click1;

        dragging_started = 0;
      }

      DATA_Viewport_Update = true;
    }

    if (isInside (mouseX, mouseY, 0, SOLARCHVISION_A_Pixel + SOLARCHVISION_B_Pixel + SOLARCHVISION_H_Pixel + SOLARCHVISION_C_Pixel, width, SOLARCHVISION_A_Pixel + SOLARCHVISION_B_Pixel + SOLARCHVISION_H_Pixel + SOLARCHVISION_C_Pixel + SOLARCHVISION_D_Pixel) == 1) {
      UI_BAR_d_Update = true;
    }
  }
}

float Wheel_Value = 0;

int mouseWheelConsume = 0;

void mouseWheel (MouseEvent event) {
  if (automated == USER_INT) {
    mouseWheelConsume += 1;
    if (mouseWheelConsume % 2 == 0) {
      mouseWheelConsume = 0;

      Wheel_Value = event.getCount();

      if (isInside (get_GRID_Mouse_X(), get_GRID_Mouse_Y(), 0, 0, DATA_Viewport_Width, DATA_Viewport_Height) == 1) {
        float refZoom = 1;

        if (Wheel_Value > 0) refZoom = 1.1;
        if (Wheel_Value < 0) refZoom = 1 / 1.1;

        if (refZoom != 1) {
          float x0 = get_GRID_Mouse_X() - DATA_Viewport_Width / 2;
          float y0 = get_GRID_Mouse_Y() - DATA_Viewport_Height / 2;

          float dx = x0 - DATA_Viewport_CenX;
          float dy = y0 - DATA_Viewport_CenY;

          float x1 = DATA_Viewport_CenX + dx * refZoom;
          float y1 = DATA_Viewport_CenY + dy * refZoom;

          DATA_Viewport_CenX += x0 - x1;
          DATA_Viewport_CenY += y0 - y1;

          DATA_Viewport_Zoom *= refZoom;

          DATA_Viewport_Update = true;
          EARTH_Background_Update = true;

        }
      }

      if (isInside (mouseX, mouseY, 0, SOLARCHVISION_A_Pixel + SOLARCHVISION_B_Pixel + SOLARCHVISION_H_Pixel + SOLARCHVISION_C_Pixel, width, SOLARCHVISION_A_Pixel + SOLARCHVISION_B_Pixel + SOLARCHVISION_H_Pixel + SOLARCHVISION_C_Pixel + SOLARCHVISION_D_Pixel) == 1) {
        UI_BAR_d_Update = true;
      }
    }
  }
}

int get_GRID_Mouse_X () {
  return mouseX - DATA_Viewport_CornerX;
}

int get_GRID_Mouse_Y () {
  return mouseY - DATA_Viewport_CornerY;
}

int get_GRID_PastMouse_X () {
  return pmouseX - DATA_Viewport_CornerX;
}

int get_GRID_PastMouse_Y () {
  return pmouseY - DATA_Viewport_CornerY;
}

void keyPressed (KeyEvent e) {
  if (automated == USER_INT) {
    if (e.isAltDown() == true) {
      if (key == CODED) {
        switch(keyCode) {
        }
      } else {
        switch(key) {
        }
      }
    } else if (e.isControlDown() == true) {
      if (key == CODED) {
        switch(keyCode) {
        }
      } else {
        switch(key) {
        }
      }
    } else if (e.isShiftDown() == true) {
      if (key == CODED) {
        switch(keyCode) {
        }
      }
    }

    if ((e.isAltDown() != true) && (e.isControlDown() != true) && (e.isShiftDown() != true)) {
      if (key == CODED) {
        switch(keyCode) {
          case RIGHT: Current_timeID = (Current_timeID + 1) % DATA_numTimes; DATA_Viewport_Update = true; UI_BAR_d_Update = true; break;
          case LEFT: Current_timeID = (Current_timeID - 1 + DATA_numTimes) % DATA_numTimes; DATA_Viewport_Update = true; UI_BAR_d_Update = true; break;

          case UP: Current_layerID = (Current_layerID + 1) % DATA_numLayers; DATA_Viewport_Update = true; UI_BAR_d_Update = true; break;
          case DOWN: Current_layerID = (Current_layerID - 1 + DATA_numLayers) % DATA_numLayers; DATA_Viewport_Update = true; UI_BAR_d_Update = true; break;

          case 33: Current_levelID = (Current_levelID + 1) % DATA_numLevels; DATA_Viewport_Update = true; UI_BAR_d_Update = true; break;
          case 34: Current_levelID = (Current_levelID - 1 + DATA_numLevels) % DATA_numLevels; DATA_Viewport_Update = true; UI_BAR_d_Update = true; break;

          case 35: Current_memberID = (Current_memberID + 1) % DATA_numMembers; DATA_Viewport_Update = true; UI_BAR_d_Update = true; break;
          case 36: Current_memberID = (Current_memberID - 1 + DATA_numMembers) % DATA_numMembers; DATA_Viewport_Update = true; UI_BAR_d_Update = true; break;

        }
      } else {
        switch(key) {
          case '0':
            DATA_Viewport_CenX = 0;
            DATA_Viewport_CenY = 0;
            DATA_Viewport_Zoom = 1;

            DATA_Viewport_Update = true;
            EARTH_Background_Update = true;
            break;

          case ']': Current_statisticID = (Current_statisticID + 1) % DATA_allStatistics.length; DATA_Viewport_Update = true; UI_BAR_d_Update = true; break;
          case '[': Current_statisticID = (Current_statisticID - 1 + DATA_allStatistics.length) % DATA_allStatistics.length; DATA_Viewport_Update = true; UI_BAR_d_Update = true; break;

          case 'b':
            EARTH_BitmapChoice += 1;
            if (EARTH_BitmapChoice == EARTH_IMAGES.length) EARTH_BitmapChoice = 0;
            DATA_Viewport_Update = true;
            EARTH_Background_Update = true;
            break;

          case 'B':
            EARTH_BitmapChoice -= 1;
            if (EARTH_BitmapChoice == -1) EARTH_BitmapChoice = EARTH_IMAGES.length;
            DATA_Viewport_Update = true;
            EARTH_Background_Update = true;
            break;

          case ' ':

            SavedScreenShots += 1;

            recordFrame(Current_timeID, Current_layerID, Current_levelID, Current_memberID);
            break;

          case '+':
            //gridRotation += 5;
            gridSouthLon += 90;
            DATA_Viewport_Update = true;
            break;
          case '-':
            //gridRotation -= 5;
            gridSouthLon -= 90;
            DATA_Viewport_Update = true;
            break;

        }
      }
    }
  }
}

String getOutputFolder (int timeID, int layerID, int levelID, int memberID) {
  String s = OutputFolder;

  s += nf(DATA_ModelYear, 4) + nf(DATA_ModelMonth, 2) + nf(DATA_ModelDay, 2) + "_" + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY01] + nf(DATA_ModelRun, 2) + "Z";

  return s;
}

void recordFrame (int timeID, int layerID, int levelID, int memberID) {
  String s = getOutputFolder(Current_timeID, Current_layerID, Current_levelID, Current_memberID) + "/" + FileStamp(Current_timeID, Current_layerID, Current_levelID, Current_memberID);

       if (automated == AUTO_BMP) s += ".bmp";
  else if (automated == AUTO_JPG) s += ".jpg";
  else if (automated == AUTO_TIF) s += ".tif";
  else if (automated == AUTO_PNG) s += ".png";
  else s += ".jpg"; // default

  println(s);
  saveFrame(s);
}

String FileStamp (int timeID, int layerID, int levelID, int memberID) {
  String b = nf(DATA_ModelYear, 4) + nf(DATA_ModelMonth, 2) + nf(DATA_ModelDay, 2) + "_" + DATA_allDomains[Current_domainID][DOMAIN_PROPERTY00] + nf(DATA_ModelRun, 2) + "Z" + "_" + DATA_ParameterLevel[DATA_allLayers[layerID]][DATA_allLevels[levelID]];

  if (automated != AUTO_GIF) {
    b += "_Fhr" + nf(timeID * DATA_ModelStep + DATA_ModelBegin, 3);
  }

  if (int(DATA_allDomains[Current_domainID][DOMAIN_PROPERTY09]) > 1) {
    b += "_Mbr" + nf(Current_memberID, 2);
  }
  return b;
}

float[][] COUNTRIES_SEGMENTS;
String[][] COUNTRIES_INFO;
int COUNTRIES_NUMBER = 0;
int SEGMENTS_NUMBER = 0;

void LOAD_COUNTRIES () {
  int MAX_COUNTRIES_NUMBER = 1100;
  int MAX_SEGMENTS_NUMBER = 26000;
  COUNTRIES_INFO = new String[MAX_COUNTRIES_NUMBER][4];
  COUNTRIES_SEGMENTS = new float[MAX_SEGMENTS_NUMBER][2];

  COUNTRIES_NUMBER = 0;
  int n_Countries = -1;
  int n_Segments = -1;
  int pre_n_Segments = 0;

  String lineSTR;
  float pre_X = 0;
  float pre_Y = 0;
  int get_first_point = 0;

  String[] FileALL = loadStrings(COUNTRY_Coordinates);
  for (int f = 1; f < FileALL.length; f += 1){ // to skip the first description line
    lineSTR = FileALL[f];

    String[] parts = split(lineSTR, ',');

    if (lineSTR.equals("{")) {
      n_Countries += 1;

      get_first_point = 1;

    }

    if (1 < parts.length) {
      if (n_Segments < MAX_SEGMENTS_NUMBER) {
        n_Segments += 1;

        COUNTRIES_SEGMENTS[n_Segments][0] = float(parts[0]); // Longitude
        COUNTRIES_SEGMENTS[n_Segments][1] = float(parts[1]); // Latitude

        if (get_first_point == 1){
          pre_X = COUNTRIES_SEGMENTS[n_Segments][0];
          pre_Y = COUNTRIES_SEGMENTS[n_Segments][1];

          get_first_point = 0;
        }
      }
    }

    if (lineSTR.equals("}")) {
      if (n_Segments < MAX_SEGMENTS_NUMBER) {
        n_Segments += 1;

        COUNTRIES_SEGMENTS[n_Segments][0] = pre_X;
        COUNTRIES_SEGMENTS[n_Segments][1] = pre_Y;

        COUNTRIES_INFO[n_Countries][0] = String.valueOf(pre_n_Segments); // First // ??????????
        COUNTRIES_INFO[n_Countries][1] = String.valueOf(n_Segments); // Last // ??????????

        pre_n_Segments = n_Segments;

      }
    }
  }

  COUNTRIES_NUMBER = n_Countries;
  SEGMENTS_NUMBER = n_Segments;

  println("COUNTRIES_NUMBER =", COUNTRIES_NUMBER);
  println("SEGMENTS_NUMBER =", SEGMENTS_NUMBER);
}

void LOAD_EARTH_IMAGES () {
  int n = EARTH_IMAGES_Filenames.length;

  EARTH_IMAGES = new PImage [n];

  EARTH_IMAGES_BoundariesX = new float [n][2];
  EARTH_IMAGES_BoundariesY = new float [n][2];

  for (int i = 0; i < EARTH_IMAGES_Filenames.length; i++) {
    String MapFilename = EARTH_IMAGES_Path + "/" + EARTH_IMAGES_Filenames[i];

    String[] Parts = split(EARTH_IMAGES_Filenames[i], '_');

    EARTH_IMAGES_BoundariesX[i][0] = -float(Parts[1]) * 0.001;
    EARTH_IMAGES_BoundariesY[i][0] =  float(Parts[2]) * 0.001;
    EARTH_IMAGES_BoundariesX[i][1] = -float(Parts[3]) * 0.001;
    EARTH_IMAGES_BoundariesY[i][1] =  float(Parts[4]) * 0.001;

    println("Loading:", MapFilename);

    EARTH_IMAGES[i] = loadImage(MapFilename);

  }
}

PImage EARTH_Background_Image;

boolean EARTH_Background_Update = true;

void SOLARCHVISION_draw_EARTH () {
  if (EARTH_Background_Update == true) {
    EARTH_Background_Image = create_EARTH_Background();

    EARTH_Background_Update = false;
  }

  image(EARTH_Background_Image, 0, 0, DATA_Viewport_Width, DATA_Viewport_Height);

}

int BACKGROUND_TILE_PIXELS = 5; // in pixel

PImage create_EARTH_Background() {
  PGraphics graphic = createGraphics(int(DATA_Viewport_Width), int(DATA_Viewport_Height), P2D);

  graphic.beginDraw();

  int n = EARTH_BitmapChoice;

  float EARTH_IMAGES_OffsetX = EARTH_IMAGES_BoundariesX[n][0] + 180;
  float EARTH_IMAGES_OffsetY = EARTH_IMAGES_BoundariesY[n][1] - 90;

  float EARTH_IMAGES_ScaleX = (EARTH_IMAGES_BoundariesX[n][1] - EARTH_IMAGES_BoundariesX[n][0]) / 360.0;
  float EARTH_IMAGES_ScaleY = (EARTH_IMAGES_BoundariesY[n][1] - EARTH_IMAGES_BoundariesY[n][0]) / 180.0;

  float CEN_lon = 0.5 * (EARTH_IMAGES_BoundariesX[n][0] + EARTH_IMAGES_BoundariesX[n][1]);
  float CEN_lat = 0.5 * (EARTH_IMAGES_BoundariesY[n][0] + EARTH_IMAGES_BoundariesY[n][1]);

  int stp_i = BACKGROUND_TILE_PIXELS;
  int stp_j = stp_i;
  for (int i = 0; i < DATA_Viewport_Width; i += stp_i) {
    for (int j = 0; j < DATA_Viewport_Height; j += stp_j) {
      boolean draw_it = true;

      int[][] corners = {{i, j}, {i + stp_i, j}, {i + stp_i, j + stp_j}, {i, j + stp_j}};
      float[][] UV = {{0, 0}, {0, 0}, {0, 0}, {0, 0}};

      for (int k = 0; k < 4; k++)  {
        float x = (corners[k][0] - 0.5 * DATA_Viewport_Width - DATA_Viewport_CenX) / DATA_Viewport_Zoom + 0.5 * DATA_Viewport_Width;
        float y = (corners[k][1] - 0.5 * DATA_Viewport_Height - DATA_Viewport_CenY) / DATA_Viewport_Zoom + 0.5 * DATA_Viewport_Height;

        float ix = gridNx * x / (float) DATA_Viewport_Width;
        float iy = (gridNy - 1) - gridNy * y / (float) DATA_Viewport_Height;

        float[] P = getLonLat(ix, iy);
        float lon = P[0];
        float lat = P[1];

        float u = ((lon - CEN_lon) / EARTH_IMAGES_ScaleX / 360.0 + 0.5);
        float v = (-(lat - CEN_lat) / EARTH_IMAGES_ScaleY / 180.0 + 0.5);

        // for the moment I remarked this condition to make GDPS world background texture to be drawn completely.
        //if ((u > 1) || (u < 0) || (v > 1) || (v < 0)) draw_it = false;
/*
        if (u > 1) u %= 1;
        else if (u < 0) u = 1 - (-u % 1);

        if (v > 1) v %= 1;
        else if (v < 0) v = 1 - (-v % 1);
*/
        UV[k][0] = u;
        UV[k][1] = v;

      }

      if (draw_it == true) {
        graphic.beginShape();

        graphic.noStroke();

        graphic.texture(EARTH_IMAGES[n]);
        int w = EARTH_IMAGES[n].width;
        int h = EARTH_IMAGES[n].height;

        for (int k = 0; k < 4; k++)  {
          graphic.vertex(corners[k][0], corners[k][1], w * UV[k][0], h * UV[k][1]);
        }

        graphic.endShape(CLOSE);
      }
    }
  }

  graphic.endDraw();

  return graphic;
}

// ForecastHour
int STUDY_timeBegin = 0;
int STUDY_timeEnd = 0; //DATA_numTimes - 1;

// ForecastLayer
int STUDY_layerBegin = 0;
int STUDY_layerEnd = 0; //DATA_numLayers - 1;

// ForecastLevel
int STUDY_levelBegin = 0;
int STUDY_levelEnd = 0; //DATA_numLevels - 1;

// ForecastMember
int STUDY_memberBegin = 0;
int STUDY_memberEnd = DATA_numMembers - 1;

// ForecastStatistic
int STUDY_statisticBegin = 0;
{
  //if (DATA_numMembers > 1) STUDY_statisticBegin = STAT_N_M50;
}
int STUDY_statisticEnd = STUDY_statisticBegin; //DATA_allStatistics.length - 1;

float STUDY_X_control;
float STUDY_Y_control;

boolean UI_BAR_d_Update = true;

float UI_BAR_d_tab;

String[][] UI_BAR_d_Items = {
  {
    "ForecastLayer"
  }
  ,
  {
    "ForecastLevel"
  }
  ,
  {
    "ForecastMember"
  }
  ,
  {
    "ForecastHour"
  }

  ,
  {
    "ForecastStatistic"
  }
};

void SOLARCHVISION_draw_window_BAR_d () {
  ///// requires in case hot-keys pressed /////
  ////////////////////////////////////////////
  STUDY_timeBegin = Current_timeID;

  STUDY_layerBegin = Current_layerID;

  STUDY_levelBegin = Current_levelID;

  STUDY_memberBegin = Current_memberID;

  STUDY_statisticBegin = Current_statisticID;
  STUDY_statisticEnd = Current_statisticID;
  ////////////////////////////////////////////

  int SOLARCHVISION_X_clicked = mouseX;
  int SOLARCHVISION_Y_clicked = mouseY;

  if (UI_BAR_d_Update == true) {
    UI_BAR_d_Update = false;

    UI_BAR_d_tab = SOLARCHVISION_D_Pixel / float(UI_BAR_d_Items.length);

    fill(191);
    noStroke();
    rect(0, SOLARCHVISION_A_Pixel + SOLARCHVISION_B_Pixel + SOLARCHVISION_H_Pixel + SOLARCHVISION_C_Pixel, SOLARCHVISION_W_Pixel, SOLARCHVISION_D_Pixel);

    float displayBarHeight = MessageSize;
    float displayBarWidth = SOLARCHVISION_W_Pixel;

    STUDY_X_control = 0.5 * displayBarWidth;
    STUDY_Y_control = SOLARCHVISION_A_Pixel + SOLARCHVISION_B_Pixel + SOLARCHVISION_H_Pixel + SOLARCHVISION_C_Pixel + 0.5 * UI_BAR_d_tab;

    for (int i = 0; i < UI_BAR_d_Items.length; i++) {
      float x1 = STUDY_X_control - 0.5 * displayBarWidth;
      float x2 = STUDY_X_control + 0.5 * displayBarWidth;
      float y1 = STUDY_Y_control - 0.5 * displayBarHeight;
      float y2 = STUDY_Y_control + 0.5 * displayBarHeight;

      fill(127);
      noStroke();
      rect(x1, y1, x2 - x1, y2 - y1);

      textAlign(RIGHT, CENTER);
      stroke(0);
      fill(0);
      textSize(1.25 * MessageSize);

      text(UI_BAR_d_Items[i][0] + ": ", x1, STUDY_Y_control - 0.2 * MessageSize);

      if (UI_BAR_d_Items[i][0].equals("ForecastHour")) {
        if (isInside(SOLARCHVISION_X_clicked, SOLARCHVISION_Y_clicked, x1, y1, x2, y2) == 1) {
          if (mouseButton == LEFT) {
            STUDY_timeBegin = int(roundTo(DATA_numTimes * (SOLARCHVISION_X_clicked - x1) / (x2 - x1) - 0.5, 1));

            DATA_Viewport_Update = true;
          }

          if (mouseButton == RIGHT) {
            STUDY_timeEnd = int(roundTo(DATA_numTimes * (SOLARCHVISION_X_clicked - x1) / (x2 - x1) - 0.5, 1));

            DATA_Viewport_Update = true;
          }

          if (Wheel_Value > 0) {
            STUDY_timeBegin += 1;
            STUDY_timeEnd += 1;

            DATA_Viewport_Update = true;
            Wheel_Value = 0;
          }
          if (Wheel_Value < 0) {
            STUDY_timeBegin -= 1;
            STUDY_timeEnd -= 1;

            DATA_Viewport_Update = true;
            Wheel_Value = 0;
          }

          if (STUDY_timeBegin > DATA_numTimes - 1) STUDY_timeBegin -= DATA_numTimes;
          if (STUDY_timeBegin < 0) STUDY_timeBegin += DATA_numTimes;

          if (STUDY_timeEnd > DATA_numTimes - 1) STUDY_timeEnd -= DATA_numTimes;
          if (STUDY_timeEnd < 0) STUDY_timeEnd += DATA_numTimes;

          Current_timeID = STUDY_timeBegin;
        }

        float x_begin = x1 + (x2 - x1) * (STUDY_timeBegin) / float(DATA_numTimes);
        float x_end = x1 + (x2 - x1) * (STUDY_timeEnd + 1) / float(DATA_numTimes);

        fill(0, 191, 0, 191);
        noStroke();

        if (STUDY_timeBegin <= STUDY_timeEnd) {
          rect(x_begin, y1, x_end - x_begin, y2 - y1);
        }
        else {
          rect(x1, y1, x_end - x1, y2 - y1);
          rect(x_begin, y1, x2 - x_begin, y2 - y1);
        }

        textAlign(CENTER, CENTER);
        stroke(0);
        fill(0);
        textSize(1.25 * MessageSize);

        for (int j = 0; j < DATA_numTimes; j += 1) {
          String txt = nf(j * DATA_ModelStep + DATA_ModelBegin, 0) + ":00";
          text(txt, x1 + (x2 - x1) * (j + 0.5) / float(DATA_numTimes), STUDY_Y_control - 0.2 * MessageSize);
        }
      }

      if (UI_BAR_d_Items[i][0].equals("ForecastMember")) {
        if (isInside(SOLARCHVISION_X_clicked, SOLARCHVISION_Y_clicked, x1, y1, x2, y2) == 1) {
          if (mouseButton == LEFT) {
            STUDY_memberBegin = int(roundTo(DATA_numMembers * (SOLARCHVISION_X_clicked - x1) / (x2 - x1) - 0.5, 1));

            DATA_Viewport_Update = true;
          }

          if (mouseButton == RIGHT) {
            STUDY_memberEnd = int(roundTo(DATA_numMembers * (SOLARCHVISION_X_clicked - x1) / (x2 - x1) - 0.5, 1));

            DATA_Viewport_Update = true;
          }

          if (Wheel_Value > 0) {
            STUDY_memberBegin += 1;
            STUDY_memberEnd += 1;

            DATA_Viewport_Update = true;
            Wheel_Value = 0;
          }
          if (Wheel_Value < 0) {
            STUDY_memberBegin -= 1;
            STUDY_memberEnd -= 1;

            DATA_Viewport_Update = true;
            Wheel_Value = 0;
          }

          if (STUDY_memberBegin > DATA_numMembers - 1) STUDY_memberBegin -= DATA_numMembers;
          if (STUDY_memberBegin < 0) STUDY_memberBegin += DATA_numMembers;

          if (STUDY_memberEnd > DATA_numMembers - 1) STUDY_memberEnd -= DATA_numMembers;
          if (STUDY_memberEnd < 0) STUDY_memberEnd += DATA_numMembers;

          Current_memberID = STUDY_memberBegin;
        }

        float x_begin = x1 + (x2 - x1) * (STUDY_memberBegin) / float(DATA_numMembers);
        float x_end = x1 + (x2 - x1) * (STUDY_memberEnd + 1) / float(DATA_numMembers);

        fill(0, 191, 0, 191);
        noStroke();

        if (STUDY_memberBegin <= STUDY_memberEnd) {
          rect(x_begin, y1, x_end - x_begin, y2 - y1);
        }
        else {
          rect(x1, y1, x_end - x1, y2 - y1);
          rect(x_begin, y1, x2 - x_begin, y2 - y1);
        }

        textAlign(CENTER, CENTER);
        stroke(0);
        fill(0);
        textSize(1.25 * MessageSize);

        for (int j = 0; j < DATA_numMembers; j += 1) {
          String txt = nf(j, 0);
          text(txt, x1 + (x2 - x1) * (j + 0.5) / float(DATA_numMembers), STUDY_Y_control - 0.2 * MessageSize);
        }
      }

      if (UI_BAR_d_Items[i][0].equals("ForecastLevel")) {
        if (isInside(SOLARCHVISION_X_clicked, SOLARCHVISION_Y_clicked, x1, y1, x2, y2) == 1) {
          if (mouseButton == LEFT) {
            STUDY_levelBegin = int(roundTo(DATA_numLevels * (SOLARCHVISION_X_clicked - x1) / (x2 - x1) - 0.5, 1));

            DATA_Viewport_Update = true;
          }

          if (mouseButton == RIGHT) {
            STUDY_levelEnd = int(roundTo(DATA_numLevels * (SOLARCHVISION_X_clicked - x1) / (x2 - x1) - 0.5, 1));

            DATA_Viewport_Update = true;
          }

          if (Wheel_Value > 0) {
            STUDY_levelBegin += 1;
            STUDY_levelEnd += 1;

            DATA_Viewport_Update = true;
            Wheel_Value = 0;
          }
          if (Wheel_Value < 0) {
            STUDY_levelBegin -= 1;
            STUDY_levelEnd -= 1;

            DATA_Viewport_Update = true;
            Wheel_Value = 0;
          }

          if (STUDY_levelBegin > DATA_numLevels - 1) STUDY_levelBegin -= DATA_numLevels;
          if (STUDY_levelBegin < 0) STUDY_levelBegin += DATA_numLevels;

          if (STUDY_levelEnd > DATA_numLevels - 1) STUDY_levelEnd -= DATA_numLevels;
          if (STUDY_levelEnd < 0) STUDY_levelEnd += DATA_numLevels;

          Current_levelID = STUDY_levelBegin;

        }

        float x_begin = x1 + (x2 - x1) * (STUDY_levelBegin) / float(DATA_numLevels);
        float x_end = x1 + (x2 - x1) * (STUDY_levelEnd + 1) / float(DATA_numLevels);

        fill(0, 191, 0, 191);
        noStroke();

        if (STUDY_levelBegin <= STUDY_levelEnd) {
          rect(x_begin, y1, x_end - x_begin, y2 - y1);
        }
        else {
          rect(x1, y1, x_end - x1, y2 - y1);
          rect(x_begin, y1, x2 - x_begin, y2 - y1);
        }

        textAlign(CENTER, CENTER);
        stroke(0);
        fill(0);
        textSize(1.25 * MessageSize);

        for (int j = 0; j < DATA_numLevels; j += 1) {
          String txt = "Level " + nf(j, 0);
          text(txt, x1 + (x2 - x1) * (j + 0.5) / float(DATA_numLevels), STUDY_Y_control - 0.2 * MessageSize);
        }
      }

      if (UI_BAR_d_Items[i][0].equals("ForecastLayer")) {
        if (isInside(SOLARCHVISION_X_clicked, SOLARCHVISION_Y_clicked, x1, y1, x2, y2) == 1) {
          if (mouseButton == LEFT) {
            STUDY_layerBegin = int(roundTo(DATA_numLayers * (SOLARCHVISION_X_clicked - x1) / (x2 - x1) - 0.5, 1));

            DATA_Viewport_Update = true;
          }

          if (mouseButton == RIGHT) {
            STUDY_layerEnd = int(roundTo(DATA_numLayers * (SOLARCHVISION_X_clicked - x1) / (x2 - x1) - 0.5, 1));

            DATA_Viewport_Update = true;
          }

          if (Wheel_Value > 0) {
            STUDY_layerBegin += 1;
            STUDY_layerEnd += 1;

            DATA_Viewport_Update = true;
            Wheel_Value = 0;
          }
          if (Wheel_Value < 0) {
            STUDY_layerBegin -= 1;
            STUDY_layerEnd -= 1;

            DATA_Viewport_Update = true;
            Wheel_Value = 0;
          }

          if (STUDY_layerBegin > DATA_numLayers - 1) STUDY_layerBegin -= DATA_numLayers;
          if (STUDY_layerBegin < 0) STUDY_layerBegin += DATA_numLayers;

          if (STUDY_layerEnd > DATA_numLayers - 1) STUDY_layerEnd -= DATA_numLayers;
          if (STUDY_layerEnd < 0) STUDY_layerEnd += DATA_numLayers;

          Current_layerID = STUDY_layerBegin;
          STUDY_layerEnd = STUDY_layerBegin; // <<<<<<<<<<<<<<<<<< force it to only use one!
        }

        float x_begin = x1 + (x2 - x1) * (STUDY_layerBegin) / float(DATA_numLayers);
        float x_end = x1 + (x2 - x1) * (STUDY_layerEnd + 1) / float(DATA_numLayers);

        fill(0, 191, 0, 191);
        noStroke();

        if (STUDY_layerBegin <= STUDY_layerEnd) {
          rect(x_begin, y1, x_end - x_begin, y2 - y1);
        }
        else {
          rect(x1, y1, x_end - x1, y2 - y1);
          rect(x_begin, y1, x2 - x_begin, y2 - y1);
        }

        textAlign(CENTER, CENTER);
        stroke(0);
        fill(0);
        textSize(1.25 * MessageSize);

        for (int j = 0; j < DATA_numLayers; j += 1) {
          String txt = DATA_ParameterLevel[DATA_allLayers[j]][DATA_allLevels[Current_levelID]];
          text(txt, x1 + (x2 - x1) * (j + 0.5) / float(DATA_numLayers), STUDY_Y_control - 0.2 * MessageSize);
        }
      }

      if (UI_BAR_d_Items[i][0].equals("ForecastStatistic")) {
        if (isInside(SOLARCHVISION_X_clicked, SOLARCHVISION_Y_clicked, x1, y1, x2, y2) == 1) {
          if (mouseButton == LEFT) {
            STUDY_statisticBegin = int(roundTo(DATA_allStatistics.length * (SOLARCHVISION_X_clicked - x1) / (x2 - x1) - 0.5, 1));

            DATA_Viewport_Update = true;
          }

          if (mouseButton == RIGHT) {
            STUDY_statisticEnd = int(roundTo(DATA_allStatistics.length * (SOLARCHVISION_X_clicked - x1) / (x2 - x1) - 0.5, 1));

            DATA_Viewport_Update = true;
          }

          if (Wheel_Value > 0) {
            STUDY_statisticBegin += 1;
            STUDY_statisticEnd += 1;

            DATA_Viewport_Update = true;
            Wheel_Value = 0;
          }
          if (Wheel_Value < 0) {
            STUDY_statisticBegin -= 1;
            STUDY_statisticEnd -= 1;

            DATA_Viewport_Update = true;
            Wheel_Value = 0;
          }

          if (STUDY_statisticBegin > DATA_allStatistics.length - 1) STUDY_statisticBegin -= DATA_allStatistics.length;
          if (STUDY_statisticBegin < 0) STUDY_statisticBegin += DATA_allStatistics.length;

          if (STUDY_statisticEnd > DATA_allStatistics.length - 1) STUDY_statisticEnd -= DATA_allStatistics.length;
          if (STUDY_statisticEnd < 0) STUDY_statisticEnd += DATA_allStatistics.length;

          Current_statisticID = STUDY_statisticBegin;
          STUDY_statisticEnd = STUDY_statisticBegin; // <<<<<<<<<<<<<<<<<< force it to only use one!

        }

        float x_begin = x1 + (x2 - x1) * (STUDY_statisticBegin) / float(DATA_allStatistics.length);
        float x_end = x1 + (x2 - x1) * (STUDY_statisticEnd + 1) / float(DATA_allStatistics.length);

        fill(0, 191, 0, 191);
        noStroke();

        if (STUDY_statisticBegin <= STUDY_statisticEnd) {
          rect(x_begin, y1, x_end - x_begin, y2 - y1);
        }
        else {
          rect(x1, y1, x_end - x1, y2 - y1);
          rect(x_begin, y1, x2 - x_begin, y2 - y1);
        }

        textAlign(CENTER, CENTER);
        stroke(0);
        fill(0);
        textSize(1.25 * MessageSize);

        for (int j = 0; j < DATA_allStatistics.length; j += 1) {
          String txt = STAT_N_Title[DATA_allStatistics[j]];
          text(txt, x1 + (x2 - x1) * (j + 0.5) / float(DATA_allStatistics.length), STUDY_Y_control - 0.2 * MessageSize);
        }
      }

      STUDY_Y_control += UI_BAR_d_tab;
    }

    SOLARCHVISION_X_clicked = -1;
    SOLARCHVISION_Y_clicked = -1;
  }
}

float[] SOLARCHVISION_NORMAL (float[] _values) {
  float[] weight_array = {
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  };
  float[] return_array = {
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  };

  int NV = 0; // the number of values without counting undefined values
  float _weight = 0;

  _values = sort(_values);
  for (int i = 0; i < _values.length; i += 1) {
    if (is_undefined_FLOAT(_values[i]) == false) NV += 1;
  }

  if (NV > 0) {
    for (int i = 0; i < NV; i += 1) {
      if (is_undefined_FLOAT(_values[i]) == false) {
        _weight = 1;
        weight_array[STAT_N_Ave] += _weight;
        return_array[STAT_N_Ave] += _values[i];

        _weight = (0.5 * (NV + 1)) - abs((0.5 * (NV + 1)) - (i + 1));
        weight_array[STAT_N_Middle] += _weight;
        return_array[STAT_N_Middle] += _values[i] * _weight;

        _weight = (i + 1);
        weight_array[STAT_N_MidHigh] += _weight;
        return_array[STAT_N_MidHigh] += _values[i] * _weight;

        _weight = (NV + 1 - i);
        weight_array[STAT_N_MidLow] += _weight;
        return_array[STAT_N_MidLow] += _values[i] * _weight;
      }
    }

    return_array[STAT_N_Ave] /= weight_array[STAT_N_Ave];
    return_array[STAT_N_Middle] /= weight_array[STAT_N_Middle];
    return_array[STAT_N_MidHigh] /= weight_array[STAT_N_MidHigh];
    return_array[STAT_N_MidLow] /= weight_array[STAT_N_MidLow];

    return_array[STAT_N_Max] = _values[(NV - 1)];
    return_array[STAT_N_Min] = _values[0];

    if (abs(return_array[STAT_N_Min] - return_array[STAT_N_Middle]) > abs(return_array[STAT_N_Max] - return_array[STAT_N_Middle])) {
      return_array[STAT_N_SpecialMention] = return_array[STAT_N_Min];
    }
    else {
      return_array[STAT_N_SpecialMention] = return_array[STAT_N_Max];
    }

    if ((NV % 2) == 1) {
      return_array[STAT_N_M50] = _values[(floor(NV / 2))];
    } else {
      return_array[STAT_N_M50] = 0.5 * (_values[(floor(NV / 2))] + _values[(floor(NV / 2) - 1)]);
    }

    int q;

    q = int(roundTo((NV * 0.75), 1));
    if (q > NV - 1) q = NV - 1;
    return_array[STAT_N_M75] = _values[q];

    q = int(roundTo((NV * 0.25), 1));
    if (q < 0) q = 0;
    return_array[STAT_N_M25] = _values[q];
  } else {
    for (int i = 0; i < return_array.length; i += 1) {
      return_array[i] = FLOAT_undefined;
    }
  }

  return return_array;
}

int STATION_SWOB_NUMBER = 0;
String[][] STATION_SWOB_INFO;

void LOAD_SWOB_POSITIONS () {
  try {
    String[] FileALL = loadStrings(SWOB_Coordinates);

    String lineSTR;
    String[] input;

    STATION_SWOB_NUMBER = FileALL.length - 1; // to skip the first description line

    STATION_SWOB_INFO = new String [STATION_SWOB_NUMBER][12];

    int n_Locations = 0;

    for (int f = 0; f < STATION_SWOB_NUMBER; f += 1) {
      lineSTR = FileALL[f + 1]; // to skip the first description line

      String StationNameEnglish = "";
      String StationNameFrench = "";
      String StationProvince = "";
      float StationLatitude = 0.0;
      float StationLongitude = 0.0;
      float StationElevation = 0.0;
      String StationICAO = "";
      String StationWMO = "";
      String StationClimate = "";
      String StationDST = ""; //Daylight saving time
      String StationSTD = ""; //Standard Time
      String StationType = ""; // MAN/AUTO

      String[] parts = split(lineSTR, '\t');

      if (12 < parts.length) {
        StationNameFrench = parts[1];
        StationNameEnglish = parts[2];
        StationProvince = parts[3];

        StationType = parts[4];
        if (StationType.equals("Manned")) StationType = "MAN";
        if (StationType.equals("Auto")) StationType = "AUTO";

        StationLatitude = float(parts[5]);
        StationLongitude = float(parts[6]);
        StationElevation = float(parts[7]);

        StationICAO = parts[8];
        StationWMO = parts[9];
        StationClimate = parts[10];
        StationDST = parts[11];
        StationSTD = parts[12];

        STATION_SWOB_INFO[n_Locations][0] = StationNameEnglish;
        STATION_SWOB_INFO[n_Locations][1] = StationNameFrench;
        STATION_SWOB_INFO[n_Locations][2] = StationProvince;
        STATION_SWOB_INFO[n_Locations][3] = String.valueOf(StationLatitude);
        STATION_SWOB_INFO[n_Locations][4] = String.valueOf(StationLongitude);
        STATION_SWOB_INFO[n_Locations][5] = String.valueOf(StationElevation);
        STATION_SWOB_INFO[n_Locations][6] = StationICAO;
        STATION_SWOB_INFO[n_Locations][7] = StationWMO;
        STATION_SWOB_INFO[n_Locations][8] = StationClimate;
        STATION_SWOB_INFO[n_Locations][9] = StationDST;
        STATION_SWOB_INFO[n_Locations][10] = StationSTD;
        STATION_SWOB_INFO[n_Locations][11] = StationType;

        n_Locations += 1;
      }
    }
  }
  catch (Exception e) {
    println("ERROR reading SWOB coordinates.");
  }
}

float[][][] RECENT_OBSERVED_Data = new float[DATA_numTimes][numberOfNearestStations_RECENT_OBSERVED][DATA_numLayers];
int[][][] RECENT_OBSERVED_Flags = new int[DATA_numTimes][numberOfNearestStations_RECENT_OBSERVED][DATA_numLayers];

void LoadRECENT_OBSERVED (String FileName, int now_i, int now_j) { // here: now_i = fhr & now_j = nearest station number e.g. 1st/2nd/etc.

  // finding indexes on the list

  int RelativeHumidity_layerID = -1;
  int AirTemperature_layerID = -1;

  int SurfacePressure_layerID = -1;
  int Precipitation_layerID = -1;

  int CloudCover_layerID = -1;
  int GlobalHorizontal_layerID = -1;

  int WindDirection_layerID = -1;
  int WindSpeed_layerID = -1;

  for (int id = 0; id < DATA_numLayers; id++) {
    if (DATA_allLayers[id] == LAYER_relhum) RelativeHumidity_layerID = id;
    if (DATA_allLayers[id] == LAYER_drybulb) AirTemperature_layerID = id;

    if (DATA_allLayers[id] == LAYER_surfpressure) SurfacePressure_layerID = id;
    if (DATA_allLayers[id] == LAYER_precipitation) Precipitation_layerID = id;

    if (DATA_allLayers[id] == LAYER_cloudcover) CloudCover_layerID = id;
    if (DATA_allLayers[id] == LAYER_glohorrad) GlobalHorizontal_layerID = id;

    if (DATA_allLayers[id] == LAYER_winddir) WindDirection_layerID = id;
    if (DATA_allLayers[id] == LAYER_windspd) WindSpeed_layerID = id;
  }

  String lineSTR;
  String[] input;

  XML FileALL = loadXML(FileName);

  XML[] children0 = FileALL.getChildren("om:member");
  XML[] children1 = children0[0].getChildren("om:Observation");
  XML[] children2 = children1[0].getChildren("om:samplingTime");
  XML[] children3 = children2[0].getChildren("gml:TimeInstant");
  XML[] children4 = children3[0].getChildren("gml:timePosition");
  String _TimeInstant = String.valueOf(children4[0].getContent());
  //println(_TimeInstant);

  int THE_YEAR = int(_TimeInstant.substring(0, 4));
  int THE_MONTH = int(_TimeInstant.substring(5, 7));
  int THE_DAY = int(_TimeInstant.substring(8, 10));
  int THE_HOUR = int(_TimeInstant.substring(11, 13));

  //println(THE_YEAR, THE_MONTH, THE_DAY, THE_HOUR);

  children2 = children1[0].getChildren("om:result");
  children3 = children2[0].getChildren("elements");
  children4 = children3[0].getChildren("element");

  for (int Li = 0; Li < children4.length; Li++) {
    String _a1 = children4[Li].getString("name");
    String _a2 = children4[Li].getString("value");
    String _a3 = children4[Li].getString("uom");

    //println("Li=", Li, _a1, _a2, _a3);

    if (_a2.toUpperCase().equals("MSNG")) { // missing values
      _a2 = String.valueOf(FLOAT_undefined);
    }

    if (SurfacePressure_layerID != -1) {
      if (_a1.equals("stn_pres")) {
        RECENT_OBSERVED_Data[now_i][now_j][SurfacePressure_layerID] = Float.valueOf(_a2);
        RECENT_OBSERVED_Flags[now_i][now_j][SurfacePressure_layerID] = 1;
      }
    }

    if (AirTemperature_layerID != -1) {
      if (_a1.equals("air_temp")) {
        RECENT_OBSERVED_Data[now_i][now_j][AirTemperature_layerID] = Float.valueOf(_a2);
        RECENT_OBSERVED_Flags[now_i][now_j][AirTemperature_layerID] = 1;
      }
    }

    if (RelativeHumidity_layerID != -1) {
      if (_a1.equals("rel_hum")) {
        RECENT_OBSERVED_Data[now_i][now_j][RelativeHumidity_layerID] = Float.valueOf(_a2);
        RECENT_OBSERVED_Flags[now_i][now_j][RelativeHumidity_layerID] = 1;
      }
    }

    if (CloudCover_layerID != -1) {
      if (_a1.equals("tot_cld_amt")) {
        RECENT_OBSERVED_Data[now_i][now_j][CloudCover_layerID] = 0.1 * Float.valueOf(_a2);
        RECENT_OBSERVED_Flags[now_i][now_j][CloudCover_layerID] = 1;
      }
    }

    if (WindDirection_layerID != -1) {
      if (_a1.equals("avg_wnd_dir_10m_mt50-60")) {
        RECENT_OBSERVED_Data[now_i][now_j][WindDirection_layerID] = Float.valueOf(_a2);
        RECENT_OBSERVED_Flags[now_i][now_j][WindDirection_layerID] = 1;
      }
    }

    if (WindSpeed_layerID != -1) {
      if (_a1.equals("avg_wnd_spd_10m_mt50-60")) {
        RECENT_OBSERVED_Data[now_i][now_j][WindSpeed_layerID] = Float.valueOf(_a2);
        RECENT_OBSERVED_Flags[now_i][now_j][WindSpeed_layerID] = 1;
      }
    }

    if (Precipitation_layerID != -1) {
      if (_a1.equals("pcpn_amt_pst6hrs")) {
        RECENT_OBSERVED_Data[now_i][now_j][Precipitation_layerID] = Float.valueOf(_a2); // past 6 hours!
        RECENT_OBSERVED_Flags[now_i][now_j][Precipitation_layerID] = 1;
      }
    }

    if (GlobalHorizontal_layerID != -1) {
      if (_a1.equals("avg_globl_solr_radn_pst1hr")) {
        if (_a2.equals(STRING_undefined)) {
        } else {
          //if (_a3.equals("W/m²")) {
          RECENT_OBSERVED_Data[now_i][now_j][GlobalHorizontal_layerID] = 1000 * Float.valueOf(_a2) / 3.6; // we should check the units!
          RECENT_OBSERVED_Flags[now_i][now_j][GlobalHorizontal_layerID] = 1;
          //}
        }
      }

      if (_a1.equals("tot_globl_solr_radn_pst1hr")) {
        if (_a2.equals(STRING_undefined)) {
        } else {
          //if (_a3.equals("kJ/m²")) {
          RECENT_OBSERVED_Data[now_i][now_j][GlobalHorizontal_layerID] = Float.valueOf(_a2) / 3.6; // we should check the units!
          RECENT_OBSERVED_Flags[now_i][now_j][GlobalHorizontal_layerID] = 1;
          //}
        }
      }
    }
  }
}

boolean isAccumulativeLayer (int layerID) {
  if ((DATA_allLayers[layerID] == LAYER_precipitation) ||
      (DATA_allLayers[layerID] == LAYER_rain) ||
      (DATA_allLayers[layerID] == LAYER_freezingrain) ||
      (DATA_allLayers[layerID] == LAYER_icepellets) ||
      (DATA_allLayers[layerID] == LAYER_snow)) {
    return true;
  }

  if (DATA_allDomains[Current_domainID][DOMAIN_PROPERTY02].equals("CMC")) {
    if ((DATA_allLayers[layerID] == LAYER_solardownshort) ||
        (DATA_allLayers[layerID] == LAYER_solardownlong) ||
        (DATA_allLayers[layerID] == LAYER_solarcomingshort) ||
        (DATA_allLayers[layerID] == LAYER_solarabsrbdshort) ||
        (DATA_allLayers[layerID] == LAYER_solarabsrbdlong)) {
      return true;
    }
  }

  return false;

}

int U_NUMx2 (int m2, int m1) {
 return ((m2 << 8) + m1);
}

int S_NUMx2 (int m2, int m1) {
 long v = 0;

 if (m2 < 128) {
   v = (m2 << 8) + m1;
 }
 else {
   m2 -= 128;
   v = (m2 << 8) + m1;
   v *= -1;
 }

 return (int) v;
}

int U_NUMx4 (int m4, int m3, int m2, int m1) {
 return ((m4 << 24) + (m3 << 16) + (m2 << 8) + m1);
}

int S_NUMx4 (int m4, int m3, int m2, int m1) {
 long v = 0;

 if (m4 < 128) {
   v = ((m4 << 24) + (m3 << 16) + (m2 << 8) + m1);
 }
 else {
   m4 -= 128;
   v = ((m4 << 24) + (m3 << 16) + (m2 << 8) + m1);
   v *= -1;
 }

 return (int) v;
}

long U_NUMx8 (int m8, int m7, int m6, int m5, int m4, int m3, int m2, int m1) {
 return ((long) (m8 << 56) + (m7 << 48) + (m6 << 40) + (m5 << 32) + (m4 << 24) + (m3 << 16) + (m2 << 8) + m1);
}

int U_NUMxI (int[] m) { // note: follows reverse rule as this: int m[0], int m[1], int m[2] ...

// println(m);

 long v = 0;

 for (int i = 0; i < m.length; i++) {
   v += m[i] << (m.length - 1 - i);
 }

// println(v);

 return (int) v;
}

int S_NUMxI (int[] m) { // note: follows reverse rule as this: int m[0], int m[1], int m[2] ...

// println(m);

 long v = 0;
 int v_sign = 1;

 if (m[0] < 1) {
   v += m[0] << (m.length - 1);
 }
 else {
   v += (m[0] - 1) << (m.length - 1);
   v_sign = -1;
 }

 for (int i = 1; i < m.length; i++) {
   v += m[i] << (m.length - 1 - i);
 }

 v *= v_sign;

// println(v);

 return (int) v;
}

int getNthBit (Byte valByte, int posBit) {
  int valInt = valByte >> (8 - (posBit + 1)) & 0x0001;

  return valInt;

}

String IntToBinary32 (int n) {
  String s1 = Integer.toBinaryString(n);

  String s2 = "";
  for (int i = 0; i < 32 - s1.length(); i++) {
    s2 += "0";
  }
  for (int i = 0; i < s1.length(); i++) {
    s2 += s1.substring(i, i + 1);
  }

  return s2;
}

float IEEE32 (String s) {
  float v_sign = pow(-1, Integer.parseInt(s.substring(0, 1), 2));
  //println("v_sign", v_sign);

  float v_exponent = Integer.parseInt(s.substring(1, 9), 2) - 127;
  //println("v_exponent", v_exponent);

  float v_fraction = 0;
  for (int i = 0; i < 23; i++) {
    int q = Integer.parseInt(s.substring(9 + i, 10 + i), 2);
    v_fraction += q * pow(2, -(i + 1));
  }
  v_fraction += 1;
  //println("v_fraction", v_fraction);

  return v_sign * v_fraction * pow(2, v_exponent);

}

int gridTypeOfProjection = 0;

int gridNx = 0;
int gridNy = 0;

float gridLa1 = -90;
float gridLo1 = -180;
float gridLa2 = 90;
float gridLo2 = 180;

float gridLaD = 0;
float gridLoV = 0;
float gridDx = 1;
float gridDy = 1;

float gridFirstLatIn = 0;
float gridSecondLatIn = 0;
float gridSouthLat = 0;
float gridSouthLon = 0;
float gridRotation = 0;

int gridPCF = 0;

int gridScanX = 0;
int gridScanY = 0;

int[][][][] gridYear = new int[DATA_numTimes][DATA_numLayers][DATA_numLevels][DATA_numMembers];
int[][][][] gridMonth = new int[DATA_numTimes][DATA_numLayers][DATA_numLevels][DATA_numMembers];
int[][][][] gridDay = new int[DATA_numTimes][DATA_numLayers][DATA_numLevels][DATA_numMembers];
int[][][][] gridHour = new int[DATA_numTimes][DATA_numLayers][DATA_numLevels][DATA_numMembers];
int[][][][] gridMinute = new int[DATA_numTimes][DATA_numLayers][DATA_numLevels][DATA_numMembers];
int[][][][] gridSecond = new int[DATA_numTimes][DATA_numLayers][DATA_numLevels][DATA_numMembers];

float[][][][] gridForecastConvertedTime = new float[DATA_numTimes][DATA_numLayers][DATA_numLevels][DATA_numMembers];

float[][][][] gridReferenceValue = new float[DATA_numTimes][DATA_numLayers][DATA_numLevels][DATA_numMembers];
int[][][][] gridBinaryScaleFactor = new int[DATA_numTimes][DATA_numLayers][DATA_numLevels][DATA_numMembers];
int[][][][] gridDecimalScaleFactor = new int[DATA_numTimes][DATA_numLayers][DATA_numLevels][DATA_numMembers];
int[][][][] gridNumberOfBitsUsedForEachPackedValue = new int[DATA_numTimes][DATA_numLayers][DATA_numLevels][DATA_numMembers];

String[][][][] allDataTitles = new String [DATA_numTimes][DATA_numLayers][DATA_numLevels][DATA_numMembers];

String[][] allParameterNamesAndUnits = new String [DATA_numLayers][DATA_numLevels];

class GRIB2CLASS {
  String ParameterNameAndUnit;
  String[] DataTitles;
  float[][] DataValues = new float[0][0];
  boolean DataAllocated = false;

  int DisciplineOfProcessedData = 0;
  long LengthOfMessage = 0;
  int IdentificationOfCentre = 0;
  int IdentificationOfSubCentre = 0;
  int MasterTablesVersionNumber = 0;
  int LocalTablesVersionNumber = 0;
  int SignificanceOfReferenceTime = 0;
  int Year;
  int Month;
  int Day;
  int Hour;
  int Minute;
  int Second;
  int ProductionStatusOfData = 0;
  int TypeOfData = 0;

  int TypeOfProjection = 0;

  int Np = 0;
  int Nx = 0;
  int Ny = 0;

  int ResolutionAndComponentFlags = 0;

  float La1 = -90;
  float Lo1 = -180;
  float La2 = 90;
  float Lo2 = 180;

  float LaD = 0;
  float LoV = 0;
  float Dx = 1;
  float Dy = 1;

  float FirstLatIn = 0;
  float SecondLatIn = 0;
  float SouthLat = 0;
  float SouthLon = 0;
  float Rotation = 0;

  int PCF = 0;

  int ScanX = 0;
  int ScanY = 0;

  String Flag_BitNumbers = "00000000";
  int ScanningMode = 0;
  String Mode_BitNumbers = "00000000";

  int NumberOfCoordinateValuesAfterTemplate = 0;
  int ProductDefinitionTemplateNumber = 0;
  int CategoryOfParametersByProductDiscipline = 0;
  int ParameterNumberByProductDisciplineAndParameterCategory = 0;
  int IndicatorOfUnitOfTimeRange = 0;
  int ForecastTimeInDefinedUnits = 0;

  float ForecastConvertedTime;

  int TypeOfFirstFixedSurface = 0;
  int NumberOfDataPoints = 0;
  int DataRepresentationTemplateNumber = 0;

  float ReferenceValue;
  int BinaryScaleFactor;
  int DecimalScaleFactor;
  int NumberOfBitsUsedForEachPackedValue;

  int[] NullBitmapFlags;

  byte[] fileBytes;
  int nPointer;

  void printMore (int startN, int displayMORE) {
    for (int i = 0; i < displayMORE; i++) {
      cout(fileBytes[startN + i]);
    }
    println();

    for (int i = 0; i < displayMORE; i++) {
      print("(" + hex(fileBytes[startN + i], 2) + ")");
    }
    println();

    for (int i = 0; i < displayMORE; i++) {
      print("[" + fileBytes[startN + i] + "]");
    }
    println();
  }

  int[] getGrib2Section (int SectionNumber) {
    println("-----------------------------");

    print("Section:\t");
    println(SectionNumber);

    int nFirstBytes = 6;
    if (SectionNumber == 8) nFirstBytes = 4;

    int[] SectionNumbers = new int[nFirstBytes];
    SectionNumbers[0] = 0;

    for (int j = 1; j < nFirstBytes; j += 1) {
      int c = fileBytes[nPointer + j];
      if (c < 0) c += 256;

      SectionNumbers[j] = c;

      cout(c);
    }
    println();

    int lengthOfSection = -1;
    if (SectionNumber == 0) lengthOfSection = 16;
    else if (SectionNumber == 8) lengthOfSection = 4;
    else lengthOfSection = U_NUMx4(SectionNumbers[1], SectionNumbers[2], SectionNumbers[3], SectionNumbers[4]);

    int new_SectionNumber = -1;
    if (SectionNumber == 0) new_SectionNumber = 0;
    else if (SectionNumber == 8) new_SectionNumber = 8;
    else new_SectionNumber = SectionNumbers[5];

    if (new_SectionNumber == SectionNumber) {
      SectionNumbers = new int[1 + lengthOfSection];
      SectionNumbers[0] = 0;

      for (int j = 1; j <= lengthOfSection; j += 1) {
        int c = fileBytes[nPointer + j];
        if (c < 0) c += 256;

        SectionNumbers[j] = c;

        cout(c);

      }
      println();
    }
    else {
      println();
      println("Not available section", SectionNumber);

      lengthOfSection = 0;

      SectionNumbers = new int[1];
      SectionNumbers[0] = 0;
    }

    for (int j = 1; j < SectionNumbers.length; j += 1) {
      //print("(" + SectionNumbers[j] +  ")");
      //print("(" + hex(SectionNumbers[j], 2) +  ")");
    }
    //println();

    print("Length of section:\t");
    println(lengthOfSection);

    nPointer += lengthOfSection;

    return SectionNumbers;
  }

  void readGrib2Members (int numberOfMembers) {
    final int GridDEF_NumberOfDataPoints = 7;
    final int GridDEF_NumberOfPointsAlongTheXaxis = 31;
    final int GridDEF_NumberOfPointsAlongTheYaxis = 35;

    final int GridDEF_LatLon_LatitudeOfFirstGridPoint = 47;
    final int GridDEF_LatLon_LongitudeOfFirstGridPoint = 51;
    final int GridDEF_LatLon_ResolutionAndComponentFlags = 55;
    final int GridDEF_LatLon_LatitudeOfLastGridPoint = 56;
    final int GridDEF_LatLon_LongitudeOfLastGridPoint = 60;
    // for Rotated latitude/longitude :
    final int GridDEF_LatLon_SouthPoleLatitude = 73;
    final int GridDEF_LatLon_SouthPoleLongitude = 77;
    final int GridDEF_LatLon_RotationOfProjection = 81;

    final int GridDEF_Polar_LatitudeOfFirstGridPoint = 39;
    final int GridDEF_Polar_LongitudeOfFirstGridPoint = 43;
    final int GridDEF_Polar_ResolutionAndComponentFlags = 47;
    final int GridDEF_Polar_DeclinationOfTheGrid = 48;
    final int GridDEF_Polar_OrientationOfTheGrid = 52;
    final int GridDEF_Polar_XDirectionGridLength = 56;
    final int GridDEF_Polar_YDirectionGridLength = 60;
    final int GridDEF_Polar_ProjectionCenterFlag = 64;

    final int GridDEF_Lambert_LatitudeOfFirstGridPoint = 39;
    final int GridDEF_Lambert_LongitudeOfFirstGridPoint = 43;
    final int GridDEF_Lambert_ResolutionAndComponentFlags = 47;
    final int GridDEF_Lambert_DeclinationOfTheGrid = 48;
    final int GridDEF_Lambert_OrientationOfTheGrid = 52;
    final int GridDEF_Lambert_XDirectionGridLength = 56;
    final int GridDEF_Lambert_YDirectionGridLength = 60;
    final int GridDEF_Lambert_ProjectionCenterFlag = 64;
    final int GridDEF_Lambert_1stLatitudeIn = 66;
    final int GridDEF_Lambert_2ndLatitudeIn = 70;
    final int GridDEF_Lambert_SouthPoleLatitude = 74;
    final int GridDEF_Lambert_SouthPoleLongitude = 78;

    int GridDEF_ScanningMode = 72;

    int ComplexPacking_GroupSplittingMethodUsed = 0;
    int ComplexPacking_MissingValueManagementUsed = 0;
    float ComplexPacking_PrimaryMissingValueSubstitute = 0;
    float ComplexPacking_SecondaryMissingValueSubstitute = 0;
    int ComplexPacking_NumberOfGroupsOfDataValues = 0;
    int ComplexPacking_ReferenceForGroupWidths = 0;
    int ComplexPacking_NumberOfBitsUsedForGroupWidths = 0;
    int ComplexPacking_ReferenceForGroupLengths = 0;
    int ComplexPacking_LengthIncrementForTheGroupLengths = 0;
    int ComplexPacking_TrueLengthOfLastGroup = 0;
    int ComplexPacking_NumberOfBitsUsedForTheScaledGroupLengths = 0;
    int ComplexPacking_OrderOfSpatialDifferencing = 0;
    int ComplexPacking_NumberOfExtraOctetsRequiredInDataSection = 0;

    int Bitmap_Indicator = 0;
    int Bitmap_beginPointer = 0;
    int Bitmap_endPointer = 0;
    int Bitmap_FileLength = 0;
    String Bitmap_FileName = "";

    int JPEG2000_TypeOfOriginalFieldValues = 0;
    int JPEG2000_TypeOfCompression = 0;
    int JPEG2000_TargetCompressionRatio = 0;
    int JPEG2000_Lsiz = 0;
    int JPEG2000_Rsiz = 0;
    int JPEG2000_Xsiz = 0;
    int JPEG2000_Ysiz = 0;
    int JPEG2000_XOsiz = 0;
    int JPEG2000_YOsiz = 0;
    int JPEG2000_XTsiz = 0;
    int JPEG2000_YTsiz = 0;
    int JPEG2000_XTOsiz = 0;
    int JPEG2000_YTOsiz = 0;
    int JPEG2000_Csiz = 0;
    int JPEG2000_Ssiz = 0;
    int JPEG2000_XRsiz = 0;
    int JPEG2000_YRsiz = 0;
    int JPEG2000_Lcom = 0;
    int JPEG2000_Rcom = 0;
    int JPEG2000_Lcod = 0;
    int JPEG2000_Scod = 0;
    int JPEG2000_SGcod_ProgressionOrder = 0;
    int JPEG2000_SGcod_NumberOfLayers = 0;
    int JPEG2000_SGcod_MultipleComponentTransformation = 0;
    int JPEG2000_SPcod_NumberOfDecompositionLevels = 0;
    int JPEG2000_SPcod_CodeBlockWidth = 0;
    int JPEG2000_SPcod_CodeBlockHeight = 0;
    int JPEG2000_SPcod_CodeBlockStyle = 0;
    int JPEG2000_SPcod_Transformation = 0;
    int JPEG2000_Lqcd = 0;
    int JPEG2000_Sqcd = 0;
    int JPEG2000_Lsot = 0;
    int JPEG2000_Isot = 0;
    int JPEG2000_Psot = 0;
    int JPEG2000_TPsot = 0;
    int JPEG2000_TNsot = 0;

    nPointer = -1;

    for (int memberID = 0; memberID < numberOfMembers; memberID += 1) {
      int[] SectionNumbers = getGrib2Section(0); // Section 0: Indicator Section

      if (SectionNumbers.length > 1) {
        print("Discipline of processed data:\t");
        this.DisciplineOfProcessedData = SectionNumbers[7];
        switch (this.DisciplineOfProcessedData) {
          case 0: println("Meteorological products"); break;
          case 1: println("Hydrological products"); break;
          case 2: println("Land surface products"); break;
          case 3: println("Space products"); break;
          case 4: println("Space Weather Products "); break;
          case 10: println("Oceanographic products"); break;
          case 255: println("Missing"); break;
          default : println(this.DisciplineOfProcessedData); break;
        }

        print("Length of message:\t");
        this.LengthOfMessage = U_NUMx8(SectionNumbers[9], SectionNumbers[10], SectionNumbers[11], SectionNumbers[12], SectionNumbers[13], SectionNumbers[14], SectionNumbers[15], SectionNumbers[16]);
        println(this.LengthOfMessage);
      }

      SectionNumbers = getGrib2Section(1); // Section 1: Identification Section

      if (SectionNumbers.length > 1) {
        print("Identification of originating/generating centre: ");
        this.IdentificationOfCentre = U_NUMx2(SectionNumbers[6], SectionNumbers[7]);
        switch (this.IdentificationOfCentre) {
          case 0: println("WMO Secretariat"); break;
          case 1: println("Melbourne"); break;
          case 2: println("Melbourne"); break;
          case 4: println("Moscow"); break;
          case 5: println("Moscow"); break;
          case 7: println("US National Weather Service - National Centres for Environmental Prediction (NCEP)"); break;
          case 8: println("US National Weather Service Telecommunications Gateway (NWSTG)"); break;
          case 9: println("US National Weather Service - Other"); break;
          case 10: println("Cairo (RSMC)"); break;
          case 12: println("Dakar (RSMC)"); break;
          case 14: println("Nairobi (RSMC)"); break;
          case 16: println("Casablanca (RSMC)"); break;
          case 17: println("Tunis (RSMC)"); break;
          case 18: println("Tunis - Casablanca (RSMC)"); break;
          case 20: println("Las Palmas"); break;
          case 21: println("Algiers (RSMC)"); break;
          case 22: println("ACMAD"); break;
          case 23: println("Mozambique (NMC)"); break;
          case 24: println("Pretoria (RSMC)"); break;
          case 25: println("La Réunion (RSMC)"); break;
          case 26: println("Khabarovsk (RSMC)"); break;
          case 28: println("New Delhi (RSMC)"); break;
          case 30: println("Novosibirsk (RSMC)"); break;
          case 32: println("Tashkent (RSMC)"); break;
          case 33: println("Jeddah (RSMC)"); break;
          case 34: println("Tokyo (RSMC), Japan Meteorological Agency"); break;
          case 36: println("Bangkok"); break;
          case 37: println("Ulaanbaatar"); break;
          case 38: println("Beijing (RSMC)"); break;
          case 40: println("Seoul"); break;
          case 41: println("Buenos Aires (RSMC)"); break;
          case 43: println("Brasilia (RSMC)"); break;
          case 45: println("Santiago"); break;
          case 46: println("Brazilian Space Agency ­ INPE"); break;
          case 47: println("Colombia (NMC)"); break;
          case 48: println("Ecuador (NMC)"); break;
          case 49: println("Peru (NMC)"); break;
          case 50: println("Venezuela (Bolivarian Republic of) (NMC)"); break;
          case 51: println("Miami (RSMC)"); break;
          case 52: println("Miami (RSMC), National Hurricane Centre"); break;
          case 53: println("Montreal (RSMC)"); break;
          case 54: println("Montreal (RSMC)"); break;
          case 55: println("San Francisco"); break;
          case 56: println("ARINC Centre"); break;
          case 57: println("US Air Force - Air Force Global Weather Central"); break;
          case 58: println("Fleet Numerical Meteorology and Oceanography Center, Monterey, CA, United States"); break;
          case 59: println("The NOAA Forecast Systems Laboratory, Boulder, CO, United States"); break;
          case 60: println("United States National Center for Atmospheric Research (NCAR)"); break;
          case 61: println("Service ARGOS - Landover"); break;
          case 62: println("US Naval Oceanographic Office"); break;
          case 63: println("International Research Institute for Climate and Society (IRI)"); break;
          case 64: println("Honolulu (RSMC)"); break;
          case 65: println("Darwin (RSMC)"); break;
          case 67: println("Melbourne (RSMC)"); break;
          case 69: println("Wellington (RSMC)"); break;
          case 71: println("Nadi (RSMC)"); break;
          case 72: println("Singapore"); break;
          case 73: println("Malaysia (NMC)"); break;
          case 74: println("UK Meteorological Office ­ Exeter (RSMC)"); break;
          case 76: println("Moscow (RSMC)"); break;
          case 78: println("Offenbach (RSMC)"); break;
          case 80: println("Rome (RSMC)"); break;
          case 82: println("Norrköping"); break;
          case 84: println("Toulouse (RSMC)"); break;
          case 85: println("Toulouse (RSMC)"); break;
          case 86: println("Helsinki"); break;
          case 87: println("Belgrade"); break;
          case 88: println("Oslo"); break;
          case 89: println("Prague"); break;
          case 90: println("Episkopi"); break;
          case 91: println("Ankara"); break;
          case 92: println("Frankfurt/Main"); break;
          case 93: println("London (WAFC)"); break;
          case 94: println("Copenhagen"); break;
          case 95: println("Rota"); break;
          case 96: println("Athens"); break;
          case 97: println("European Space Agency (ESA)"); break;
          case 98: println("European Centre for Medium-Range Weather Forecasts (ECMWF) (RSMC)"); break;
          case 99: println("De Bilt"); break;
          case 100: println("Brazzaville"); break;
          case 101: println("Abidjan"); break;
          case 102: println("Libya (NMC)"); break;
          case 103: println("Madagascar (NMC)"); break;
          case 104: println("Mauritius (NMC)"); break;
          case 105: println("Niger (NMC)"); break;
          case 106: println("Seychelles (NMC)"); break;
          case 107: println("Uganda (NMC)"); break;
          case 108: println("United Republic of Tanzania (NMC)"); break;
          case 109: println("Zimbabwe (NMC)"); break;
          case 110: println("Hong-Kong, China"); break;
          case 111: println("Afghanistan (NMC)"); break;
          case 112: println("Bahrain (NMC)"); break;
          case 113: println("Bangladesh (NMC)"); break;
          case 114: println("Bhutan (NMC)"); break;
          case 115: println("Cambodia (NMC)"); break;
          case 116: println("Democratic People's Republic of Korea (NMC)"); break;
          case 117: println("Islamic Republic of Iran (NMC)"); break;
          case 118: println("Iraq (NMC)"); break;
          case 119: println("Kazakhstan (NMC)"); break;
          case 120: println("Kuwait (NMC)"); break;
          case 121: println("Kyrgyzstan (NMC)"); break;
          case 122: println("Lao People's Democratic Republic (NMC)"); break;
          case 123: println("Macao, China"); break;
          case 124: println("Maldives (NMC)"); break;
          case 125: println("Myanmar (NMC)"); break;
          case 126: println("Nepal (NMC)"); break;
          case 127: println("Oman (NMC)"); break;
          case 128: println("Pakistan (NMC)"); break;
          case 129: println("Qatar (NMC)"); break;
          case 130: println("Yemen (NMC)"); break;
          case 131: println("Sri Lanka (NMC)"); break;
          case 132: println("Tajikistan (NMC)"); break;
          case 133: println("Turkmenistan (NMC)"); break;
          case 134: println("United Arab Emirates (NMC)"); break;
          case 135: println("Uzbekistan (NMC)"); break;
          case 136: println("Viet Nam (NMC)"); break;
          case 140: println("Bolivia (Plurinational State of) (NMC)"); break;
          case 141: println("Guyana (NMC)"); break;
          case 142: println("Paraguay (NMC)"); break;
          case 143: println("Suriname (NMC)"); break;
          case 144: println("Uruguay (NMC)"); break;
          case 145: println("French Guiana"); break;
          case 146: println("Brazilian Navy Hydrographic Centre"); break;
          case 147: println("National Commission on Space Activities (CONAE) - Argentina"); break;
          case 150: println("Antigua and Barbuda (NMC)"); break;
          case 151: println("Bahamas (NMC)"); break;
          case 152: println("Barbados (NMC)"); break;
          case 153: println("Belize (NMC)"); break;
          case 154: println("British Caribbean Territories Centre"); break;
          case 155: println("San José"); break;
          case 156: println("Cuba (NMC)"); break;
          case 157: println("Dominica (NMC)"); break;
          case 158: println("Dominican Republic (NMC)"); break;
          case 159: println("El Salvador (NMC)"); break;
          case 160: println("US NOAA/NESDIS"); break;
          case 161: println("US NOAA Office of Oceanic and Atmospheric Research"); break;
          case 162: println("Guatemala (NMC)"); break;
          case 163: println("Haiti (NMC)"); break;
          case 164: println("Honduras (NMC)"); break;
          case 165: println("Jamaica (NMC)"); break;
          case 166: println("Mexico City"); break;
          case 167: println("Curaçao and Sint Maarten (NMC)"); break;
          case 168: println("Nicaragua (NMC)"); break;
          case 169: println("Panama (NMC)"); break;
          case 170: println("Saint Lucia (NMC)"); break;
          case 171: println("Trinidad and Tobago (NMC)"); break;
          case 172: println("French Departments in RA IV"); break;
          case 173: println("US National Aeronautics and Space Administration (NASA)"); break;
          case 174: println("Integrated Science Data Management/Marine Environmental Data Service (ISDM/MEDS) - Canada"); break;
          case 175: println("University Corporation for Atmospheric Research (UCAR) - United States"); break;
          case 176: println("Cooperative Institute for Meteorological Satellite Studies (CIMSS) - United States"); break;
          case 177: println("NOAA National Ocean Service - United States"); break;
          case 190: println("Cook Islands (NMC)"); break;
          case 191: println("French Polynesia (NMC)"); break;
          case 192: println("Tonga (NMC)"); break;
          case 193: println("Vanuatu (NMC)"); break;
          case 194: println("Brunei Darussalam (NMC)"); break;
          case 195: println("Indonesia (NMC)"); break;
          case 196: println("Kiribati (NMC)"); break;
          case 197: println("Federated States of Micronesia (NMC)"); break;
          case 198: println("New Caledonia (NMC)"); break;
          case 199: println("Niue"); break;
          case 200: println("Papua New Guinea (NMC)"); break;
          case 201: println("Philippines (NMC)"); break;
          case 202: println("Samoa (NMC)"); break;
          case 203: println("Solomon Islands (NMC)"); break;
          case 204: println("National Institute of Water and Atmospheric Research (NIWA - New Zealand)"); break;
          case 210: println("Frascati (ESA/ESRIN)"); break;
          case 211: println("Lannion"); break;
          case 212: println("Lisbon"); break;
          case 213: println("Reykjavik"); break;
          case 214: println("Madrid"); break;
          case 215: println("Zurich"); break;
          case 216: println("Service ARGOS - Toulouse"); break;
          case 217: println("Bratislava"); break;
          case 218: println("Budapest"); break;
          case 219: println("Ljubljana"); break;
          case 220: println("Warsaw"); break;
          case 221: println("Zagreb"); break;
          case 222: println("Albania (NMC)"); break;
          case 223: println("Armenia (NMC)"); break;
          case 224: println("Austria (NMC)"); break;
          case 225: println("Azerbaijan (NMC)"); break;
          case 226: println("Belarus (NMC)"); break;
          case 227: println("Belgium (NMC)"); break;
          case 228: println("Bosnia and Herzegovina (NMC)"); break;
          case 229: println("Bulgaria (NMC)"); break;
          case 230: println("Cyprus (NMC)"); break;
          case 231: println("Estonia (NMC)"); break;
          case 232: println("Georgia (NMC)"); break;
          case 233: println("Dublin"); break;
          case 234: println("Israel (NMC)"); break;
          case 235: println("Jordan (NMC)"); break;
          case 236: println("Latvia (NMC)"); break;
          case 237: println("Lebanon (NMC)"); break;
          case 238: println("Lithuania (NMC)"); break;
          case 239: println("Luxembourg"); break;
          case 240: println("Malta (NMC)"); break;
          case 241: println("Monaco"); break;
          case 242: println("Romania (NMC)"); break;
          case 243: println("Syrian Arab Republic (NMC)"); break;
          case 244: println("The former Yugoslav Republic of Macedonia (NMC)"); break;
          case 245: println("Ukraine (NMC)"); break;
          case 246: println("Republic of Moldova (NMC)"); break;
          case 247: println("Operational Programme for the Exchange of weather RAdar information (OPERA) - EUMETNET"); break;
          case 248: println("Montenegro (NMC)"); break;
          case 249: println("Barcelona Dust Forecast Center"); break;
          case 250: println("COnsortium for Small scale MOdelling  (COSMO)"); break;
          case 251: println("Meteorological Cooperation on Operational NWP (MetCoOp)"); break;
          case 252: println("Max Planck Institute for Meteorology (MPI-M)"); break;
          case 254: println("EUMETSAT Operation Centre"); break;
          case 255: println("Missing"); break;
          default: println(this.IdentificationOfCentre); break;
        }

        print("Sub-centre:\t");
        this.IdentificationOfSubCentre = U_NUMx2(SectionNumbers[8], SectionNumbers[9]);
        switch (this.IdentificationOfSubCentre) {
          case 255: println("Missing"); break;
          default: println(this.IdentificationOfSubCentre); break;
        }

        print("Master Tables Version Number:\t");
        this.MasterTablesVersionNumber = SectionNumbers[10];
        switch (this.MasterTablesVersionNumber) {
          case 0: println("Experimental"); break;
          case 1: println("Version implemented on 7 November 2001"); break;
          case 2: println("Version implemented on 4 November 2003"); break;
          case 3: println("Version implemented on 2 November 2005"); break;
          case 4: println("Version implemented on 7 November 2007"); break;
          case 5: println("Version Implemented on 4 November 2009"); break;
          case 6: println("Version Implemented on 15 September 2010"); break;
          case 7: println("Version Implemented on 4 May 2011"); break;
          case 8: println("Version Implemented on 8 November 2011"); break;
          case 9: println("Version Implemented on 2 May 2012"); break;
          case 10: println("Version Implemented on 7 November 2012 "); break;
          case 11: println("Version Implemented on 8 May 2013"); break;
          case 12: println("Version Implemented on 14 November 2013"); break;
          case 13: println("Version Implemented on 7 May 2014"); break;
          case 14: println("Version Implemented on 5 November 2014"); break;
          case 15: println("Version Implemented on 6 May 2015"); break;
          case 16: println("Pre-operational to be implemented by next amendment"); break;
          case 255: println("Missing"); break;
          default: println(this.MasterTablesVersionNumber); break;
        }

        print("Local Tables Version Number:\t");
        this.LocalTablesVersionNumber = SectionNumbers[11];
        switch (this.LocalTablesVersionNumber) {
          case 0: println("Local tables not used. Only table entries and templates from the current Master table are valid."); break;
          case 255: println("Missing"); break;
          default: println(this.LocalTablesVersionNumber); break;
        }

        print("Significance of Reference Time:\t");
        this.SignificanceOfReferenceTime = SectionNumbers[12];
        switch (this.SignificanceOfReferenceTime) {
          case 0: println("Analysis"); break;
          case 1: println("Start of forecast"); break;
          case 2: println("Verifying time of forecast"); break;
          case 3: println("Observation time"); break;
          case 255: println("Missing"); break;
          default: println(this.SignificanceOfReferenceTime); break;
        }

        print("Year:\t");
        this.Year = U_NUMx2(SectionNumbers[13], SectionNumbers[14]);
        println(this.Year);

        print("Month:\t");
        this.Month = SectionNumbers[15];
        println(this.Month);

        print("Day:\t");
        this.Day = SectionNumbers[16];
        println(this.Day);

        print("Hour:\t");
        this.Hour = SectionNumbers[17];
        println(this.Hour);

        print("Minute:\t");
        this.Minute = SectionNumbers[18];
        println(this.Minute);

        print("Second:\t");
        this.Second = SectionNumbers[19];
        println(this.Second);

        print("Production status of data:\t");
        this.ProductionStatusOfData = SectionNumbers[20];
        switch (this.ProductionStatusOfData) {
          case 0: println("Operational products"); break;
          case 1: println("Operational test products"); break;
          case 2: println("Research products"); break;
          case 3: println("Re-analysis products"); break;
          case 255: println("Missing"); break;
          default:  println(this.ProductionStatusOfData); break;
        }

        print("Type of data:\t");
        this.TypeOfData = SectionNumbers[20];
        switch (this.TypeOfData) {
          case 0: println("Analysis products"); break;
          case 1: println("Forecast products"); break;
          case 2: println("Analysis and forecast products"); break;
          case 3: println("Control forecast products"); break;
          case 4: println("Perturbed forecast products"); break;
          case 5: println("Control and perturbed forecast products"); break;
          case 6: println("Processed satellite observations"); break;
          case 7: println("Processed radar observations"); break;
          case 255: println("Missing"); break;
          default: println(this.TypeOfData); break;
        }
      }

      SectionNumbers = getGrib2Section(2); // Section 2: Local Use Section (optional)
      if (SectionNumbers.length > 1) {
      }

      SectionNumbers = getGrib2Section(3); // Section 3: Grid Definition Section

      if (SectionNumbers.length > 1) {
        print("Grid Definition Template Number:\t");
        this.TypeOfProjection = U_NUMx2(SectionNumbers[13], SectionNumbers[14]);
        switch (this.TypeOfProjection) {
          case 0: GridDEF_ScanningMode = 72; println("Latitude/longitude (equidistant cylindrical)"); break;
          case 1: GridDEF_ScanningMode = 72; println("Rotated latitude/longitude"); break;
          case 2: GridDEF_ScanningMode = 72; println("Stretched latitude/longitude"); break;
          case 3: GridDEF_ScanningMode = 72; println("Stretched and rotated latitude/longitude"); break;
          case 4: GridDEF_ScanningMode = 48; println("Variable resolution latitude/longitude"); break;
          case 5: GridDEF_ScanningMode = 48; println("Variable resolution rotated latitude/longitude"); break;
          case 10: GridDEF_ScanningMode = 60; println("Mercator"); break;
          case 12: GridDEF_ScanningMode = 60; println("Transverse Mercator"); break;
          case 20: GridDEF_ScanningMode = 65; println("Polar Stereographic Projection (can be north or south)"); GridDEF_ScanningMode = 65; break;
          case 30: GridDEF_ScanningMode = 65; println("Lambert conformal (can be secant, tangent, conical, or bipolar)"); break;
          case 31: GridDEF_ScanningMode = 65; println("Albers equal area"); break;
          case 40: GridDEF_ScanningMode = 72; println("Gaussian latitude/longitude"); break;
          case 41: GridDEF_ScanningMode = 72; println("Rotated Gaussian latitude/longitude"); break;
          case 42: GridDEF_ScanningMode = 72; println("Stretched Gaussian latitude/longitude"); break;
          case 43:GridDEF_ScanningMode = 72;  println("Stretched and rotated Gaussian latitude/longitude"); break;
          case 50: println("Spherical harmonic coefficients"); break;
          case 51: println("Rotated spherical harmonic coefficients"); break;
          case 52: println("Stretched spherical harmonic coefficients"); break;
          case 53: println("Stretched and rotated spherical harmonic coefficients"); break;
          case 90: GridDEF_ScanningMode = 64; println("Space view perspective orthographic"); break;
          case 100: GridDEF_ScanningMode = 34; println("Triangular grid based on an icosahedron"); break;
          case 110: GridDEF_ScanningMode = 57; println("Equatorial azimuthal equidistant projection"); break;
          case 120: GridDEF_ScanningMode = 39; println("Azimuth-range projection"); break;
          case 140: GridDEF_ScanningMode = 64; println("Lambert azimuthal equal area projection"); break;
          case 204: GridDEF_ScanningMode = 72; println("Curvilinear orthogonal grids"); break;
          case 1000: println("Cross-section grid, with points equally spaced on the horizontal"); break;
          case 1100: GridDEF_ScanningMode = 51; println("Hovmöller diagram grid, with points equally spaced on the horizontal"); break;
          case 1200: println("Time section grid"); break;
          case 32768: GridDEF_ScanningMode = 72; println("Rotated latitude/longitude (arakawa staggered E-grid)"); break;
          case 32769: GridDEF_ScanningMode = 72; println("Rotated latitude/longitude (arakawa non-E staggered grid)"); break;
          case 65535: println("Missing"); break;
          default : println(this.TypeOfProjection); break;
        }

        print("Number of data points (Nx * Ny):\t");
        this.Np = U_NUMx4(SectionNumbers[GridDEF_NumberOfDataPoints], SectionNumbers[GridDEF_NumberOfDataPoints + 1], SectionNumbers[GridDEF_NumberOfDataPoints + 2], SectionNumbers[GridDEF_NumberOfDataPoints + 3]);
        println(this.Np);

        print("Number of points along the X-axis:\t");
        this.Nx = U_NUMx4(SectionNumbers[GridDEF_NumberOfPointsAlongTheXaxis], SectionNumbers[GridDEF_NumberOfPointsAlongTheXaxis + 1], SectionNumbers[GridDEF_NumberOfPointsAlongTheXaxis + 2], SectionNumbers[GridDEF_NumberOfPointsAlongTheXaxis + 3]);
        println(this.Nx);

        print("Number of points along the Y-axis:\t");
        this.Ny = U_NUMx4(SectionNumbers[GridDEF_NumberOfPointsAlongTheYaxis], SectionNumbers[GridDEF_NumberOfPointsAlongTheYaxis + 1], SectionNumbers[GridDEF_NumberOfPointsAlongTheYaxis + 2], SectionNumbers[GridDEF_NumberOfPointsAlongTheYaxis + 3]);
        println(this.Ny);

        if (this.TypeOfProjection == 0) { // Latitude/longitude

          this.ResolutionAndComponentFlags = SectionNumbers[GridDEF_LatLon_ResolutionAndComponentFlags];
          println("Resolution and component flags:\t" + this.ResolutionAndComponentFlags);

          this.La1 = 0.000001 * S_NUMx4(SectionNumbers[GridDEF_LatLon_LatitudeOfFirstGridPoint], SectionNumbers[GridDEF_LatLon_LatitudeOfFirstGridPoint + 1], SectionNumbers[GridDEF_LatLon_LatitudeOfFirstGridPoint + 2], SectionNumbers[GridDEF_LatLon_LatitudeOfFirstGridPoint + 3]);
          println("Latitude of first grid point:\t" + this.La1);

          this.Lo1 = 0.000001 * U_NUMx4(SectionNumbers[GridDEF_LatLon_LongitudeOfFirstGridPoint], SectionNumbers[GridDEF_LatLon_LongitudeOfFirstGridPoint + 1], SectionNumbers[GridDEF_LatLon_LongitudeOfFirstGridPoint + 2], SectionNumbers[GridDEF_LatLon_LongitudeOfFirstGridPoint + 3]);
          if (this.Lo1 == 180) this.Lo1 = -180;
          println("Longitude of first grid point:\t" + this.Lo1);

          this.La2 = 0.000001 * S_NUMx4(SectionNumbers[GridDEF_LatLon_LatitudeOfLastGridPoint], SectionNumbers[GridDEF_LatLon_LatitudeOfLastGridPoint + 1], SectionNumbers[GridDEF_LatLon_LatitudeOfLastGridPoint + 2], SectionNumbers[GridDEF_LatLon_LatitudeOfLastGridPoint + 3]);
          println("Latitude of last grid point:\t" + this.La2);

          this.Lo2 = 0.000001 * U_NUMx4(SectionNumbers[GridDEF_LatLon_LongitudeOfLastGridPoint], SectionNumbers[GridDEF_LatLon_LongitudeOfLastGridPoint + 1], SectionNumbers[GridDEF_LatLon_LongitudeOfLastGridPoint + 2], SectionNumbers[GridDEF_LatLon_LongitudeOfLastGridPoint + 3]);
          if (this.Lo2 < this.Lo1) this.Lo2 += 360;
          println("Longitude of last grid point:\t" + this.Lo2);

        }
        else if (this.TypeOfProjection == 1) { // Rotated latitude/longitude

          this.ResolutionAndComponentFlags = SectionNumbers[GridDEF_LatLon_ResolutionAndComponentFlags];
          println("Resolution and component flags:\t" + this.ResolutionAndComponentFlags);

          this.La1 = 0.000001 * S_NUMx4(SectionNumbers[GridDEF_LatLon_LatitudeOfFirstGridPoint], SectionNumbers[GridDEF_LatLon_LatitudeOfFirstGridPoint + 1], SectionNumbers[GridDEF_LatLon_LatitudeOfFirstGridPoint + 2], SectionNumbers[GridDEF_LatLon_LatitudeOfFirstGridPoint + 3]);
          println("Latitude of first grid point:\t" + this.La1);

          this.Lo1 = 0.000001 * U_NUMx4(SectionNumbers[GridDEF_LatLon_LongitudeOfFirstGridPoint], SectionNumbers[GridDEF_LatLon_LongitudeOfFirstGridPoint + 1], SectionNumbers[GridDEF_LatLon_LongitudeOfFirstGridPoint + 2], SectionNumbers[GridDEF_LatLon_LongitudeOfFirstGridPoint + 3]);
          if (this.Lo1 == 180) this.Lo1 = -180;
          println("Longitude of first grid point:\t" + this.Lo1);

          this.La2 = 0.000001 * S_NUMx4(SectionNumbers[GridDEF_LatLon_LatitudeOfLastGridPoint], SectionNumbers[GridDEF_LatLon_LatitudeOfLastGridPoint + 1], SectionNumbers[GridDEF_LatLon_LatitudeOfLastGridPoint + 2], SectionNumbers[GridDEF_LatLon_LatitudeOfLastGridPoint + 3]);
          println("Latitude of last grid point:\t" + this.La2);

          this.Lo2 = 0.000001 * U_NUMx4(SectionNumbers[GridDEF_LatLon_LongitudeOfLastGridPoint], SectionNumbers[GridDEF_LatLon_LongitudeOfLastGridPoint + 1], SectionNumbers[GridDEF_LatLon_LongitudeOfLastGridPoint + 2], SectionNumbers[GridDEF_LatLon_LongitudeOfLastGridPoint + 3]);
          if (this.Lo2 < this.Lo1) this.Lo2 += 360;
          println("Longitude of last grid point:\t" + this.Lo2);

          this.SouthLat = 0.000001 * S_NUMx4(SectionNumbers[GridDEF_LatLon_SouthPoleLatitude], SectionNumbers[GridDEF_LatLon_SouthPoleLatitude + 1], SectionNumbers[GridDEF_LatLon_SouthPoleLatitude + 2], SectionNumbers[GridDEF_LatLon_SouthPoleLatitude + 3]);
          println("Latitude of the southern pole of projection:\t" + this.SouthLat);

          this.SouthLon = 0.000001 * U_NUMx4(SectionNumbers[GridDEF_LatLon_SouthPoleLongitude], SectionNumbers[GridDEF_LatLon_SouthPoleLongitude + 1], SectionNumbers[GridDEF_LatLon_SouthPoleLongitude + 2], SectionNumbers[GridDEF_LatLon_SouthPoleLongitude + 3]);
          println("Longitude of the southern pole of projection:\t" + this.SouthLon);

          this.Rotation = S_NUMx4(SectionNumbers[GridDEF_LatLon_RotationOfProjection], SectionNumbers[GridDEF_LatLon_RotationOfProjection + 1], SectionNumbers[GridDEF_LatLon_RotationOfProjection + 2], SectionNumbers[GridDEF_LatLon_RotationOfProjection + 3]);
          println("Angle of rotation of projection:\t" + this.Rotation);

        }
        else if (this.TypeOfProjection == 20) { // Polar Stereographic Projection

          this.ResolutionAndComponentFlags = SectionNumbers[GridDEF_Polar_ResolutionAndComponentFlags];
          println("Resolution and component flags:\t" + this.ResolutionAndComponentFlags);

          this.La1 = 0.000001 * S_NUMx4(SectionNumbers[GridDEF_Polar_LatitudeOfFirstGridPoint], SectionNumbers[GridDEF_Polar_LatitudeOfFirstGridPoint + 1], SectionNumbers[GridDEF_Polar_LatitudeOfFirstGridPoint + 2], SectionNumbers[GridDEF_Polar_LatitudeOfFirstGridPoint + 3]);
          println("Latitude of first grid point:\t" + this.La1);

          this.Lo1 = 0.000001 * U_NUMx4(SectionNumbers[GridDEF_Polar_LongitudeOfFirstGridPoint], SectionNumbers[GridDEF_Polar_LongitudeOfFirstGridPoint + 1], SectionNumbers[GridDEF_Polar_LongitudeOfFirstGridPoint + 2], SectionNumbers[GridDEF_Polar_LongitudeOfFirstGridPoint + 3]);
          println("Longitude of first grid point:\t" + this.Lo1);

          this.LaD = 0.000001 * S_NUMx4(SectionNumbers[GridDEF_Polar_DeclinationOfTheGrid], SectionNumbers[GridDEF_Polar_DeclinationOfTheGrid + 1], SectionNumbers[GridDEF_Polar_DeclinationOfTheGrid + 2], SectionNumbers[GridDEF_Polar_DeclinationOfTheGrid + 3]);
          println("Latitude where Dx and Dy are specified:\t" + this.LaD);

          this.LoV = 0.000001 * U_NUMx4(SectionNumbers[GridDEF_Polar_OrientationOfTheGrid], SectionNumbers[GridDEF_Polar_OrientationOfTheGrid + 1], SectionNumbers[GridDEF_Polar_OrientationOfTheGrid + 2], SectionNumbers[GridDEF_Polar_OrientationOfTheGrid + 3]);
          println("Orientation of the grid:\t" + this.LoV);

          this.Dx = 0.000001 * U_NUMx4(SectionNumbers[GridDEF_Polar_XDirectionGridLength], SectionNumbers[GridDEF_Polar_XDirectionGridLength + 1], SectionNumbers[GridDEF_Polar_XDirectionGridLength + 2], SectionNumbers[GridDEF_Polar_XDirectionGridLength + 3]);
          println("X-direction grid length (km):\t" + this.Dx);

          this.Dy = 0.000001 * U_NUMx4(SectionNumbers[GridDEF_Polar_YDirectionGridLength], SectionNumbers[GridDEF_Polar_YDirectionGridLength + 1], SectionNumbers[GridDEF_Polar_YDirectionGridLength + 2], SectionNumbers[GridDEF_Polar_YDirectionGridLength + 3]);
          println("Y-direction grid length (km):\t" + this.Dy);

          this.PCF = SectionNumbers[GridDEF_Polar_ProjectionCenterFlag];
          println("Projection center flag:\t" + this.PCF);

        }
        else if (this.TypeOfProjection == 30) { // Lambert Conformal Projection

          this.ResolutionAndComponentFlags = SectionNumbers[GridDEF_Lambert_ResolutionAndComponentFlags];
          println("Resolution and component flags:\t" + this.ResolutionAndComponentFlags);

          this.La1 = 0.000001 * S_NUMx4(SectionNumbers[GridDEF_Lambert_LatitudeOfFirstGridPoint], SectionNumbers[GridDEF_Lambert_LatitudeOfFirstGridPoint + 1], SectionNumbers[GridDEF_Lambert_LatitudeOfFirstGridPoint + 2], SectionNumbers[GridDEF_Lambert_LatitudeOfFirstGridPoint + 3]);
          println("Latitude of first grid point:\t" + this.La1);

          this.Lo1 = 0.000001 * U_NUMx4(SectionNumbers[GridDEF_Lambert_LongitudeOfFirstGridPoint], SectionNumbers[GridDEF_Lambert_LongitudeOfFirstGridPoint + 1], SectionNumbers[GridDEF_Lambert_LongitudeOfFirstGridPoint + 2], SectionNumbers[GridDEF_Lambert_LongitudeOfFirstGridPoint + 3]);
          println("Longitude of first grid point:\t" + this.Lo1);

          this.LaD = 0.000001 * S_NUMx4(SectionNumbers[GridDEF_Lambert_DeclinationOfTheGrid], SectionNumbers[GridDEF_Lambert_DeclinationOfTheGrid + 1], SectionNumbers[GridDEF_Lambert_DeclinationOfTheGrid + 2], SectionNumbers[GridDEF_Lambert_DeclinationOfTheGrid + 3]);
          println("Latitude where Dx and Dy are specified:\t" + this.LaD);

          this.LoV = 0.000001 * U_NUMx4(SectionNumbers[GridDEF_Lambert_OrientationOfTheGrid], SectionNumbers[GridDEF_Lambert_OrientationOfTheGrid + 1], SectionNumbers[GridDEF_Lambert_OrientationOfTheGrid + 2], SectionNumbers[GridDEF_Lambert_OrientationOfTheGrid + 3]);
          println("Orientation of the grid:\t" + this.LoV);

          this.Dx = 0.000001 * U_NUMx4(SectionNumbers[GridDEF_Lambert_XDirectionGridLength], SectionNumbers[GridDEF_Lambert_XDirectionGridLength + 1], SectionNumbers[GridDEF_Lambert_XDirectionGridLength + 2], SectionNumbers[GridDEF_Lambert_XDirectionGridLength + 3]);
          println("X-direction grid length (km):\t" + this.Dx);

          this.Dy = 0.000001 * U_NUMx4(SectionNumbers[GridDEF_Lambert_YDirectionGridLength], SectionNumbers[GridDEF_Lambert_YDirectionGridLength + 1], SectionNumbers[GridDEF_Lambert_YDirectionGridLength + 2], SectionNumbers[GridDEF_Lambert_YDirectionGridLength + 3]);
          println("Y-direction grid length (km):\t" + this.Dy);

          this.PCF = SectionNumbers[GridDEF_Lambert_ProjectionCenterFlag];
          println("Projection center flag:\t" + this.PCF);

          this.FirstLatIn = 0.000001 * S_NUMx4(SectionNumbers[GridDEF_Lambert_1stLatitudeIn], SectionNumbers[GridDEF_Lambert_1stLatitudeIn + 1], SectionNumbers[GridDEF_Lambert_1stLatitudeIn + 2], SectionNumbers[GridDEF_Lambert_1stLatitudeIn + 3]);
          println("First latitude from the pole at which the secant cone cuts the sphere:\t" + this.FirstLatIn);

          this.SecondLatIn = 0.000001 * S_NUMx4(SectionNumbers[GridDEF_Lambert_2ndLatitudeIn], SectionNumbers[GridDEF_Lambert_2ndLatitudeIn + 1], SectionNumbers[GridDEF_Lambert_2ndLatitudeIn + 2], SectionNumbers[GridDEF_Lambert_2ndLatitudeIn + 3]);
          println("Second latitude from the pole at which the secant cone cuts the sphere:\t" + this.SecondLatIn);

          this.SouthLat = 0.000001 * S_NUMx4(SectionNumbers[GridDEF_Lambert_2ndLatitudeIn], SectionNumbers[GridDEF_Lambert_2ndLatitudeIn + 1], SectionNumbers[GridDEF_Lambert_2ndLatitudeIn + 2], SectionNumbers[GridDEF_Lambert_2ndLatitudeIn + 3]);
          println("Latitude of the southern pole of projection:\t" + this.SouthLat);

          this.SouthLon = 0.000001 * U_NUMx4(SectionNumbers[GridDEF_Lambert_SouthPoleLongitude], SectionNumbers[GridDEF_Lambert_SouthPoleLongitude + 1], SectionNumbers[GridDEF_Lambert_SouthPoleLongitude + 2], SectionNumbers[GridDEF_Lambert_SouthPoleLongitude + 3]);
          println("Longitude of the southern pole of projection:\t" + this.SouthLon);

        }

        print("Flag bit numbers:\n");
        this.Flag_BitNumbers = binary(this.ResolutionAndComponentFlags, 8);
        {
          if (this.Flag_BitNumbers.substring(2, 3).equals("0")) {
            println("\ti direction increments not given");
          }
          else {
            println("\ti direction increments given");
          }

          if (this.Flag_BitNumbers.substring(3, 4).equals("0")) {
            println("\tj direction increments not given");
          }
          else {
            println("\tj direction increments given");
          }

          if (this.Flag_BitNumbers.substring(4, 5).equals("0")) {
            println("\tResolved u- and v- components of vector quantities relative to easterly and northerly directions");
          }
          else {
            println("\tResolved u- and v- components of vector quantities relative to the defined grid in the direction of increasing x and y (or i and j) coordinates respectively");
          }
        }

        print("Scanning mode:\t");
        this.ScanningMode = SectionNumbers[GridDEF_ScanningMode];
        println(this.ScanningMode);

        this.ScanX = 1;
        this.ScanY = 1;

        print("Mode bit numbers:\n");
        this.Mode_BitNumbers = binary(this.ScanningMode, 8);
        {
          if (this.Mode_BitNumbers.substring(0, 1).equals("0")) {
            println("\tPoints of first row or column scan in the +i (+x) direction");
          }
          else {
            println("\tPoints of first row or column scan in the -i (-x) direction");
            this.ScanX = 0;
          }

          if (this.Mode_BitNumbers.substring(1, 2).equals("0")) {
            println("\tPoints of first row or column scan in the -j (-y) direction");
          }
          else {
            println("\tPoints of first row or column scan in the +j (+y) direction");
            this.ScanY = 0;
          }

          if (this.Mode_BitNumbers.substring(2, 3).equals("0")) {
            println("\tAdjacent points in i (x) direction are consecutive");
          }
          else {
            println("\tAdjacent points in j (y) direction is consecutive");
          }

          if (this.Mode_BitNumbers.substring(3, 4).equals("0")) {
            println("\tAll rows scan in the same direction");
          }
          else {
            println("\tAdjacent rows scan in opposite directions");
          }
        }
      }

      SectionNumbers = getGrib2Section(4); // Section 4: Product Definition Section

      if (SectionNumbers.length > 1) {
        print("Number of coordinate values after Template:\t");
        this.NumberOfCoordinateValuesAfterTemplate = U_NUMx2(SectionNumbers[6], SectionNumbers[7]);
        println(this.NumberOfCoordinateValuesAfterTemplate);

        print("Number of coordinate values after Template:\t");
        this.ProductDefinitionTemplateNumber = U_NUMx2(SectionNumbers[8], SectionNumbers[9]);
        switch (this.ProductDefinitionTemplateNumber) {
          case 0: println("Analysis or forecast at a horizontal level or in a horizontal layer at a point in time. (see Template 4.0)"); break;
          case 1: println("Individual ensemble forecast, control and perturbed, at a horizontal level or in a horizontal layer at a point in time. (see Template 4.1)"); break;
          case 2: println("Derived forecasts based on all ensemble members at a horizontal level or in a horizontal layer at a point in time. (see Template 4.2)"); break;
          case 3: println("Derived forecasts based on a cluster of ensemble members over a rectangular area at a horizontal level or in a horizontal layer at a point in time. (see Template 4.3)"); break;
          case 4: println("Derived forecasts based on a cluster of ensemble members over a circular area at a horizontal level or in a horizontal layer at a point in time. (see Template 4.4)"); break;
          case 5: println("Probability forecasts at a horizontal level or in a horizontal layer at a point in time. (see Template 4.5)"); break;
          case 6: println("Percentile forecasts at a horizontal level or in a horizontal layer at a point in time. (see Template 4.6)"); break;
          case 7: println("Analysis or forecast error at a horizontal level or in a horizontal layer at a point in time. (see Template 4.7)"); break;
          case 8: println("Average, accumulation, extreme values or other statistically processed values at a horizontal level or in a horizontal layer in a continuous or non-continuous time interval. (see Template 4.8)"); break;
          case 9: println("Probability forecasts at a horizontal level or in a horizontal layer in a continuous or non-continuous time interval. (see Template 4.9)"); break;
          case 10: println("Percentile forecasts at a horizontal level or in a horizontal layer in a continuous or non-continuous time interval. (see Template 4.10)"); break;
          case 11: println("Individual ensemble forecast, control and perturbed, at a horizontal level or in a horizontal layer, in a continuous or non-continuous time interval. (see Template 4.11)"); break;
          case 12: println("Derived forecasts based on all ensemble members at a horizontal level or in a horizontal layer, in a continuous or non-continuous time interval. (see Template 4.12)"); break;
          case 13: println("Derived forecasts based on a cluster of ensemble members over a rectangular area at a horizontal level or in a horizontal layer, in a continuous or non-continuous time interval. (see Template 4.13)"); break;
          case 14: println("Derived forecasts based on a cluster of ensemble members over a circular area at a horizontal level or in a horizontal layer, in a continuous or non-continuous time interval. (see Template 4.14)"); break;
          case 15: println("Average, accumulation, extreme values or other statistically-processed values over a spatial area at a horizontal level or in a horizontal layer at a point in time. (see Template 4.15)"); break;
          case 20: println("Radar product (see Template 4.20)"); break;
          case 30: println("Satellite product (see Template 4.30) NOTE:This template is deprecated. Template 4.31 should be used instead."); break;
          case 31: println("Satellite product (see Template 4.31)"); break;
          case 32: println("Analysis or forecast at a horizontal level or in a horizontal layer at a point in time for simulate (synthetic) staellite data (see Template 4.32)"); break;
          case 40: println("Analysis or forecast at a horizontal level or in a horizontal layer at a point in time for atmospheric chemical constituents. (see Template 4.40)"); break;
          case 41: println("Individual ensemble forecast, control and perturbed, at a horizontal level or in a horizontal layer at a point in time for atmospheric chemical constituents. (see Template 4.41)"); break;
          case 42: println("Average, accumulation, and/or extreme values or other statistically processed values at a horizontal level or in a horizontal layer in a continuous or non-continuous time interval for atmospheric chemical constituents. (see Template 4.42)"); break;
          case 43: println("Individual ensemble forecast, control and perturbed, at a horizontal level or in a horizontal layer, in a continuous or non-continuous time interval for atmospheric chemical constituents. (see Template 4.43)"); break;
          case 44: println("Analysis or forecast at a horizontal level or in a horizontal layer at a point in time for aerosol. (see Template 4.44)"); break;
          case 45: println("Individual ensemble forecast, control and perturbed, at a horizontal level or in a horizontal layer, in a continuous or non-continuous time interval for aerosol. (see Template 4.45)"); break;
          case 46: println("Average, accumulation, and/or extreme values or other statistically processed values at a horizontal level or in a horizontal layer in a continuous or non-continuous time interval for aerosol. (see Template 4.46)"); break;
          case 47: println("Individual ensemble forecast, control and perturbed, at a horizontal level or in a horizontal layer, in a continuous or non-continuous time interval for aerosol. (see Template 4.47)"); break;
          case 48: println("Analysis or forecast at a horizontal level or in a horizontal layer at a point in time for aerosol. (see Template 4.48)"); break;
          case 51: println("Categorical forecast at a horizontal level or in a horizontal layer at a point in time. (see Template 4.51)"); break;
          case 91: println("Categorical forecast at a horizontal level or in a horizontal layer in a continuous or non-continuous time interval. (see Template 4.91)"); break;
          case 254: println("CCITT IA5 character string (see Template 4.254)"); break;
          case 1000: println("Cross-section of analysis and forecast at a point in time. (see Template 4.1000)"); break;
          case 1001: println("Cross-section of averaged or otherwise statistically processed analysis or forecast over a range of time. (see Template 4.1001)"); break;
          case 1002: println("Cross-section of analysis and forecast, averaged or otherwise statistically-processed over latitude or longitude. (see Template 4.1002)"); break;
          case 1100: println("Hovmoller-type grid with no averaging or other statistical processing (see Template 4.1100)"); break;
          case 1101: println("Hovmoller-type grid with averaging or other statistical processing (see Template 4.1101)"); break;
          case 65535: println("Missing"); break;
          default : println(this.ProductDefinitionTemplateNumber); break;
        }

        print("Category of parameters by product discipline:\t");
        this.CategoryOfParametersByProductDiscipline = SectionNumbers[10];
        if (this.DisciplineOfProcessedData == 0) { // Meteorological
          switch (this.CategoryOfParametersByProductDiscipline) {
            case 0: println("Temperature"); break;
            case 1: println("Moisture"); break;
            case 2: println("Momentum"); break;
            case 3: println("Mass"); break;
            case 4: println("Short-wave Radiation"); break;
            case 5: println("Long-wave Radiation"); break;
            case 6: println("Cloud"); break;
            case 7: println("Thermodynamic Stability indices"); break;
            case 8: println("Kinematic Stability indices"); break;
            case 9: println("Temperature Probabilities"); break;
            case 10: println("Moisture Probabilities"); break;
            case 11: println("Momentum Probabilities"); break;
            case 12: println("Mass Probabilities"); break;
            case 13: println("Aerosols"); break;
            case 14: println("Trace gases (e.g., ozone, CO2)"); break;
            case 15: println("Radar"); break;
            case 16: println("Forecast Radar Imagery"); break;
            case 17: println("Electro-dynamics"); break;
            case 18: println("Nuclear/radiology"); break;
            case 19: println("Physical atmospheric properties"); break;
            case 190: println("CCITT IA5 string"); break;
            case 191: println("Miscellaneous"); break;
            case 255: println("Missing"); break;
            default : println(this.CategoryOfParametersByProductDiscipline); break;
          }
        }
        else {
          println(this.CategoryOfParametersByProductDiscipline);
        }

        print("Parameter number by product discipline and parameter category:\t");
        this.ParameterNumberByProductDisciplineAndParameterCategory = SectionNumbers[11];

        if (this.DisciplineOfProcessedData == 0) { // Meteorological
          if (this.CategoryOfParametersByProductDiscipline == 0) { // Temperature
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Temperature(K)"; break;
              case 1: this.ParameterNameAndUnit = "Virtual Temperature(K)"; break;
              case 2: this.ParameterNameAndUnit = "Potential Temperature(K)"; break;
              case 3: this.ParameterNameAndUnit = "Pseudo-Adiabatic Potential Temperature (or Equivalent Potential Temperature)(K)"; break;
              case 4: this.ParameterNameAndUnit = "Maximum Temperature*(K)"; break;
              case 5: this.ParameterNameAndUnit = "Minimum Temperature*(K)"; break;
              case 6: this.ParameterNameAndUnit = "Dew Point Temperature(K)"; break;
              case 7: this.ParameterNameAndUnit = "Dew Point Depression (or Deficit)(K)"; break;
              case 8: this.ParameterNameAndUnit = "Lapse Rate(K m-1)"; break;
              case 9: this.ParameterNameAndUnit = "Temperature Anomaly(K)"; break;
              case 10: this.ParameterNameAndUnit = "Latent Heat Net Flux(W m-2)"; break;
              case 11: this.ParameterNameAndUnit = "Sensible Heat Net Flux(W m-2)"; break;
              case 12: this.ParameterNameAndUnit = "Heat Index(K)"; break;
              case 13: this.ParameterNameAndUnit = "Wind Chill Factor(K)"; break;
              case 14: this.ParameterNameAndUnit = "Minimum Dew Point Depression*(K)"; break;
              case 15: this.ParameterNameAndUnit = "Virtual Potential Temperature(K)"; break;
              case 16: this.ParameterNameAndUnit = "Snow Phase Change Heat Flux(W m-2)"; break;
              case 17: this.ParameterNameAndUnit = "Skin Temperature(K)"; break;
              case 18: this.ParameterNameAndUnit = "Snow Temperature (top of snow)(K)"; break;
              case 19: this.ParameterNameAndUnit = "Turbulent Transfer Coefficient for Heat(Numeric)"; break;
              case 20: this.ParameterNameAndUnit = "Turbulent Diffusion Coefficient for Heat(m2s-1)"; break;
              case 192: this.ParameterNameAndUnit = "Snow Phase Change Heat Flux(W m-2)"; break;
              case 193: this.ParameterNameAndUnit = "Temperature Tendency by All Radiation(K s-1)"; break;
              case 194: this.ParameterNameAndUnit = "Relative Error Variance()"; break;
              case 195: this.ParameterNameAndUnit = "Large Scale Condensate Heating Rate(K/s)"; break;
              case 196: this.ParameterNameAndUnit = "Deep Convective Heating Rate(K/s)"; break;
              case 197: this.ParameterNameAndUnit = "Total Downward Heat Flux at Surface(W m-2)"; break;
              case 198: this.ParameterNameAndUnit = "Temperature Tendency by All Physics(K s-1)"; break;
              case 199: this.ParameterNameAndUnit = "Temperature Tendency by Non-radiation Physics(K s-1)"; break;
              case 200: this.ParameterNameAndUnit = "Standard Dev. of IR Temp. over 1x1 deg. area(K)"; break;
              case 201: this.ParameterNameAndUnit = "Shallow Convective Heating Rate(K/s)"; break;
              case 202: this.ParameterNameAndUnit = "Vertical Diffusion Heating rate(K/s)"; break;
              case 203: this.ParameterNameAndUnit = "Potential Temperature at Top of Viscous Sublayer(K)"; break;
              case 204: this.ParameterNameAndUnit = "Tropical Cyclone Heat Potential(J/m2K)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 1) { // Moisture
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Specific Humidity(kg kg-1)"; break;
              case 1: this.ParameterNameAndUnit = "Relative Humidity(%)"; break;
              case 2: this.ParameterNameAndUnit = "Humidity Mixing Ratio(kg kg-1)"; break;
              case 3: this.ParameterNameAndUnit = "Precipitable Water(kg m-2)"; break;
              case 4: this.ParameterNameAndUnit = "Vapour Pressure(Pa)"; break;
              case 5: this.ParameterNameAndUnit = "Saturation Deficit(Pa)"; break;
              case 6: this.ParameterNameAndUnit = "Evaporation(kg m-2)"; break;
              case 7: this.ParameterNameAndUnit = "Precipitation Rate *(kg m-2 s-1)"; break;
              case 8: this.ParameterNameAndUnit = "Total Precipitation ***(kg m-2)"; break;
              case 9: this.ParameterNameAndUnit = "Large-Scale Precipitation (non-convective) ***(kg m-2)"; break;
              case 10: this.ParameterNameAndUnit = "Convective Precipitation ***(kg m-2)"; break;
              case 11: this.ParameterNameAndUnit = "Snow Depth(m)"; break;
              case 12: this.ParameterNameAndUnit = "Snowfall Rate Water Equivalent *(kg m-2 s-1)"; break;
              case 13: this.ParameterNameAndUnit = "Water Equivalent of Accumulated Snow Depth ***(kg m-2)"; break;
              case 14: this.ParameterNameAndUnit = "Convective Snow ***(kg m-2)"; break;
              case 15: this.ParameterNameAndUnit = "Large-Scale Snow ***(kg m-2)"; break;
              case 16: this.ParameterNameAndUnit = "Snow Melt(kg m-2)"; break;
              case 17: this.ParameterNameAndUnit = "Snow Age(day)"; break;
              case 18: this.ParameterNameAndUnit = "Absolute Humidity(kg m-3)"; break;
              case 19: this.ParameterNameAndUnit = "Precipitation Type(See Table 4.201)"; break;
              case 20: this.ParameterNameAndUnit = "Integrated Liquid Water(kg m-2)"; break;
              case 21: this.ParameterNameAndUnit = "Condensate(kg kg-1)"; break;
              case 22: this.ParameterNameAndUnit = "Cloud Mixing Ratio(kg kg-1)"; break;
              case 23: this.ParameterNameAndUnit = "Ice Water Mixing Ratio(kg kg-1)"; break;
              case 24: this.ParameterNameAndUnit = "Rain Mixing Ratio(kg kg-1)"; break;
              case 25: this.ParameterNameAndUnit = "Snow Mixing Ratio(kg kg-1)"; break;
              case 26: this.ParameterNameAndUnit = "Horizontal Moisture Convergence(kg kg-1 s-1)"; break;
              case 27: this.ParameterNameAndUnit = "Maximum Relative Humidity *(%)"; break;
              case 28: this.ParameterNameAndUnit = "Maximum Absolute Humidity *(kg m-3)"; break;
              case 29: this.ParameterNameAndUnit = "Total Snowfall ***(m)"; break;
              case 30: this.ParameterNameAndUnit = "Precipitable Water Category(See Table 4.202)"; break;
              case 31: this.ParameterNameAndUnit = "Hail(m)"; break;
              case 32: this.ParameterNameAndUnit = "Graupel(kg kg-1)"; break;
              case 33: this.ParameterNameAndUnit = "Categorical Rain(Code table 4.222)"; break;
              case 34: this.ParameterNameAndUnit = "Categorical Freezing Rain(Code table 4.222)"; break;
              case 35: this.ParameterNameAndUnit = "Categorical Ice Pellets(Code table 4.222)"; break;
              case 36: this.ParameterNameAndUnit = "Categorical Snow(Code table 4.222)"; break;
              case 37: this.ParameterNameAndUnit = "Convective Precipitation Rate(kg m-2 s-1)"; break;
              case 38: this.ParameterNameAndUnit = "Horizontal Moisture Divergence(kg kg-1 s-1)"; break;
              case 39: this.ParameterNameAndUnit = "Percent frozen precipitation(%)"; break;
              case 40: this.ParameterNameAndUnit = "Potential Evaporation(kg m-2)"; break;
              case 41: this.ParameterNameAndUnit = "Potential Evaporation Rate(W m-2)"; break;
              case 42: this.ParameterNameAndUnit = "Snow Cover(%)"; break;
              case 43: this.ParameterNameAndUnit = "Rain Fraction of Total Cloud Water(Proportion)"; break;
              case 44: this.ParameterNameAndUnit = "Rime Factor(Numeric)"; break;
              case 45: this.ParameterNameAndUnit = "Total Column Integrated Rain(kg m-2)"; break;
              case 46: this.ParameterNameAndUnit = "Total Column Integrated Snow(kg m-2)"; break;
              case 47: this.ParameterNameAndUnit = "Large Scale Water Precipitation (Non-Convective) ***(kg m-2)"; break;
              case 48: this.ParameterNameAndUnit = "Convective Water Precipitation ***(kg m-2)"; break;
              case 49: this.ParameterNameAndUnit = "Total Water Precipitation ***(kg m-2)"; break;
              case 50: this.ParameterNameAndUnit = "Total Snow Precipitation ***(kg m-2)"; break;
              case 51: this.ParameterNameAndUnit = "Total Column Water (Vertically integrated total water (vapour+cloud water/ice)(kg m-2)"; break;
              case 52: this.ParameterNameAndUnit = "Total Precipitation Rate **(kg m-2 s-1)"; break;
              case 53: this.ParameterNameAndUnit = "Total Snowfall Rate Water Equivalent **(kg m-2 s-1)"; break;
              case 54: this.ParameterNameAndUnit = "Large Scale Precipitation Rate(kg m-2 s-1)"; break;
              case 55: this.ParameterNameAndUnit = "Convective Snowfall Rate Water Equivalent(kg m-2 s-1)"; break;
              case 56: this.ParameterNameAndUnit = "Large Scale Snowfall Rate Water Equivalent(kg m-2 s-1)"; break;
              case 57: this.ParameterNameAndUnit = "Total Snowfall Rate(m s-1)"; break;
              case 58: this.ParameterNameAndUnit = "Convective Snowfall Rate(m s-1)"; break;
              case 59: this.ParameterNameAndUnit = "Large Scale Snowfall Rate(m s-1)"; break;
              case 60: this.ParameterNameAndUnit = "Snow Depth Water Equivalent(kg m-2)"; break;
              case 61: this.ParameterNameAndUnit = "Snow Density(kg m-3)"; break;
              case 62: this.ParameterNameAndUnit = "Snow Evaporation(kg m-2)"; break;
              case 64: this.ParameterNameAndUnit = "Total Column Integrated Water Vapour(kg m-2)"; break;
              case 65: this.ParameterNameAndUnit = "Rain Precipitation Rate(kg m-2 s-1)"; break;
              case 66: this.ParameterNameAndUnit = "Snow Precipitation Rate(kg m-2 s-1)"; break;
              case 67: this.ParameterNameAndUnit = "Freezing Rain Precipitation Rate(kg m-2 s-1)"; break;
              case 68: this.ParameterNameAndUnit = "Ice Pellets Precipitation Rate(kg m-2 s-1)"; break;
              case 69: this.ParameterNameAndUnit = "Total Column Integrate Cloud Water(kg m-2)"; break;
              case 70: this.ParameterNameAndUnit = "Total Column Integrate Cloud Ice(kg m-2)"; break;
              case 71: this.ParameterNameAndUnit = "Hail Mixing Ratio(kg kg-1)"; break;
              case 72: this.ParameterNameAndUnit = "Total Column Integrate Hail(kg m-2)"; break;
              case 73: this.ParameterNameAndUnit = "Hail Prepitation Rate(kg m-2 s-1)"; break;
              case 74: this.ParameterNameAndUnit = "Total Column Integrate Graupel(kg m-2)"; break;
              case 75: this.ParameterNameAndUnit = "Graupel (Snow Pellets) Prepitation Rate(kg m-2 s-1)"; break;
              case 76: this.ParameterNameAndUnit = "Convective Rain Rate(kg m-2 s-1)"; break;
              case 77: this.ParameterNameAndUnit = "Large Scale Rain Rate(kg m-2 s-1)"; break;
              case 78: this.ParameterNameAndUnit = "Total Column Integrate Water (All components including precipitation)(kg m-2)"; break;
              case 79: this.ParameterNameAndUnit = "Evaporation Rate(kg m-2 s-1)"; break;
              case 80: this.ParameterNameAndUnit = "Total Condensatea(kg kg-1)"; break;
              case 81: this.ParameterNameAndUnit = "Total Column-Integrate Condensate(kg m-2)"; break;
              case 82: this.ParameterNameAndUnit = "Cloud Ice Mixing Ratio(kg kg-1)"; break;
              case 83: this.ParameterNameAndUnit = "Specific Cloud Liquid Water Content(kg kg-1)"; break;
              case 84: this.ParameterNameAndUnit = "Specific Cloud Ice Water Content(kg kg-1)"; break;
              case 85: this.ParameterNameAndUnit = "Specific Rain Water Content(kg kg-1)"; break;
              case 86: this.ParameterNameAndUnit = "Specific Snow Water Content(kg kg-1)"; break;
              case 90: this.ParameterNameAndUnit = "Total Kinematic Moisture Flux(kg kg-1 m s-1)"; break;
              case 91: this.ParameterNameAndUnit = "U-component (zonal) Kinematic Moisture Flux(kg kg-1 m s-1)"; break;
              case 92: this.ParameterNameAndUnit = "V-component (meridional) Kinematic Moisture Flux(kg kg-1 m s-1)"; break;
              case 192: this.ParameterNameAndUnit = "Categorical Rain(Code table 4.222)"; break;
              case 193: this.ParameterNameAndUnit = "Categorical Freezing Rain(Code table 4.222)"; break;
              case 194: this.ParameterNameAndUnit = "Categorical Ice Pellets(Code table 4.222)"; break;
              case 195: this.ParameterNameAndUnit = "Categorical Snow(Code table 4.222)"; break;
              case 196: this.ParameterNameAndUnit = "Convective Precipitation Rate(kg m-2 s-1)"; break;
              case 197: this.ParameterNameAndUnit = "Horizontal Moisture Divergence(kg kg-1 s-1)"; break;
              case 198: this.ParameterNameAndUnit = "Minimum Relative Humidity(%)"; break;
              case 199: this.ParameterNameAndUnit = "Potential Evaporation(kg m-2)"; break;
              case 200: this.ParameterNameAndUnit = "Potential Evaporation Rate(W m-2)"; break;
              case 201: this.ParameterNameAndUnit = "Snow Cover(%)"; break;
              case 202: this.ParameterNameAndUnit = "Rain Fraction of Total Liquid Water(non-dim)"; break;
              case 203: this.ParameterNameAndUnit = "Rime Factor(non-dim)"; break;
              case 204: this.ParameterNameAndUnit = "Total Column Integrated Rain(kg m-2)"; break;
              case 205: this.ParameterNameAndUnit = "Total Column Integrated Snow(kg m-2)"; break;
              case 206: this.ParameterNameAndUnit = "Total Icing Potential Diagnostic(non-dim)"; break;
              case 207: this.ParameterNameAndUnit = "Number concentration for ice particles(non-dim)"; break;
              case 208: this.ParameterNameAndUnit = "Snow temperature(K)"; break;
              case 209: this.ParameterNameAndUnit = "Total column-integrated supercooled liquid water(kg m-2)"; break;
              case 210: this.ParameterNameAndUnit = "Total column-integrated melting ice(kg m-2)"; break;
              case 211: this.ParameterNameAndUnit = "Evaporation - Precipitation(cm/day)"; break;
              case 212: this.ParameterNameAndUnit = "Sublimation (evaporation from snow)(W m-2)"; break;
              case 213: this.ParameterNameAndUnit = "Deep Convective Moistening Rate(kg kg-1 s-1)"; break;
              case 214: this.ParameterNameAndUnit = "Shallow Convective Moistening Rate(kg kg-1 s-1)"; break;
              case 215: this.ParameterNameAndUnit = "Vertical Diffusion Moistening Rate(kg kg-1 s-1)"; break;
              case 216: this.ParameterNameAndUnit = "Condensation Pressure of Parcali Lifted From Indicate Surface(Pa)"; break;
              case 217: this.ParameterNameAndUnit = "Large scale moistening rate(kg kg-1 s-1)"; break;
              case 218: this.ParameterNameAndUnit = "Specific humidity at top of viscous sublayer(kg kg-1)"; break;
              case 219: this.ParameterNameAndUnit = "Maximum specific humidity at 2m(kg kg-1)"; break;
              case 220: this.ParameterNameAndUnit = "Minimum specific humidity at 2m(kg kg-1)"; break;
              case 221: this.ParameterNameAndUnit = "Liquid precipitation (Rainfall)(kg m-2)"; break;
              case 222: this.ParameterNameAndUnit = "Snow temperature, depth-avg(K)"; break;
              case 223: this.ParameterNameAndUnit = "Total precipitation (nearest grid point)(kg m-2)"; break;
              case 224: this.ParameterNameAndUnit = "Convective precipitation (nearest grid point)(kg m-2)"; break;
              case 225: this.ParameterNameAndUnit = "Freezing Rain(kg m-2)"; break;
              case 226: this.ParameterNameAndUnit = "Predominant Weather(Numeric (See note 1))"; break;
              case 227: this.ParameterNameAndUnit = "Frozen Rain(kg m-2)"; break;
              case 241: this.ParameterNameAndUnit = "Total Snow(kg m-2)"; break;
              case 242: this.ParameterNameAndUnit = "Relative Humidity with Respect to Precipitable Water(%)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 2) { // Momentum
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Wind Direction (from which blowing)(true)"; break;
              case 1: this.ParameterNameAndUnit = "Wind Speed(m s-1)"; break;
              case 2: this.ParameterNameAndUnit = "U-Component of Wind(m s-1)"; break;
              case 3: this.ParameterNameAndUnit = "V-Component of Wind(m s-1)"; break;
              case 4: this.ParameterNameAndUnit = "Stream Function(m2 s-1)"; break;
              case 5: this.ParameterNameAndUnit = "Velocity Potential(m2 s-1)"; break;
              case 6: this.ParameterNameAndUnit = "Montgomery Stream Function(m2 s-2)"; break;
              case 7: this.ParameterNameAndUnit = "Sigma Coordinate Vertical Velocity(s-1)"; break;
              case 8: this.ParameterNameAndUnit = "Vertical Velocity (Pressure)(Pa s-1)"; break;
              case 9: this.ParameterNameAndUnit = "Vertical Velocity (Geometric)(m s-1)"; break;
              case 10: this.ParameterNameAndUnit = "Absolute Vorticity(s-1)"; break;
              case 11: this.ParameterNameAndUnit = "Absolute Divergence(s-1)"; break;
              case 12: this.ParameterNameAndUnit = "Relative Vorticity(s-1)"; break;
              case 13: this.ParameterNameAndUnit = "Relative Divergence(s-1)"; break;
              case 14: this.ParameterNameAndUnit = "Potential Vorticity(K m2 kg-1 s-1)"; break;
              case 15: this.ParameterNameAndUnit = "Vertical U-Component Shear(s-1)"; break;
              case 16: this.ParameterNameAndUnit = "Vertical V-Component Shear(s-1)"; break;
              case 17: this.ParameterNameAndUnit = "Momentum Flux, U-Component(N m-2)"; break;
              case 18: this.ParameterNameAndUnit = "Momentum Flux, V-Component(N m-2)"; break;
              case 19: this.ParameterNameAndUnit = "Wind Mixing Energy(J)"; break;
              case 20: this.ParameterNameAndUnit = "Boundary Layer Dissipation(W m-2)"; break;
              case 21: this.ParameterNameAndUnit = "Maximum Wind Speed *(m s-1)"; break;
              case 22: this.ParameterNameAndUnit = "Wind Speed (Gust)(m s-1)"; break;
              case 23: this.ParameterNameAndUnit = "U-Component of Wind (Gust)(m s-1)"; break;
              case 24: this.ParameterNameAndUnit = "V-Component of Wind (Gust)(m s-1)"; break;
              case 25: this.ParameterNameAndUnit = "Vertical Speed Shear(s-1)"; break;
              case 26: this.ParameterNameAndUnit = "Horizontal Momentum Flux(N m-2)"; break;
              case 27: this.ParameterNameAndUnit = "U-Component Storm Motion(m s-1)"; break;
              case 28: this.ParameterNameAndUnit = "V-Component Storm Motion(m s-1)"; break;
              case 29: this.ParameterNameAndUnit = "Drag Coefficient(Numeric)"; break;
              case 30: this.ParameterNameAndUnit = "Frictional Velocity(m s-1)"; break;
              case 31: this.ParameterNameAndUnit = "Turbulent Diffusion Coefficient for Momentum(m2 s-1)"; break;
              case 32: this.ParameterNameAndUnit = "Eta Coordinate Vertical Velocity(s-1)"; break;
              case 33: this.ParameterNameAndUnit = "Wind Fetch(m)"; break;
              case 34: this.ParameterNameAndUnit = "Normal Wind Component **(m s-1)"; break;
              case 35: this.ParameterNameAndUnit = "Tangential Wind Component **(m s-1)"; break;
              case 192: this.ParameterNameAndUnit = "Vertical Speed Shear(s-1)"; break;
              case 193: this.ParameterNameAndUnit = "Horizontal Momentum Flux(N m-2)"; break;
              case 194: this.ParameterNameAndUnit = "U-Component Storm Motion(m s-1)"; break;
              case 195: this.ParameterNameAndUnit = "V-Component Storm Motion(m s-1)"; break;
              case 196: this.ParameterNameAndUnit = "Drag Coefficient(non-dim)"; break;
              case 197: this.ParameterNameAndUnit = "Frictional Velocity(m s-1)"; break;
              case 198: this.ParameterNameAndUnit = "Latitude of U Wind Component of Velocity(deg)"; break;
              case 199: this.ParameterNameAndUnit = "Longitude of U Wind Component of Velocity(deg)"; break;
              case 200: this.ParameterNameAndUnit = "Latitude of V Wind Component of Velocity(deg)"; break;
              case 201: this.ParameterNameAndUnit = "Longitude of V Wind Component of Velocity(deg)"; break;
              case 202: this.ParameterNameAndUnit = "Latitude of Presure Point(deg)"; break;
              case 203: this.ParameterNameAndUnit = "Longitude of Presure Point(deg)"; break;
              case 204: this.ParameterNameAndUnit = "Vertical Eddy Diffusivity Heat exchange(m2 s-1)"; break;
              case 205: this.ParameterNameAndUnit = "Covariance between Meridional and Zonal Components of the wind.(m2 s-2)"; break;
              case 206: this.ParameterNameAndUnit = "Covariance between Temperature and Zonal Components of the wind.(K*m s-1)"; break;
              case 207: this.ParameterNameAndUnit = "Covariance between Temperature and Meridional Components of the wind.(K*m s-1)"; break;
              case 208: this.ParameterNameAndUnit = "Vertical Diffusion Zonal Acceleration(m s-2)"; break;
              case 209: this.ParameterNameAndUnit = "Vertical Diffusion Meridional Acceleration(m s-2)"; break;
              case 210: this.ParameterNameAndUnit = "Gravity wave drag zonal acceleration(m s-2)"; break;
              case 211: this.ParameterNameAndUnit = "Gravity wave drag meridional acceleration(m s-2)"; break;
              case 212: this.ParameterNameAndUnit = "Convective zonal momentum mixing acceleration(m s-2)"; break;
              case 213: this.ParameterNameAndUnit = "Convective meridional momentum mixing acceleration(m s-2)"; break;
              case 214: this.ParameterNameAndUnit = "Tendency of vertical velocity(m s-2)"; break;
              case 215: this.ParameterNameAndUnit = "Omega (Dp/Dt) divide by density(K)"; break;
              case 216: this.ParameterNameAndUnit = "Convective Gravity wave drag zonal acceleration(m s-2)"; break;
              case 217: this.ParameterNameAndUnit = "Convective Gravity wave drag meridional acceleration(m s-2)"; break;
              case 218: this.ParameterNameAndUnit = "Velocity Point Model Surface()"; break;
              case 219: this.ParameterNameAndUnit = "Potential Vorticity (Mass-Weighted)(1/s/m)"; break;
              case 220: this.ParameterNameAndUnit = "Hourly Maximum of Upward Vertical Velocity in the lowest 400hPa(m s-1)"; break;
              case 221: this.ParameterNameAndUnit = "Hourly Maximum of Downward Vertical Velocity in the lowest 400hPa(m s-1)"; break;
              case 222: this.ParameterNameAndUnit = "U Component of Hourly Maximum 10m Wind Speed(m s-1)"; break;
              case 223: this.ParameterNameAndUnit = "V Component of Hourly Maximum 10m Wind Speed(m s-1)"; break;
              case 224: this.ParameterNameAndUnit = "Ventilation Rate(m2 s-1)"; break;

              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 3) { // Mass
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Pressure(Pa)"; break;
              case 1: this.ParameterNameAndUnit = "Pressure Reduced to MSL(Pa)"; break;
              case 2: this.ParameterNameAndUnit = "Pressure Tendency(Pa s-1)"; break;
              case 3: this.ParameterNameAndUnit = "ICAO Standard Atmosphere Reference Height(m)"; break;
              case 4: this.ParameterNameAndUnit = "Geopotential(m2 s-2)"; break;
              case 5: this.ParameterNameAndUnit = "Geopotential Height(gpm)"; break;
              case 6: this.ParameterNameAndUnit = "Geometric Height(m)"; break;
              case 7: this.ParameterNameAndUnit = "Standard Deviation of Height(m)"; break;
              case 8: this.ParameterNameAndUnit = "Pressure Anomaly(Pa)"; break;
              case 9: this.ParameterNameAndUnit = "Geopotential Height Anomaly(gpm)"; break;
              case 10: this.ParameterNameAndUnit = "Density(kg m-3)"; break;
              case 11: this.ParameterNameAndUnit = "Altimeter Setting(Pa)"; break;
              case 12: this.ParameterNameAndUnit = "Thickness(m)"; break;
              case 13: this.ParameterNameAndUnit = "Pressure Altitude(m)"; break;
              case 14: this.ParameterNameAndUnit = "Density Altitude(m)"; break;
              case 15: this.ParameterNameAndUnit = "5-Wave Geopotential Height(gpm)"; break;
              case 16: this.ParameterNameAndUnit = "Zonal Flux of Gravity Wave Stress(N m-2)"; break;
              case 17: this.ParameterNameAndUnit = "Meridional Flux of Gravity Wave Stress(N m-2)"; break;
              case 18: this.ParameterNameAndUnit = "Planetary Boundary Layer Height(m)"; break;
              case 19: this.ParameterNameAndUnit = "5-Wave Geopotential Height Anomaly(gpm)"; break;
              case 20: this.ParameterNameAndUnit = "Standard Deviation of Sub-Grid Scale Orography(m)"; break;
              case 21: this.ParameterNameAndUnit = "Angle of Sub-Grid Scale Orography(rad)"; break;
              case 22: this.ParameterNameAndUnit = "Slope of Sub-Grid Scale Orography(Numeric)"; break;
              case 23: this.ParameterNameAndUnit = "Gravity Wave Dissipation(W m-2)"; break;
              case 24: this.ParameterNameAndUnit = "Anisotropy of Sub-Grid Scale Orography(Numeric)"; break;
              case 25: this.ParameterNameAndUnit = "Natural Logarithm of Pressure in Pa(Numeric)"; break;
              case 26: this.ParameterNameAndUnit = "Exner Pressure(Numeric)"; break;
              case 192: this.ParameterNameAndUnit = "MSLP (Eta model reduction)(Pa)"; break;
              case 193: this.ParameterNameAndUnit = "5-Wave Geopotential Height(gpm)"; break;
              case 194: this.ParameterNameAndUnit = "Zonal Flux of Gravity Wave Stress(N m-2)"; break;
              case 195: this.ParameterNameAndUnit = "Meridional Flux of Gravity Wave Stress(N m-2)"; break;
              case 196: this.ParameterNameAndUnit = "Planetary Boundary Layer Height(m)"; break;
              case 197: this.ParameterNameAndUnit = "5-Wave Geopotential Height Anomaly(gpm)"; break;
              case 198: this.ParameterNameAndUnit = "MSLP (MAPS System Reduction)(Pa)"; break;
              case 199: this.ParameterNameAndUnit = "3-hr pressure tendency (Std. Atmos. Reduction)(Pa s-1)"; break;
              case 200: this.ParameterNameAndUnit = "Pressure of level from which parcel was lifted(Pa)"; break;
              case 201: this.ParameterNameAndUnit = "X-gradient of Log Pressure(m-1)"; break;
              case 202: this.ParameterNameAndUnit = "Y-gradient of Log Pressure(m-1)"; break;
              case 203: this.ParameterNameAndUnit = "X-gradient of Height(m-1)"; break;
              case 204: this.ParameterNameAndUnit = "Y-gradient of Height(m-1)"; break;
              case 205: this.ParameterNameAndUnit = "Layer Thickness(m)"; break;
              case 206: this.ParameterNameAndUnit = "Natural Log of Surface Pressure(ln (kPa))"; break;
              case 207: this.ParameterNameAndUnit = "Convective updraft mass flux(kg m-2 s-1)"; break;
              case 208: this.ParameterNameAndUnit = "Convective downdraft mass flux(kg m-2 s-1)"; break;
              case 209: this.ParameterNameAndUnit = "Convective detrainment mass flux(kg m-2 s-1)"; break;
              case 210: this.ParameterNameAndUnit = "Mass Point Model Surface()"; break;
              case 211: this.ParameterNameAndUnit = "Geopotential Height (nearest grid point)(gpm)"; break;
              case 212: this.ParameterNameAndUnit = "Pressure (nearest grid point)(Pa)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 4) { // Short wave radiation
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Net Short-Wave Radiation Flux (Surface)*(W m-2)"; break;
              case 1: this.ParameterNameAndUnit = "Net Short-Wave Radiation Flux (Top of Atmosphere)*(W m-2)"; break;
              case 2: this.ParameterNameAndUnit = "Short-Wave Radiation Flux*(W m-2)"; break;
              case 3: this.ParameterNameAndUnit = "Global Radiation Flux(W m-2)"; break;
              case 4: this.ParameterNameAndUnit = "Brightness Temperature(K)"; break;
              case 5: this.ParameterNameAndUnit = "Radiance (with respect to wave number)(W m-1 sr-1)"; break;
              case 6: this.ParameterNameAndUnit = "Radiance (with respect to wavelength)(W m-3 sr-1)"; break;
              case 7: this.ParameterNameAndUnit = "Downward Short-Wave Radiation Flux(W m-2)"; break;
              case 8: this.ParameterNameAndUnit = "Upward Short-Wave Radiation Flux(W m-2)"; break;
              case 9: this.ParameterNameAndUnit = "Net Short Wave Radiation Flux(W m-2)"; break;
              case 10: this.ParameterNameAndUnit = "Photosynthetically Active Radiation(W m-2)"; break;
              case 11: this.ParameterNameAndUnit = "Net Short-Wave Radiation Flux, Clear Sky(W m-2)"; break;
              case 12: this.ParameterNameAndUnit = "Downward UV Radiation(W m-2)"; break;
              case 50: this.ParameterNameAndUnit = "UV Index (Under Clear Sky)**(Numeric)"; break;
              case 51: this.ParameterNameAndUnit = "UV Index**(W m-2)"; break;
              case 192: this.ParameterNameAndUnit = "Downward Short-Wave Radiation Flux(W m-2)"; break;
              case 193: this.ParameterNameAndUnit = "Upward Short-Wave Radiation Flux(W m-2)"; break;
              case 194: this.ParameterNameAndUnit = "UV-B Downward Solar Flux(W m-2)"; break;
              case 195: this.ParameterNameAndUnit = "Clear sky UV-B Downward Solar Flux(W m-2)"; break;
              case 196: this.ParameterNameAndUnit = "Clear Sky Downward Solar Flux(W m-2)"; break;
              case 197: this.ParameterNameAndUnit = "Solar Radiative Heating Rate(K s-1)"; break;
              case 198: this.ParameterNameAndUnit = "Clear Sky Upward Solar Flux(W m-2)"; break;
              case 199: this.ParameterNameAndUnit = "Cloud Forcing Net Solar Flux(W m-2)"; break;
              case 200: this.ParameterNameAndUnit = "Visible Beam Downward Solar Flux(W m-2)"; break;
              case 201: this.ParameterNameAndUnit = "Visible Diffuse Downward Solar Flux(W m-2)"; break;
              case 202: this.ParameterNameAndUnit = "Near IR Beam Downward Solar Flux(W m-2)"; break;
              case 203: this.ParameterNameAndUnit = "Near IR Diffuse Downward Solar Flux(W m-2)"; break;
              case 204: this.ParameterNameAndUnit = "Downward Total Radiation Flux(W m-2)"; break;
              case 205: this.ParameterNameAndUnit = "Upward Total Radiation Flux(W m-2)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 5) { // Long wave radiation
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Net Long-Wave Radiation Flux (Surface)*(W m-2)"; break;
              case 1: this.ParameterNameAndUnit = "Net Long-Wave Radiation Flux (Top of Atmosphere)*(W m-2)"; break;
              case 2: this.ParameterNameAndUnit = "Long-Wave Radiation Flux*(W m-2)"; break;
              case 3: this.ParameterNameAndUnit = "Downward Long-Wave Rad. Flux(W m-2)"; break;
              case 4: this.ParameterNameAndUnit = "Upward Long-Wave Rad. Flux(W m-2)"; break;
              case 5: this.ParameterNameAndUnit = "Net Long-Wave Radiation Flux(W m-2)"; break;
              case 6: this.ParameterNameAndUnit = "Net Long-Wave Radiation Flux, Clear Sky(W m-2)"; break;
              case 192: this.ParameterNameAndUnit = "Downward Long-Wave Rad. Flux(W m-2)"; break;
              case 193: this.ParameterNameAndUnit = "Upward Long-Wave Rad. Flux(W m-2)"; break;
              case 194: this.ParameterNameAndUnit = "Long-Wave Radiative Heating Rate(K s-1)"; break;
              case 195: this.ParameterNameAndUnit = "Clear Sky Upward Long Wave Flux(W m-2)"; break;
              case 196: this.ParameterNameAndUnit = "Clear Sky Downward Long Wave Flux(W m-2)"; break;
              case 197: this.ParameterNameAndUnit = "Cloud Forcing Net Long Wave Flux(W m-2)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 6) { // Cloud
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Cloud Ice(kg m-2)"; break;
              case 1: this.ParameterNameAndUnit = "Total Cloud Cover(%)"; break;
              case 2: this.ParameterNameAndUnit = "Convective Cloud Cover(%)"; break;
              case 3: this.ParameterNameAndUnit = "Low Cloud Cover(%)"; break;
              case 4: this.ParameterNameAndUnit = "Medium Cloud Cover(%)"; break;
              case 5: this.ParameterNameAndUnit = "High Cloud Cover(%)"; break;
              case 6: this.ParameterNameAndUnit = "Cloud Water(kg m-2)"; break;
              case 7: this.ParameterNameAndUnit = "Cloud Amount(%)"; break;
              case 8: this.ParameterNameAndUnit = "Cloud Type(See Table 4.203)"; break;
              case 9: this.ParameterNameAndUnit = "Thunderstorm Maximum Tops(m)"; break;
              case 10: this.ParameterNameAndUnit = "Thunderstorm Coverage(See Table 4.204)"; break;
              case 11: this.ParameterNameAndUnit = "Cloud Base(m)"; break;
              case 12: this.ParameterNameAndUnit = "Cloud Top(m)"; break;
              case 13: this.ParameterNameAndUnit = "Ceiling(m)"; break;
              case 14: this.ParameterNameAndUnit = "Non-Convective Cloud Cover(%)"; break;
              case 15: this.ParameterNameAndUnit = "Cloud Work Function(J kg-1)"; break;
              case 16: this.ParameterNameAndUnit = "Convective Cloud Efficiency(Proportion)"; break;
              case 17: this.ParameterNameAndUnit = "Total Condensate *(kg kg-1)"; break;
              case 18: this.ParameterNameAndUnit = "Total Column-Integrated Cloud Water *(kg m-2)"; break;
              case 19: this.ParameterNameAndUnit = "Total Column-Integrated Cloud Ice *(kg m-2)"; break;
              case 20: this.ParameterNameAndUnit = "Total Column-Integrated Condensate *(kg m-2)"; break;
              case 21: this.ParameterNameAndUnit = "Ice fraction of total condensate(Proportion)"; break;
              case 22: this.ParameterNameAndUnit = "Cloud Cover(%)"; break;
              case 23: this.ParameterNameAndUnit = "Cloud Ice Mixing Ratio *(kg kg-1)"; break;
              case 24: this.ParameterNameAndUnit = "Sunshine(Numeric)"; break;
              case 25: this.ParameterNameAndUnit = "Horizontal Extent of Cumulonimbus (CB)(%)"; break;
              case 26: this.ParameterNameAndUnit = "Height of Convective Cloud Base(m)"; break;
              case 27: this.ParameterNameAndUnit = "Height of Convective Cloud Top(m)"; break;
              case 28: this.ParameterNameAndUnit = "Number Concentration of Cloud Droplets(kg-1)"; break;
              case 29: this.ParameterNameAndUnit = "Number Concentration of Cloud Ice(kg-1)"; break;
              case 30: this.ParameterNameAndUnit = "Number Density of Cloud Droplets(m-3)"; break;
              case 31: this.ParameterNameAndUnit = "Number Density of Cloud Ice(m-3)"; break;
              case 32: this.ParameterNameAndUnit = "Fraction of Cloud Cover(Numeric)"; break;
              case 33: this.ParameterNameAndUnit = "Sunshine Duration(s)"; break;
              case 34: this.ParameterNameAndUnit = "Surface Long Wave Effective Total Cloudiness(Numeric)"; break;
              case 35: this.ParameterNameAndUnit = "Surface Short Wave Effective Total Cloudiness(Numeric)"; break;
              case 192: this.ParameterNameAndUnit = "Non-Convective Cloud Cover(%)"; break;
              case 193: this.ParameterNameAndUnit = "Cloud Work Function(J kg-1)"; break;
              case 194: this.ParameterNameAndUnit = "Convective Cloud Efficiency(non-dim)"; break;
              case 195: this.ParameterNameAndUnit = "Total Condensate(kg kg-1)"; break;
              case 196: this.ParameterNameAndUnit = "Total Column-Integrated Cloud Water(kg m-2)"; break;
              case 197: this.ParameterNameAndUnit = "Total Column-Integrated Cloud Ice(kg m-2)"; break;
              case 198: this.ParameterNameAndUnit = "Total Column-Integrated Condensate(kg m-2)"; break;
              case 199: this.ParameterNameAndUnit = "Ice fraction of total condensate(non-dim)"; break;
              case 200: this.ParameterNameAndUnit = "Convective Cloud Mass Flux(Pa s-1)"; break;
              case 201: this.ParameterNameAndUnit = "Sunshine Duration(s)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 7) { // Thermodynamic stability indices
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Parcel Lifted Index (to 500 hPa)(K)"; break;
              case 1: this.ParameterNameAndUnit = "Best Lifted Index (to 500 hPa)(K)"; break;
              case 2: this.ParameterNameAndUnit = "K Index(K)"; break;
              case 3: this.ParameterNameAndUnit = "KO Index(K)"; break;
              case 4: this.ParameterNameAndUnit = "Total Totals Index(K)"; break;
              case 5: this.ParameterNameAndUnit = "Sweat Index(Numeric)"; break;
              case 6: this.ParameterNameAndUnit = "Convective Available Potential Energy(J kg-1)"; break;
              case 7: this.ParameterNameAndUnit = "Convective Inhibition(J kg-1)"; break;
              case 8: this.ParameterNameAndUnit = "Storm Relative Helicity(m2 s-2)"; break;
              case 9: this.ParameterNameAndUnit = "Energy Helicity Index(Numeric)"; break;
              case 10: this.ParameterNameAndUnit = "Surface Lifted Index(K)"; break;
              case 11: this.ParameterNameAndUnit = "Best (4 layer) Lifted Index(K)"; break;
              case 12: this.ParameterNameAndUnit = "Richardson Number(Numeric)"; break;
              case 13: this.ParameterNameAndUnit = "Showalter Index(K)"; break;
              case 15: this.ParameterNameAndUnit = "Updraft Helicity(m2 s-2)"; break;
              case 192: this.ParameterNameAndUnit = "Surface Lifted Index(K)"; break;
              case 193: this.ParameterNameAndUnit = "Best (4 layer) Lifted Index(K)"; break;
              case 194: this.ParameterNameAndUnit = "Richardson Number(Numeric)"; break;
              case 195: this.ParameterNameAndUnit = "Convective Weather Detection Index()"; break;
              case 196: this.ParameterNameAndUnit = "Ultra Violet Index(W m-2)"; break;
              case 197: this.ParameterNameAndUnit = "Updraft Helicity(m2 s-2)"; break;
              case 198: this.ParameterNameAndUnit = "Leaf Area Index()"; break;
              case 199: this.ParameterNameAndUnit = "Hourly Maximum of Updraft Helicity over Layer 2km to 5 km AGL(m2 s-2)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 13) { // Aerosols
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Aerosol Type(See Table 4.205)"; break;
              case 192: this.ParameterNameAndUnit = "Particulate matter (coarse)(g m-3)"; break;
              case 193: this.ParameterNameAndUnit = "Particulate matter (fine)(g m-3)"; break;
              case 194: this.ParameterNameAndUnit = "Particulate matter (fine)(log10 (g m-3))"; break;
              case 195: this.ParameterNameAndUnit = "Integrated column particulate matter (fine)(log10 (g m-3))"; break;

              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 14) { // Trace gases
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Total Ozone(DU)"; break;
              case 1: this.ParameterNameAndUnit = "Ozone Mixing Ratio(kg kg-1)"; break;
              case 2: this.ParameterNameAndUnit = "Total Column Integrated Ozone(DU)"; break;
              case 192: this.ParameterNameAndUnit = "Ozone Mixing Ratio(kg kg-1)"; break;
              case 193: this.ParameterNameAndUnit = "Ozone Concentration(ppb)"; break;
              case 194: this.ParameterNameAndUnit = "Categorical Ozone Concentration(Non-Dim)"; break;
              case 195: this.ParameterNameAndUnit = "Ozone Vertical Diffusion(kg kg-1 s-1)"; break;
              case 196: this.ParameterNameAndUnit = "Ozone Production(kg kg-1 s-1)"; break;
              case 197: this.ParameterNameAndUnit = "Ozone Tendency(kg kg-1 s-1)"; break;
              case 198: this.ParameterNameAndUnit = "Ozone Production from Temperature Term(kg kg-1 s-1)"; break;
              case 199: this.ParameterNameAndUnit = "Ozone Production from Column Ozone Term(kg kg-1 s-1)"; break;
              case 200: this.ParameterNameAndUnit = "Ozone Daily Max from 1-hour Average(ppbV)"; break;
              case 201: this.ParameterNameAndUnit = "Ozone Daily Max from 8-hour Average(ppbV)"; break;
              case 202: this.ParameterNameAndUnit = "PM 2.5 Daily Max from 1-hour Average(g m-3)"; break;
              case 203: this.ParameterNameAndUnit = "PM 2.5 Daily Max from 24-hour Average(g m-3)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 15) { // Radar
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Base Spectrum Width(m s-1)"; break;
              case 1: this.ParameterNameAndUnit = "Base Reflectivity(dB)"; break;
              case 2: this.ParameterNameAndUnit = "Base Radial Velocity(m s-1)"; break;
              case 3: this.ParameterNameAndUnit = "Vertically-Integrated Liquid Water(kg m-2)"; break;
              case 4: this.ParameterNameAndUnit = "Layer Maximum Base Reflectivity(dB)"; break;
              case 5: this.ParameterNameAndUnit = "Precipitation(kg m-2)"; break;
              case 6: this.ParameterNameAndUnit = "Radar Spectra (1)()"; break;
              case 7: this.ParameterNameAndUnit = "Radar Spectra (2)()"; break;
              case 8: this.ParameterNameAndUnit = "Radar Spectra (3)()"; break;
              case 9: this.ParameterNameAndUnit = "Reflectivity of Cloud Droplets(dB)"; break;
              case 10: this.ParameterNameAndUnit = "Reflectivity of Cloud Ice(dB)"; break;
              case 11: this.ParameterNameAndUnit = "Reflectivity of Snow(dB)"; break;
              case 12: this.ParameterNameAndUnit = "Reflectivity of Rain(dB)"; break;
              case 13: this.ParameterNameAndUnit = "Reflectivity of Graupel(dB)"; break;
              case 14: this.ParameterNameAndUnit = "Reflectivity of Hail(dB)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 16) { // Forecast Radar Imagery
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Equivalent radar reflectivity factor for rain(m m6 m-3)"; break;
              case 1: this.ParameterNameAndUnit = "Equivalent radar reflectivity factor for snow(m m6 m-3)"; break;
              case 2: this.ParameterNameAndUnit = "Equivalent radar reflectivity factor for parameterized convection(m m6 m-3)"; break;
              case 3: this.ParameterNameAndUnit = "Echo Top (See Note 1)(m)"; break;
              case 4: this.ParameterNameAndUnit = "Reflectivity(dB)"; break;
              case 5: this.ParameterNameAndUnit = "Composite reflectivity(dB)"; break;
              case 192: this.ParameterNameAndUnit = "Equivalent radar reflectivity factor for rain(m m6 m-3)"; break;
              case 193: this.ParameterNameAndUnit = "Equivalent radar reflectivity factor for snow(m m6 m-3)"; break;
              case 194: this.ParameterNameAndUnit = "Equivalent radar reflectivity factor for parameterized convection(m m6 m-3)"; break;
              case 195: this.ParameterNameAndUnit = "Reflectivity(dB)"; break;
              case 196: this.ParameterNameAndUnit = "Composite reflectivity(dB)"; break;
              case 197: this.ParameterNameAndUnit = "Echo Top (See Note 1)(m)"; break;
              case 198: this.ParameterNameAndUnit = "Hourly Maximum of Simulated Reflectivity at 1 km AGL(dB)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }

          else if (this.CategoryOfParametersByProductDiscipline == 17) { // Electrodynamics
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 192: this.ParameterNameAndUnit = "Lightning(non-dim)"; break;

              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 18) { // Nuclear/radiology
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Air Concentration of Caesium 137(Bq m-3)"; break;
              case 1: this.ParameterNameAndUnit = "Air Concentration of Iodine 131(Bq m-3)"; break;
              case 2: this.ParameterNameAndUnit = "Air Concentration of Radioactive Pollutant(Bq m-3)"; break;
              case 3: this.ParameterNameAndUnit = "Ground Deposition of Caesium 137(Bq m-2)"; break;
              case 4: this.ParameterNameAndUnit = "Ground Deposition of Iodine 131(Bq m-2)"; break;
              case 5: this.ParameterNameAndUnit = "Ground Deposition of Radioactive Pollutant(Bq m-2)"; break;
              case 6: this.ParameterNameAndUnit = "Time Integrated Air Concentration of Cesium Pollutant See Note 1(Bq s m-3)"; break;
              case 7: this.ParameterNameAndUnit = "Time Integrated Air Concentration of Iodine Pollutant See Note 1(Bq s m-3)"; break;
              case 8: this.ParameterNameAndUnit = "Time Integrated Air Concentration of Radioactive Pollutant See Note 1(Bq s m-3)"; break;
              case 10: this.ParameterNameAndUnit = "Air Concentration(Bq m-3)"; break;
              case 11: this.ParameterNameAndUnit = "Wet Deposition(Bq m-2)"; break;
              case 12: this.ParameterNameAndUnit = "Dry Deposition(Bq m-2)"; break;
              case 13: this.ParameterNameAndUnit = "Total Deposition (Wet + Dry)(Bq m-2)"; break;

              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 19) { // Physical atmospheric Properties
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Visibility(m)"; break;
              case 1: this.ParameterNameAndUnit = "Albedo(%)"; break;
              case 2: this.ParameterNameAndUnit = "Thunderstorm Probability(%)"; break;
              case 3: this.ParameterNameAndUnit = "Mixed Layer Depth(m)"; break;
              case 4: this.ParameterNameAndUnit = "Volcanic Ash(See Table 4.206)"; break;
              case 5: this.ParameterNameAndUnit = "Icing Top(m)"; break;
              case 6: this.ParameterNameAndUnit = "Icing Base(m)"; break;
              case 7: this.ParameterNameAndUnit = "Icing(See Table 4.207)"; break;
              case 8: this.ParameterNameAndUnit = "Turbulence Top(m)"; break;
              case 9: this.ParameterNameAndUnit = "Turbulence Base(m)"; break;
              case 10: this.ParameterNameAndUnit = "Turbulence(See Table 4.208)"; break;
              case 11: this.ParameterNameAndUnit = "Turbulent Kinetic Energy(J kg-1)"; break;
              case 12: this.ParameterNameAndUnit = "Planetary Boundary Layer Regime(See Table 4.209)"; break;
              case 13: this.ParameterNameAndUnit = "Contrail Intensity(See Table 4.210)"; break;
              case 14: this.ParameterNameAndUnit = "Contrail Engine Type(See Table 4.211)"; break;
              case 15: this.ParameterNameAndUnit = "Contrail Top(m)"; break;
              case 16: this.ParameterNameAndUnit = "Contrail Base(m)"; break;
              case 17: this.ParameterNameAndUnit = "Maximum Snow Albedosee Note 1(%)"; break;
              case 18: this.ParameterNameAndUnit = "Snow-Free Albedo(%)"; break;
              case 19: this.ParameterNameAndUnit = "Snow Albedo(%)"; break;
              case 20: this.ParameterNameAndUnit = "Icing(%)"; break;
              case 21: this.ParameterNameAndUnit = "In-Cloud Turbulence(%)"; break;
              case 22: this.ParameterNameAndUnit = "Clear Air Turbulence (CAT)(%)"; break;
              case 23: this.ParameterNameAndUnit = "Supercooled Large Droplet Probabilitysee Note 2(%)"; break;
              case 24: this.ParameterNameAndUnit = "Convective Turbulent Kinetic Energy(J kg-1)"; break;
              case 25: this.ParameterNameAndUnit = "Weather(See Table 4.225)"; break;
              case 26: this.ParameterNameAndUnit = "Convective Outlook(See Table 4.224)"; break;
              case 27: this.ParameterNameAndUnit = "Icing Scenario(See Table 4.227)"; break;
              case 192: this.ParameterNameAndUnit = "Maximum Snow Albedo(%)"; break;
              case 193: this.ParameterNameAndUnit = "Snow-Free Albedo(%)"; break;
              case 194: this.ParameterNameAndUnit = "Slight risk convective outlook(categorical)"; break;
              case 195: this.ParameterNameAndUnit = "Moderate risk convective outlook(categorical)"; break;
              case 196: this.ParameterNameAndUnit = "High risk convective outlook(categorical)"; break;
              case 197: this.ParameterNameAndUnit = "Tornado probability(%)"; break;
              case 198: this.ParameterNameAndUnit = "Hail probability(%)"; break;
              case 199: this.ParameterNameAndUnit = "Wind probability(%)"; break;
              case 200: this.ParameterNameAndUnit = "Significant Tornado probability(%)"; break;
              case 201: this.ParameterNameAndUnit = "Significant Hail probability(%)"; break;
              case 202: this.ParameterNameAndUnit = "Significant Wind probability(%)"; break;
              case 203: this.ParameterNameAndUnit = "Categorical Thunderstorm(Code table 4.222)"; break;
              case 204: this.ParameterNameAndUnit = "Number of mixed layers next to surface(integer)"; break;
              case 205: this.ParameterNameAndUnit = "Flight Category()"; break;
              case 206: this.ParameterNameAndUnit = "Confidence - Ceiling()"; break;
              case 207: this.ParameterNameAndUnit = "Confidence - Visibility()"; break;
              case 208: this.ParameterNameAndUnit = "Confidence - Flight Category()"; break;
              case 209: this.ParameterNameAndUnit = "Low-Level aviation interest()"; break;
              case 210: this.ParameterNameAndUnit = "High-Level aviation interest()"; break;
              case 211: this.ParameterNameAndUnit = "Visible, Black Sky Albedo(%)"; break;
              case 212: this.ParameterNameAndUnit = "Visible, White Sky Albedo(%)"; break;
              case 213: this.ParameterNameAndUnit = "Near IR, Black Sky Albedo(%)"; break;
              case 214: this.ParameterNameAndUnit = "Near IR, White Sky Albedo(%)"; break;
              case 215: this.ParameterNameAndUnit = "Total Probability of Severe Thunderstorms (Days 2,3)(%)"; break;
              case 216: this.ParameterNameAndUnit = "Total Probability of Extreme Severe Thunderstorms (Days 2,3)(%)"; break;
              case 217: this.ParameterNameAndUnit = "Supercooled Large Droplet (SLD) Icingsee Note 2(See Table 4.207)"; break;
              case 218: this.ParameterNameAndUnit = "Radiative emissivity()"; break;
              case 219: this.ParameterNameAndUnit = "Turbulence Potential Forecast Index()"; break;
              case 220: this.ParameterNameAndUnit = "Categorical Severe Thunderstorm(Code table 4.222)"; break;
              case 221: this.ParameterNameAndUnit = "Probability of Convection(%)"; break;
              case 222: this.ParameterNameAndUnit = "Convection Potential(Code table 4.222)"; break;
              case 232: this.ParameterNameAndUnit = "Volcanic Ash Forecast Transport and Dispersion(log10 (kg m-3))"; break;
              case 233: this.ParameterNameAndUnit = "Icing probability(non-dim)"; break;
              case 234: this.ParameterNameAndUnit = "Icing severity(non-dim)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 20) { // Atmospheric Chemical Constituents
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Mass Density (Concentration)(kg m-3)"; break;
              case 1: this.ParameterNameAndUnit = "Column-Integrated Mass Density (See Note 1)(kg m-2)"; break;
              case 2: this.ParameterNameAndUnit = "Mass Mixing Ratio (Mass Fraction in Air)(kg kg-1)"; break;
              case 3: this.ParameterNameAndUnit = ">Atmosphere Emission Mass Flux(kg m-2s-1)"; break;
              case 4: this.ParameterNameAndUnit = "Atmosphere Net Production Mass Flux(kg m-2s-1)"; break;
              case 5: this.ParameterNameAndUnit = ">Atmosphere Net Production And Emision Mass Flux(kg m-2s-1)"; break;
              case 6: this.ParameterNameAndUnit = "Surface Dry Deposition Mass Flux(kg m-2s-1)"; break;
              case 7: this.ParameterNameAndUnit = "Surface Wet Deposition Mass Flux(kg m-2s-1)"; break;
              case 8: this.ParameterNameAndUnit = "Atmosphere Re-Emission Mass Flux(kg m-2s-1)"; break;
              case 9: this.ParameterNameAndUnit = "Wet Deposition by Large-Scale Precipitation Mass Flux(kg m-2s-1)"; break;
              case 10: this.ParameterNameAndUnit = "Wet Deposition by Convective Precipitation Mass Flux(kg m-2s-1)"; break;
              case 11: this.ParameterNameAndUnit = "Sedimentation Mass Flux(kg m-2s-1)"; break;
              case 12: this.ParameterNameAndUnit = "Dry Deposition Mass Flux(kg m-2s-1)"; break;
              case 13: this.ParameterNameAndUnit = "Transfer From Hydrophobic to Hydrophilic(kg kg-1s-1)"; break;
              case 14: this.ParameterNameAndUnit = "Transfer From SO2 (Sulphur Dioxide) to SO4 (Sulphate)(kg kg-1s-1)"; break;
              case 50: this.ParameterNameAndUnit = "Amount in Atmosphere(mol)"; break;
              case 51: this.ParameterNameAndUnit = "Concentration In Air(mol m-3)"; break;
              case 52: this.ParameterNameAndUnit = "Volume Mixing Ratio (Fraction in Air)(mol mol-1)"; break;
              case 53: this.ParameterNameAndUnit = "Chemical Gross Production Rate of Concentration(mol m-3s-1)"; break;
              case 54: this.ParameterNameAndUnit = "Chemical Gross Destruction Rate of Concentration(mol m-3s-1)"; break;
              case 55: this.ParameterNameAndUnit = "Surface Flux(mol m-2s-1)"; break;
              case 56: this.ParameterNameAndUnit = "Changes Of Amount in Atmosphere (See Note 1)(mol s-1)"; break;
              case 57: this.ParameterNameAndUnit = "Total Yearly Average Burden of The Atmosphere>(mol)"; break;
              case 58: this.ParameterNameAndUnit = "Total Yearly Average Atmospheric Loss (See Note 1)(mol s-1)"; break;
              case 59: this.ParameterNameAndUnit = "Aerosol Number Concentration(m-3)"; break;
              case 100: this.ParameterNameAndUnit = "Surface Area Density (Aerosol)(m-1)"; break;
              case 101: this.ParameterNameAndUnit = "Vertical Visual Range(m)"; break;
              case 102: this.ParameterNameAndUnit = "Aerosol Optical Thickness(Numeric)"; break;
              case 103: this.ParameterNameAndUnit = "Single Scattering Albedo(Numeric)"; break;
              case 104: this.ParameterNameAndUnit = "Asymmetry Factor(Numeric)"; break;
              case 105: this.ParameterNameAndUnit = "Aerosol Extinction Coefficient(m-1)"; break;
              case 106: this.ParameterNameAndUnit = "Aerosol Absorption Coefficient(m-1)"; break;
              case 107: this.ParameterNameAndUnit = "Aerosol Lidar Backscatter from Satellite(m-1sr-1)"; break;
              case 108: this.ParameterNameAndUnit = "Aerosol Lidar Backscatter from the Ground(m-1sr-1)"; break;
              case 109: this.ParameterNameAndUnit = "Aerosol Lidar Extinction from Satellite(m-1)"; break;
              case 110: this.ParameterNameAndUnit = "Aerosol Lidar Extinction from the Ground(m-1)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 190) { // CCITT IA5 string
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Arbitrary Text String(CCITTIA5)"; break;

              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 191) { // Miscellaneous
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Seconds prior to initial reference time (defined in Section 1)(s)"; break;
              case 1: this.ParameterNameAndUnit = "Geographical Latitude(N)"; break;
              case 2: this.ParameterNameAndUnit = "Geographical Longitude(E)"; break;
              case 192: this.ParameterNameAndUnit = "Latitude (-90 to 90)()"; break;
              case 193: this.ParameterNameAndUnit = "East Longitude (0 to 360)()"; break;
              case 194: this.ParameterNameAndUnit = "Seconds prior to initial reference time(s)"; break;
              case 195: this.ParameterNameAndUnit = "Model Layer number (From bottom up)()"; break;
              case 196: this.ParameterNameAndUnit = "Latitude (nearest neighbor) (-90 to 90)()"; break;
              case 197: this.ParameterNameAndUnit = "East Longitude (nearest neighbor) (0 to 360)()"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 192) { // Covariance
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 1: this.ParameterNameAndUnit = "Covariance between zonal and meridional components of the wind. Defined as [uv]-[u][v], where [] indicates the mean over the indicated time span.(m2/s2)"; break;
              case 2: this.ParameterNameAndUnit = "Covariance between zonal component of the wind and temperature. Defined as [uT]-[u][T], where [] indicates the mean over the indicated time span.(K*m/s)"; break;
              case 3: this.ParameterNameAndUnit = "Covariance between meridional component of the wind and temperature. Defined as [vT]-[v][T], where [] indicates the mean over the indicated time span.(K*m/s)"; break;
              case 4: this.ParameterNameAndUnit = "Covariance between temperature and vertical component of the wind. Defined as [wT]-[w][T], where [] indicates the mean over the indicated time span.(K*m/s)"; break;
              case 5: this.ParameterNameAndUnit = "Covariance between zonal and zonal components of the wind. Defined as [uu]-[u][u], where [] indicates the mean over the indicated time span.(m2/s2)"; break;
              case 6: this.ParameterNameAndUnit = "Covariance between meridional and meridional components of the wind. Defined as [vv]-[v][v], where [] indicates the mean over the indicated time span.(m2/s2)"; break;
              case 7: this.ParameterNameAndUnit = "Covariance between specific humidity and zonal components of the wind. Defined as [uq]-[u][q], where [] indicates the mean over the indicated time span.(kg/kg*m/s)"; break;
              case 8: this.ParameterNameAndUnit = "Covariance between specific humidity and meridional components of the wind. Defined as [vq]-[v][q], where [] indicates the mean over the indicated time span.(kg/kg*m/s)"; break;
              case 9: this.ParameterNameAndUnit = "Covariance between temperature and vertical components of the wind. Defined as [T]-[][T], where [] indicates the mean over the indicated time span.(K*Pa/s)"; break;
              case 10: this.ParameterNameAndUnit = "Covariance between specific humidity and vertical components of the wind. Defined as [q]-[][q], where [] indicates the mean over the indicated time span.(kg/kg*Pa/s)"; break;
              case 11: this.ParameterNameAndUnit = "Covariance between surface pressure and surface pressure. Defined as [Psfc]-[Psfc][Psfc], where [] indicates the mean over the indicated time span.(Pa*Pa)"; break;
              case 12: this.ParameterNameAndUnit = "Covariance between specific humidity and specific humidy. Defined as [qq]-[q][q], where [] indicates the mean over the indicated time span.(kg/kg*kg/kg)"; break;
              case 13: this.ParameterNameAndUnit = "Covariance between vertical and vertical components of the wind. Defined as []-[][], where [] indicates the mean over the indicated time span.(Pa2/s2)"; break;
              case 14: this.ParameterNameAndUnit = "Covariance between temperature and temperature. Defined as [TT]-[T][T], where [] indicates the mean over the indicated time span.(K*K)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
        }
        else if (this.DisciplineOfProcessedData == 1) { // Hydrological
          if (this.CategoryOfParametersByProductDiscipline == 0) { // Hydrology Basic
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Flash Flood Guidance (Encoded as an accumulation over a floating subinterval of time between the reference time and valid time)(kg m-2)"; break;
              case 1: this.ParameterNameAndUnit = "Flash Flood Runoff (Encoded as an accumulation over a floating subinterval of time)(kg m-2)"; break;
              case 2: this.ParameterNameAndUnit = "Remotely Sensed Snow Cover(See Table 4.215)"; break;
              case 3: this.ParameterNameAndUnit = "Elevation of Snow Covered Terrain(See Table 4.216)"; break;
              case 4: this.ParameterNameAndUnit = "Snow Water Equivalent Percent of Normal(%)"; break;
              case 5: this.ParameterNameAndUnit = "Baseflow-Groundwater Runoff(kg m-2)"; break;
              case 6: this.ParameterNameAndUnit = "Storm Surface Runoff(kg m-2)"; break;
              case 192: this.ParameterNameAndUnit = "Baseflow-Groundwater Runoff(kg m-2)"; break;
              case 193: this.ParameterNameAndUnit = "Storm Surface Runoff(kg m-2)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 1) { // Hydrology Probabilities
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Conditional percent precipitation amount fractile for an overall period (encoded as an accumulation)(kg m-2)"; break;
              case 1: this.ParameterNameAndUnit = "Percent Precipitation in a sub-period of an overall period (encoded as a percent accumulation over the sub-period)(%)"; break;
              case 2: this.ParameterNameAndUnit = "Probability of 0.01 inch of precipitation (POP)(%)"; break;
              case 192: this.ParameterNameAndUnit = "Probability of Freezing Precipitation(%)"; break;
              case 193: this.ParameterNameAndUnit = "Probability of Frozen Precipitation(%)"; break;
              case 194: this.ParameterNameAndUnit = "Probability of precipitation exceeding flash flood guidance values(%)"; break;
              case 195: this.ParameterNameAndUnit = "Probability of Wetting Rain, exceeding in 0.10 in a given time period(%)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 2) { // Inland Water and Sediment Properties
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Water Depth(m)"; break;
              case 1: this.ParameterNameAndUnit = "Water Temperature(K)"; break;
              case 2: this.ParameterNameAndUnit = "Water Fraction(Proportion)"; break;
              case 3: this.ParameterNameAndUnit = "Sediment Thickness(m)"; break;
              case 4: this.ParameterNameAndUnit = "Sediment Temperature(K)"; break;
              case 5: this.ParameterNameAndUnit = "Ice Thickness(m)"; break;
              case 6: this.ParameterNameAndUnit = "Ice Temperature(K)"; break;
              case 7: this.ParameterNameAndUnit = "Ice Cover(Proportion)"; break;
              case 8: this.ParameterNameAndUnit = "Land Cover (0=water, 1=land)(Proportion)"; break;
              case 9: this.ParameterNameAndUnit = "Shape Factor with Respect to Salinity Profile()"; break;
              case 10: this.ParameterNameAndUnit = "Shape Factor with Respect to Temperature Profile in Thermocline()"; break;
              case 11: this.ParameterNameAndUnit = "Attenuation Coefficient of Water with Respect to Solar Attenuation Coefficient of Water with Respect to Solar Radiation(m-1)"; break;
              case 12: this.ParameterNameAndUnit = "Salinity(kg kg-1)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
        }
        else if (this.DisciplineOfProcessedData == 2) { // Land surface
          if (this.CategoryOfParametersByProductDiscipline == 0) { // Vegetation/Biomass
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Land Cover (0=sea, 1=land)(Proportion)"; break;
              case 1: this.ParameterNameAndUnit = "Surface Roughness(m)"; break;
              case 2: this.ParameterNameAndUnit = "Soil Temperature ***(K)"; break;
              case 3: this.ParameterNameAndUnit = "Soil Moisture Content*(kg m-2)"; break;
              case 4: this.ParameterNameAndUnit = "Vegetation(%)"; break;
              case 5: this.ParameterNameAndUnit = "Water Runoff(kg m-2)"; break;
              case 6: this.ParameterNameAndUnit = "Evapotranspiration(kg-2 s-1)"; break;
              case 7: this.ParameterNameAndUnit = "Model Terrain Height(m)"; break;
              case 8: this.ParameterNameAndUnit = "Land Use(See Table 4.212)"; break;
              case 9: this.ParameterNameAndUnit = "Volumetric Soil Moisture Content**(Proportion)"; break;
              case 10: this.ParameterNameAndUnit = "Ground Heat Flux*(W m-2)"; break;
              case 11: this.ParameterNameAndUnit = "Moisture Availability(%)"; break;
              case 12: this.ParameterNameAndUnit = "Exchange Coefficient(kg m-2 s-1)"; break;
              case 13: this.ParameterNameAndUnit = "Plant Canopy Surface Water(kg m-2)"; break;
              case 14: this.ParameterNameAndUnit = "Blackadar's Mixing Length Scale(m)"; break;
              case 15: this.ParameterNameAndUnit = "Canopy Conductance(m s-1)"; break;
              case 16: this.ParameterNameAndUnit = "Minimal Stomatal Resistance(s m-1)"; break;
              case 17: this.ParameterNameAndUnit = "Wilting Point*(Proportion)"; break;
              case 18: this.ParameterNameAndUnit = "Solar parameter in canopy conductance(Proportion)"; break;
              case 19: this.ParameterNameAndUnit = "Temperature parameter in canopy(Proportion)"; break;
              case 20: this.ParameterNameAndUnit = "Humidity parameter in canopy conductance(Proportion)"; break;
              case 21: this.ParameterNameAndUnit = "Soil moisture parameter in canopy conductance(Proportion)"; break;
              case 22: this.ParameterNameAndUnit = "Soil Moisture ***(kg m-3)"; break;
              case 23: this.ParameterNameAndUnit = "Column-Integrated Soil Water ***(kg m-2)"; break;
              case 24: this.ParameterNameAndUnit = "Heat Flux(W m-2)"; break;
              case 25: this.ParameterNameAndUnit = "Volumetric Soil Moisture(m3 m-3)"; break;
              case 26: this.ParameterNameAndUnit = "Wilting Point(kg m-3)"; break;
              case 27: this.ParameterNameAndUnit = "Volumetric Wilting Point(m3 m-3)"; break;
              case 28: this.ParameterNameAndUnit = "Leaf Area Index(Numeric)"; break;
              case 29: this.ParameterNameAndUnit = "Evergreen Forest(Numeric)"; break;
              case 30: this.ParameterNameAndUnit = "Deciduous Forest(Numeric)"; break;
              case 31: this.ParameterNameAndUnit = "Normalized Differential Vegetation Index (NDVI)(Numeric)"; break;
              case 32: this.ParameterNameAndUnit = "Root Depth of Vegetation(m)"; break;
              case 192: this.ParameterNameAndUnit = "Volumetric Soil Moisture Content(Fraction)"; break;
              case 193: this.ParameterNameAndUnit = "Ground Heat Flux(W m-2)"; break;
              case 194: this.ParameterNameAndUnit = "Moisture Availability(%)"; break;
              case 195: this.ParameterNameAndUnit = "Exchange Coefficient((kg m-3) (m s-1))"; break;
              case 196: this.ParameterNameAndUnit = "Plant Canopy Surface Water(kg m-2)"; break;
              case 197: this.ParameterNameAndUnit = "Blackadars Mixing Length Scale(m)"; break;
              case 198: this.ParameterNameAndUnit = "Vegetation Type(Integer (0-13))"; break;
              case 199: this.ParameterNameAndUnit = "Canopy Conductance(m s-1)"; break;
              case 200: this.ParameterNameAndUnit = "Minimal Stomatal Resistance(s m-1)"; break;
              case 201: this.ParameterNameAndUnit = "Wilting Point(Fraction)"; break;
              case 202: this.ParameterNameAndUnit = "Solar parameter in canopy conductance(Fraction)"; break;
              case 203: this.ParameterNameAndUnit = "Temperature parameter in canopy conductance(Fraction)"; break;
              case 204: this.ParameterNameAndUnit = "Humidity parameter in canopy conductance(Fraction)"; break;
              case 205: this.ParameterNameAndUnit = "Soil moisture parameter in canopy conductance(Fraction)"; break;
              case 206: this.ParameterNameAndUnit = "Rate of water dropping from canopy to ground()"; break;
              case 207: this.ParameterNameAndUnit = "Ice-free water surface(%)"; break;
              case 208: this.ParameterNameAndUnit = "Surface exchange coefficients for T and Q divided by delta z(m s-1)"; break;
              case 209: this.ParameterNameAndUnit = "Surface exchange coefficients for U and V divided by delta z(m s-1)"; break;
              case 210: this.ParameterNameAndUnit = "Vegetation canopy temperature(K)"; break;
              case 211: this.ParameterNameAndUnit = "Surface water storage(Kg m-2)"; break;
              case 212: this.ParameterNameAndUnit = "Liquid soil moisture content (non-frozen)(Kg m-2)"; break;
              case 213: this.ParameterNameAndUnit = "Open water evaporation (standing water)(W m-2)"; break;
              case 214: this.ParameterNameAndUnit = "Groundwater recharge(Kg m-2)"; break;
              case 215: this.ParameterNameAndUnit = "Flood plain recharge(Kg m-2)"; break;
              case 216: this.ParameterNameAndUnit = "Roughness length for heat(m)"; break;
              case 217: this.ParameterNameAndUnit = "Normalized Difference Vegetation Index()"; break;
              case 218: this.ParameterNameAndUnit = "Land-sea coverage (nearest neighbor) [land=1,sea=0]()"; break;
              case 219: this.ParameterNameAndUnit = "Asymptotic mixing length scale(m)"; break;
              case 220: this.ParameterNameAndUnit = "Water vapor added by precip assimilation(Kg m-2)"; break;
              case 221: this.ParameterNameAndUnit = "Water condensate added by precip assimilation(Kg m-2)"; break;
              case 222: this.ParameterNameAndUnit = "Water Vapor Flux Convergance (Vertical Int)(Kg m-2)"; break;
              case 223: this.ParameterNameAndUnit = "Water Condensate Flux Convergance (Vertical Int)(Kg m-2)"; break;
              case 224: this.ParameterNameAndUnit = "Water Vapor Zonal Flux (Vertical Int)(Kg m-2)"; break;
              case 225: this.ParameterNameAndUnit = "Water Vapor Meridional Flux (Vertical Int)(Kg m-2)"; break;
              case 226: this.ParameterNameAndUnit = "Water Condensate Zonal Flux (Vertical Int)(Kg m-2)"; break;
              case 227: this.ParameterNameAndUnit = "Water Condensate Meridional Flux (Vertical Int)(Kg m-2)"; break;
              case 228: this.ParameterNameAndUnit = "Aerodynamic conductance(m s-1)"; break;
              case 229: this.ParameterNameAndUnit = "Canopy water evaporation(W m-2)"; break;
              case 230: this.ParameterNameAndUnit = "Transpiration(W m-2)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 1) { // Agricultural/aquacultural special products
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 192: this.ParameterNameAndUnit = "Cold Advisory for Newborn Livestock()"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 3) { // Soil
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Soil Type(See Table 4.213)"; break;
              case 1: this.ParameterNameAndUnit = "Upper Layer Soil Temperature*(K)"; break;
              case 2: this.ParameterNameAndUnit = "Upper Layer Soil Moisture*(kg m-3)"; break;
              case 3: this.ParameterNameAndUnit = "Lower Layer Soil Moisture*(kg m-3)"; break;
              case 4: this.ParameterNameAndUnit = "Bottom Layer Soil Temperature*(K)"; break;
              case 5: this.ParameterNameAndUnit = "Liquid Volumetric Soil Moisture (non-frozen)**(Proportion)"; break;
              case 6: this.ParameterNameAndUnit = "Number of Soil Layers in Root Zone(Numeric)"; break;
              case 7: this.ParameterNameAndUnit = "Transpiration Stress-onset (soil moisture)**(Proportion)"; break;
              case 8: this.ParameterNameAndUnit = "Direct Evaporation Cease (soil moisture)**(Proportion)"; break;
              case 9: this.ParameterNameAndUnit = "Soil Porosity**(Proportion)"; break;
              case 10: this.ParameterNameAndUnit = "Liquid Volumetric Soil Moisture (Non-Frozen)(m3 m-3)"; break;
              case 11: this.ParameterNameAndUnit = "Volumetric Transpiration Stree-Onset(Soil Moisture)(m3 m-3)"; break;
              case 12: this.ParameterNameAndUnit = "Transpiration Stree-Onset(Soil Moisture)(kg m-3)"; break;
              case 13: this.ParameterNameAndUnit = "Volumetric Direct Evaporation Cease(Soil Moisture)(m3 m-3)"; break;
              case 14: this.ParameterNameAndUnit = "Direct Evaporation Cease(Soil Moisture)(kg m-3)"; break;
              case 15: this.ParameterNameAndUnit = "Soil Porosity(m3 m-3)"; break;
              case 16: this.ParameterNameAndUnit = "Volumetric Saturation Of Soil Moisture(m3 m-3)"; break;
              case 17: this.ParameterNameAndUnit = "Saturation Of Soil Moisture(kg m-3)"; break;
              case 18: this.ParameterNameAndUnit = "Soil Temperature(K)"; break;
              case 19: this.ParameterNameAndUnit = "Soil Moisture(kg m-3)"; break;
              case 20: this.ParameterNameAndUnit = "Column-Integrated Soil Moisture(kg m-2)"; break;
              case 21: this.ParameterNameAndUnit = "Soil Ice(kg m-3)"; break;
              case 22: this.ParameterNameAndUnit = "Column-Integrated Soil Ice(kg m-2)"; break;
              case 192: this.ParameterNameAndUnit = "Liquid Volumetric Soil Moisture (non Frozen)(Proportion)"; break;
              case 193: this.ParameterNameAndUnit = "Number of Soil Layers in Root Zone(non-dim)"; break;
              case 194: this.ParameterNameAndUnit = "Surface Slope Type(Index)"; break;
              case 195: this.ParameterNameAndUnit = "Transpiration Stress-onset (soil moisture)(Proportion)"; break;
              case 196: this.ParameterNameAndUnit = "Direct Evaporation Cease (soil moisture)(Proportion)"; break;
              case 197: this.ParameterNameAndUnit = "Soil Porosity(Proportion)"; break;
              case 198: this.ParameterNameAndUnit = "Direct Evaporation from Bare Soil(W m-2)"; break;
              case 199: this.ParameterNameAndUnit = "Land Surface Precipitation Accumulation(kg m-2)"; break;
              case 200: this.ParameterNameAndUnit = "Bare Soil Surface Skin temperature(K)"; break;
              case 201: this.ParameterNameAndUnit = "Average Surface Skin Temperature(K)"; break;
              case 202: this.ParameterNameAndUnit = "Effective Radiative Skin Temperature(K)"; break;
              case 203: this.ParameterNameAndUnit = "Field Capacity(Fraction)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 4) { // Fire Weather
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Fire Outlook(See Table 4.224)"; break;
              case 1: this.ParameterNameAndUnit = "Fire Outlook Due to Dry Thunderstorm(See Table 4.224)"; break;
              case 2: this.ParameterNameAndUnit = "Haines Index(Numeric)"; break;
              case 3: this.ParameterNameAndUnit = "Fire Burned Area(%)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
        }
        else if (this.DisciplineOfProcessedData == 3) { // Space
          if (this.CategoryOfParametersByProductDiscipline == 0) { // Image format
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Scaled Radiance(Numeric)"; break;
              case 1: this.ParameterNameAndUnit = "Scaled Albedo(Numeric)"; break;
              case 2: this.ParameterNameAndUnit = "Scaled Brightness Temperature(Numeric)"; break;
              case 3: this.ParameterNameAndUnit = "Scaled Precipitable Water(Numeric)"; break;
              case 4: this.ParameterNameAndUnit = "Scaled Lifted Index(Numeric)"; break;
              case 5: this.ParameterNameAndUnit = "Scaled Cloud Top Pressure(Numeric)"; break;
              case 6: this.ParameterNameAndUnit = "Scaled Skin Temperature(Numeric)"; break;
              case 7: this.ParameterNameAndUnit = "Cloud Mask(See Table 4.217)"; break;
              case 8: this.ParameterNameAndUnit = "Pixel scene type(See Table 4.218)"; break;
              case 9: this.ParameterNameAndUnit = "Fire Detection Indicator(See Table 4.223)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 1) { // Quantitative
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Estimated Precipitation(kg m-2)"; break;
              case 1: this.ParameterNameAndUnit = "Instantaneous Rain Rate(kg m-2 s-1)"; break;
              case 2: this.ParameterNameAndUnit = "Cloud Top Height(m)"; break;
              case 3: this.ParameterNameAndUnit = "Cloud Top Height Quality Indicator(Code table 4.219)"; break;
              case 4: this.ParameterNameAndUnit = "Estimated u-Component of Wind(m s-1)"; break;
              case 5: this.ParameterNameAndUnit = "Estimated v-Component of Wind(m s-1)"; break;
              case 6: this.ParameterNameAndUnit = "Number Of Pixels Used(Numeric)"; break;
              case 7: this.ParameterNameAndUnit = "Solar Zenith Angle()"; break;
              case 8: this.ParameterNameAndUnit = "Relative Azimuth Angle()"; break;
              case 9: this.ParameterNameAndUnit = "Reflectance in 0.6 Micron Channel(%)"; break;
              case 10: this.ParameterNameAndUnit = "Reflectance in 0.8 Micron Channel(%)"; break;
              case 11: this.ParameterNameAndUnit = "Reflectance in 1.6 Micron Channel(%)"; break;
              case 12: this.ParameterNameAndUnit = "Reflectance in 3.9 Micron Channel(%)"; break;
              case 13: this.ParameterNameAndUnit = "Atmospheric Divergence(s-1)"; break;
              case 14: this.ParameterNameAndUnit = "Cloudy Brightness Temperature(K)"; break;
              case 15: this.ParameterNameAndUnit = "Clear Sky Brightness Temperature(K)"; break;
              case 16: this.ParameterNameAndUnit = "Cloudy Radiance (with respect to wave number)(W m-1 sr-1)"; break;
              case 17: this.ParameterNameAndUnit = "Clear Sky Radiance (with respect to wave number)(W m-1 sr-1)"; break;
              case 19: this.ParameterNameAndUnit = "Wind Speed(m s-1)"; break;
              case 20: this.ParameterNameAndUnit = "Aerosol Optical Thickness at 0.635 m()"; break;
              case 21: this.ParameterNameAndUnit = "Aerosol Optical Thickness at 0.810 m()"; break;
              case 22: this.ParameterNameAndUnit = "Aerosol Optical Thickness at 1.640 m()"; break;
              case 23: this.ParameterNameAndUnit = "Angstrom Coefficient()"; break;
              case 192: this.ParameterNameAndUnit = "Scatterometer Estimated U Wind Component(m s-1)"; break;
              case 193: this.ParameterNameAndUnit = "Scatterometer Estimated V Wind Component(m s-1)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 192) { // Forecast Satellite Imagery
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Simulated Brightness Temperature for GOES 12, Channel 2(K)"; break;
              case 1: this.ParameterNameAndUnit = "Simulated Brightness Temperature for GOES 12, Channel 3(K)"; break;
              case 2: this.ParameterNameAndUnit = "Simulated Brightness Temperature for GOES 12, Channel 4(K)"; break;
              case 3: this.ParameterNameAndUnit = "Simulated Brightness Temperature for GOES 12, Channel 6(K)"; break;
              case 4: this.ParameterNameAndUnit = "Simulated Brightness Counts for GOES 12, Channel 3(Byte)"; break;
              case 5: this.ParameterNameAndUnit = "Simulated Brightness Counts for GOES 12, Channel 4(Byte)"; break;
              case 6: this.ParameterNameAndUnit = "Simulated Brightness Temperature for GOES 11, Channel 2(K)"; break;
              case 7: this.ParameterNameAndUnit = "Simulated Brightness Temperature for GOES 11, Channel 3(K)"; break;
              case 8: this.ParameterNameAndUnit = "Simulated Brightness Temperature for GOES 11, Channel 4(K)"; break;
              case 9: this.ParameterNameAndUnit = "Simulated Brightness Temperature for GOES 11, Channel 5(K)"; break;
              case 10: this.ParameterNameAndUnit = "Simulated Brightness Temperature for AMSRE on Aqua, Channel 9(K)"; break;
              case 11: this.ParameterNameAndUnit = "Simulated Brightness Temperature for AMSRE on Aqua, Channel 10(K)"; break;
              case 12: this.ParameterNameAndUnit = "Simulated Brightness Temperature for AMSRE on Aqua, Channel 11(K)"; break;
              case 13: this.ParameterNameAndUnit = "Simulated Brightness Temperature for AMSRE on Aqua, Channel 12(K)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
        }

        else if (this.DisciplineOfProcessedData == 4) { // Space Weather
          if (this.CategoryOfParametersByProductDiscipline == 0) { // Temperature
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Temperature(K)"; break;
              case 1: this.ParameterNameAndUnit = "Electron Temperature(K)"; break;
              case 2: this.ParameterNameAndUnit = "Proton Temperature(K)"; break;
              case 3: this.ParameterNameAndUnit = "Ion Temperature(K)"; break;
              case 4: this.ParameterNameAndUnit = "Parallel Temperature(K)"; break;
              case 5: this.ParameterNameAndUnit = "Perpendicular Temperature(K)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 1) { // Momentum
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Velocity Magnitude (Speed)(m s-1)"; break;
              case 1: this.ParameterNameAndUnit = "1st Vector Component of Velocity (Coordinate system dependent)(m s-1)"; break;
              case 2: this.ParameterNameAndUnit = "2nd Vector Component of Velocity (Coordinate system dependent)(m s-1)"; break;
              case 3: this.ParameterNameAndUnit = "3rd Vector Component of Velocity (Coordinate system dependent)(m s-1)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 2) { // Charged Particle Mass and Number
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Particle Number Density(m-3)"; break;
              case 1: this.ParameterNameAndUnit = "Electron Density(m-3)"; break;
              case 2: this.ParameterNameAndUnit = "Proton Density(m-3)"; break;
              case 3: this.ParameterNameAndUnit = "Ion Density(m-3)"; break;
              case 4: this.ParameterNameAndUnit = "Vertical Electron Content(m-2)"; break;
              case 5: this.ParameterNameAndUnit = "HF Absorption Frequency(Hz)"; break;
              case 6: this.ParameterNameAndUnit = "HF Absorption(dB)"; break;
              case 7: this.ParameterNameAndUnit = "Spread F(m)"; break;
              case 8: this.ParameterNameAndUnit = "h'F(m)"; break;
              case 9: this.ParameterNameAndUnit = "Critical Frequency(Hz)"; break;
              case 10: this.ParameterNameAndUnit = "Scintillation(Numeric)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 3) { // Electric and Magnetic Fields
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Magnetic Field Magnitude(T)"; break;
              case 1: this.ParameterNameAndUnit = "1st Vector Component of Magnetic Field(T)"; break;
              case 2: this.ParameterNameAndUnit = "2nd Vector Component of Magnetic Field(T)"; break;
              case 3: this.ParameterNameAndUnit = "3rd Vector Component of Magnetic Field(T)"; break;
              case 4: this.ParameterNameAndUnit = "Electric Field Magnitude(V m-1)"; break;
              case 5: this.ParameterNameAndUnit = "1st Vector Component of Electric Field(V m-1)"; break;
              case 6: this.ParameterNameAndUnit = "2nd Vector Component of Electric Field(V m-1)"; break;
              case 7: this.ParameterNameAndUnit = "3rd Vector Component of Electric Field(V m-1)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 4) { // Energetic Particles
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Proton Flux (Differential)((m2 s sr eV)-1)"; break;
              case 1: this.ParameterNameAndUnit = "Proton Flux (Integral)((m2 s sr)-1)"; break;
              case 2: this.ParameterNameAndUnit = "Electron Flux (Differential)((m2 s sr eV)-1)"; break;
              case 3: this.ParameterNameAndUnit = "Electron Flux (Integral)((m2 s sr)-1)"; break;
              case 4: this.ParameterNameAndUnit = "Heavy Ion Flux (Differential)((m2 s sr eV / nuc)-1)"; break;
              case 5: this.ParameterNameAndUnit = "Heavy Ion Flux (iIntegral)((m2 s sr)-1)"; break;
              case 6: this.ParameterNameAndUnit = "Cosmic Ray Neutron Flux(h-1)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }

          else if (this.CategoryOfParametersByProductDiscipline == 5) { // Waves
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 6) { // Solar Electromagnetic Emissions
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Integrated Solar Irradiance(W m-2)"; break;
              case 1: this.ParameterNameAndUnit = "Solar X-ray Flux (XRS Long)(W m-2)"; break;
              case 2: this.ParameterNameAndUnit = "Solar X-ray Flux (XRS Short)(W m-2)"; break;
              case 3: this.ParameterNameAndUnit = "Solar EUV Irradiance(W m-2)"; break;
              case 4: this.ParameterNameAndUnit = "Solar Spectral Irradiance(W m-2 nm-1)"; break;
              case 5: this.ParameterNameAndUnit = "F10.7(W m-2 Hz-1)"; break;
              case 6: this.ParameterNameAndUnit = "Solar Radio Emissions(W m-2 Hz-1)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 7) { // Terrestrial Electromagnetic Emissions
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Limb Intensity(m-2 s-1)"; break;
              case 1: this.ParameterNameAndUnit = "Disk Intensity(m-2 s-1)"; break;
              case 2: this.ParameterNameAndUnit = "Disk Intensity Day(m-2 s-1)"; break;
              case 3: this.ParameterNameAndUnit = "Disk Intensity Night(m-2 s-1)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 8) { // Imagery
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "X-Ray Radiance(W sr-1 m-2)"; break;
              case 1: this.ParameterNameAndUnit = "EUV Radiance(W sr-1 m-2)"; break;
              case 2: this.ParameterNameAndUnit = "H-Alpha Radiance(W sr-1 m-2)"; break;
              case 3: this.ParameterNameAndUnit = "White Light Radiance(W sr-1 m-2)"; break;
              case 4: this.ParameterNameAndUnit = "CaII-K Radiance(W sr-1 m-2)"; break;
              case 5: this.ParameterNameAndUnit = "White Light Coronagraph Radiance(W sr-1 m-2)"; break;
              case 6: this.ParameterNameAndUnit = "Heliospheric Radiance(W sr-1 m-2)"; break;
              case 7: this.ParameterNameAndUnit = "Thematic Mask(Numeric)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 9) { // Ion-Neutral Coupling
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Pedersen Conductivity(S m-1)"; break;
              case 1: this.ParameterNameAndUnit = "Hall Conductivity(S m-1)"; break;
              case 2: this.ParameterNameAndUnit = "Parallel Conductivity(S m-1)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
        }
        else if (this.DisciplineOfProcessedData == 10) { // Oceanographic
          if (this.CategoryOfParametersByProductDiscipline == 0) { // Waves
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Wave Spectra (1)(-)"; break;
              case 1: this.ParameterNameAndUnit = "Wave Spectra (2)(-)"; break;
              case 2: this.ParameterNameAndUnit = "Wave Spectra (3)(-)"; break;
              case 3: this.ParameterNameAndUnit = "Significant Height of Combined Wind Waves and Swell(m)"; break;
              case 4: this.ParameterNameAndUnit = "Direction of Wind Waves(degree true)"; break;
              case 5: this.ParameterNameAndUnit = "Significant Height of Wind Waves(m)"; break;
              case 6: this.ParameterNameAndUnit = "Mean Period of Wind Waves(s)"; break;
              case 7: this.ParameterNameAndUnit = "Direction of Swell Waves(degree true)"; break;
              case 8: this.ParameterNameAndUnit = "Significant Height of Swell Waves(m)"; break;
              case 9: this.ParameterNameAndUnit = "Mean Period of Swell Waves(s)"; break;
              case 10: this.ParameterNameAndUnit = "Primary Wave Direction(degree true)"; break;
              case 11: this.ParameterNameAndUnit = "Primary Wave Mean Period(s)"; break;
              case 12: this.ParameterNameAndUnit = "Secondary Wave Direction(degree true)"; break;
              case 13: this.ParameterNameAndUnit = "Secondary Wave Mean Period(s)"; break;
              case 14: this.ParameterNameAndUnit = "Direction of Combined Wind Waves and Swell(degree true)"; break;
              case 15: this.ParameterNameAndUnit = "Mean Period of Combined Wind Waves and Swell(s)"; break;
              case 16: this.ParameterNameAndUnit = "Coefficient of Drag With Waves(-)"; break;
              case 17: this.ParameterNameAndUnit = "Friction Velocity(m s-1)"; break;
              case 18: this.ParameterNameAndUnit = "Wave Stress(N m-2)"; break;
              case 19: this.ParameterNameAndUnit = "Normalised Waves Stress(-)"; break;
              case 20: this.ParameterNameAndUnit = "Mean Square Slope of Waves(-)"; break;
              case 21: this.ParameterNameAndUnit = "U-component Surface Stokes Drift(m s-1)"; break;
              case 22: this.ParameterNameAndUnit = "V-component Surface Stokes Drift(m s-1)"; break;
              case 23: this.ParameterNameAndUnit = "Period of Maximum Individual Wave Height(s)"; break;
              case 24: this.ParameterNameAndUnit = "Maximum Individual Wave Height(m)"; break;
              case 25: this.ParameterNameAndUnit = "Inverse Mean Wave Frequency(s)"; break;
              case 26: this.ParameterNameAndUnit = "Inverse Mean Frequency of The Wind Waves(s)"; break;
              case 27: this.ParameterNameAndUnit = "Inverse Mean Frequency of The Total Swell(s)"; break;
              case 28: this.ParameterNameAndUnit = "Mean Zero-Crossing Wave Period(s)"; break;
              case 29: this.ParameterNameAndUnit = "Mean Zero-Crossing Period of The Wind Waves(s)"; break;
              case 30: this.ParameterNameAndUnit = "Mean Zero-Crossing Period of The Total Swell(s)"; break;
              case 31: this.ParameterNameAndUnit = "Wave Directional Width(-)"; break;
              case 32: this.ParameterNameAndUnit = "Directional Width of The Wind Waves(-)"; break;
              case 33: this.ParameterNameAndUnit = "Directional Width of The Total Swell(-)"; break;
              case 34: this.ParameterNameAndUnit = "Peak Wave Period(s)"; break;
              case 35: this.ParameterNameAndUnit = "Peak Period of The Wind Waves(s)"; break;
              case 36: this.ParameterNameAndUnit = "Peak Period of The Total Swell(s)"; break;
              case 37: this.ParameterNameAndUnit = "Altimeter Wave Height(m)"; break;
              case 38: this.ParameterNameAndUnit = "Altimeter Corrected Wave Height(m)"; break;
              case 39: this.ParameterNameAndUnit = "Altimeter Range Relative Correction(-)"; break;
              case 40: this.ParameterNameAndUnit = "10 Metre Neutral Wind Speed Over Waves(m s-1)"; break;
              case 41: this.ParameterNameAndUnit = "10 Metre Wind Direction Over Waves(degree true)"; break;
              case 42: this.ParameterNameAndUnit = "Wave Engery Spectrum(m-2 s rad-1)"; break;
              case 43: this.ParameterNameAndUnit = "Kurtosis of The Sea Surface Elevation Due to Waves(-)"; break;
              case 45: this.ParameterNameAndUnit = "Spectral Peakedness Factor(s-1)"; break;
              case 192: this.ParameterNameAndUnit = "Wave Steepness(proportion)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }

          else if (this.CategoryOfParametersByProductDiscipline == 1) { // Currents
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Current Direction(degree True)"; break;
              case 1: this.ParameterNameAndUnit = "Current Speed(m s-1)"; break;
              case 2: this.ParameterNameAndUnit = "U-Component of Current(m s-1)"; break;
              case 3: this.ParameterNameAndUnit = "V-Component of Current(m s-1)"; break;
              case 192: this.ParameterNameAndUnit = "Ocean Mixed Layer U Velocity(m s-1)"; break;
              case 193: this.ParameterNameAndUnit = "Ocean Mixed Layer V Velocity(m s-1)"; break;
              case 194: this.ParameterNameAndUnit = "Barotropic U velocity(m s-1)"; break;
              case 195: this.ParameterNameAndUnit = "Barotropic V velocity(m s-1)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }

          else if (this.CategoryOfParametersByProductDiscipline == 2) { // Ice
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Ice Cover(Proportion)"; break;
              case 1: this.ParameterNameAndUnit = "Ice Thickness(m)"; break;
              case 2: this.ParameterNameAndUnit = "Direction of Ice Drift(degree True)"; break;
              case 3: this.ParameterNameAndUnit = "Speed of Ice Drift(m s-1)"; break;
              case 4: this.ParameterNameAndUnit = "U-Component of Ice Drift(m s-1)"; break;
              case 5: this.ParameterNameAndUnit = "V-Component of Ice Drift(m s-1)"; break;
              case 6: this.ParameterNameAndUnit = "Ice Growth Rate(m s-1)"; break;
              case 7: this.ParameterNameAndUnit = "Ice Divergence(s-1)"; break;
              case 8: this.ParameterNameAndUnit = "Ice Temperature(K)"; break;
              case 9: this.ParameterNameAndUnit = "Ice Internal Pressure(Pa m)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 3) { // Surface Properties
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Water Temperature(K)"; break;
              case 1: this.ParameterNameAndUnit = "Deviation of Sea Level from Mean(m)"; break;
              case 192: this.ParameterNameAndUnit = "Hurricane Storm Surge(m)"; break;
              case 193: this.ParameterNameAndUnit = "Extra Tropical Storm Surge(m)"; break;
              case 194: this.ParameterNameAndUnit = "Ocean Surface Elevation Relative to Geoid(m)"; break;
              case 195: this.ParameterNameAndUnit = "Sea Surface Height Relative to Geoid(m)"; break;
              case 196: this.ParameterNameAndUnit = "Ocean Mixed Layer Potential Density (Reference 2000m)(kg m-3)"; break;
              case 197: this.ParameterNameAndUnit = "Net Air-Ocean Heat Flux(W m-2)"; break;
              case 198: this.ParameterNameAndUnit = "Assimilative Heat Flux(W m-2)"; break;
              case 199: this.ParameterNameAndUnit = "Surface Temperature Trend(degree per day)"; break;
              case 200: this.ParameterNameAndUnit = "Surface Salinity Trend(psu per day)"; break;
              case 201: this.ParameterNameAndUnit = "Kinetic Energy(J kg-1)"; break;
              case 202: this.ParameterNameAndUnit = "Salt Flux(kg m-2s-1)"; break;
              case 242: this.ParameterNameAndUnit = "20% Tropical Cyclone Storm Surge Exceedance(m)"; break;
              case 243: this.ParameterNameAndUnit = "30% Tropical Cyclone Storm Surge Exceedance(m)"; break;
              case 244: this.ParameterNameAndUnit = "40% Tropical Cyclone Storm Surge Exceedance(m)"; break;
              case 245: this.ParameterNameAndUnit = "50% Tropical Cyclone Storm Surge Exceedance(m)"; break;
              case 246: this.ParameterNameAndUnit = "60% Tropical Cyclone Storm Surge Exceedance(m)"; break;
              case 247: this.ParameterNameAndUnit = "70% Tropical Cyclone Storm Surge Exceedance(m)"; break;
              case 248: this.ParameterNameAndUnit = "80% Tropical Cyclone Storm Surge Exceedance(m)"; break;
              case 249: this.ParameterNameAndUnit = "90% Tropical Cyclone Storm Surge Exceedance(m)"; break;
              case 250: this.ParameterNameAndUnit = "Extra Tropical Storm Surge Combined Surge and Tide(m)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 4) { // Sub-surface Properties
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Main Thermocline Depth(m)"; break;
              case 1: this.ParameterNameAndUnit = "Main Thermocline Anomaly(m)"; break;
              case 2: this.ParameterNameAndUnit = "Transient Thermocline Depth(m)"; break;
              case 3: this.ParameterNameAndUnit = "Salinity(kg kg-1)"; break;
              case 4: this.ParameterNameAndUnit = "Ocean Vertical Heat Diffusivity(m2 s-1)"; break;
              case 5: this.ParameterNameAndUnit = "Ocean Vertical Salt Diffusivity(m2 s-1)"; break;
              case 6: this.ParameterNameAndUnit = "Ocean Vertical Momentum Diffusivity(m2 s-1)"; break;
              case 7: this.ParameterNameAndUnit = "Bathymetry(m)"; break;
              case 11: this.ParameterNameAndUnit = "Shape Factor With Respect To Salinity Profile()"; break;
              case 12: this.ParameterNameAndUnit = "Shape Factor With Respect To Temperature Profile In Thermocline()"; break;
              case 13: this.ParameterNameAndUnit = "Attenuation Coefficient Of Water With Respect to Solar Radiation(m-1)"; break;
              case 14: this.ParameterNameAndUnit = "Water Depth(m)"; break;
              case 15: this.ParameterNameAndUnit = "Water Temperature(K)"; break;
              case 192: this.ParameterNameAndUnit = "3-D Temperature(c)"; break;
              case 193: this.ParameterNameAndUnit = "3-D Salinity(psu)"; break;
              case 194: this.ParameterNameAndUnit = "Barotropic Kinectic Energy(J kg-1)"; break;
              case 195: this.ParameterNameAndUnit = "Geometric Depth Below Sea Surface(m)"; break;
              case 196: this.ParameterNameAndUnit = "Interface Depths(m)"; break;
              case 197: this.ParameterNameAndUnit = "Ocean Heat Content(J m-2)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline == 191) { // Miscellaneous
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Seconds Prior To Initial Reference Time (Defined In Section 1)(s)"; break;
              case 1: this.ParameterNameAndUnit = "Meridional Overturning Stream Function(m3 s-1)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default : this.ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0); break;
            }
          }
        }
        else {
          ParameterNameAndUnit = nf(this.ParameterNumberByProductDisciplineAndParameterCategory, 0);
        }
        println(ParameterNameAndUnit);

        float DayPortion = 0;

        print("Indicator of unit of time range:\t");
        this.IndicatorOfUnitOfTimeRange = SectionNumbers[18];
        switch (this.IndicatorOfUnitOfTimeRange) {
          case 0: println("Minute"); DayPortion = 1.0 / 60.0; break;
          case 1: println("Hour"); DayPortion = 1; break;
          case 2: println("Day"); DayPortion = 24; break;
          case 3: println("Month"); DayPortion = 30.5 * 24; break;
          case 4: println("Year"); DayPortion = 365 * 24; break;
          case 5: println("Decade (10 years)"); DayPortion = 10 * 365 * 24; break;
          case 6: println("Normal (30 years)"); DayPortion = 30 * 365 * 24;break;
          case 7: println("Century (100 years)"); DayPortion = 100 * 365 * 24;break;
          case 10: println("3 hours"); DayPortion = 3; break;
          case 11: println("6 hours"); DayPortion = 6; break;
          case 12: println("12 hours"); DayPortion = 12; break;
          case 13: println("Second"); DayPortion = 1.0 / 3600.0; break;
          case 255: println("Missing"); DayPortion = 0; break;
          default: println(this.IndicatorOfUnitOfTimeRange); break;
        }

        print("Forecast time in defined units:\t");
        this.ForecastTimeInDefinedUnits = U_NUMx4(SectionNumbers[19], SectionNumbers[20], SectionNumbers[21], SectionNumbers[22]);

        if (this.ProductDefinitionTemplateNumber == 8) { // Average, accumulation, extreme values or other statistically processed values at a horizontal level or in a horizontal layer in a continuous or non-continuous time interval. (see Template 4.8)
          this.ForecastTimeInDefinedUnits += U_NUMx4(SectionNumbers[50], SectionNumbers[51], SectionNumbers[52], SectionNumbers[53]);
        }
        else if (this.ProductDefinitionTemplateNumber == 9) { // Probability forecasts at a horizontal level or in a horizontal layer in a continuous or non-continuous time interval. (see Template 4.9)
          this.ForecastTimeInDefinedUnits += U_NUMx4(SectionNumbers[63], SectionNumbers[64], SectionNumbers[65], SectionNumbers[66]);
        }
        else if (this.ProductDefinitionTemplateNumber == 10) { // Percentile forecasts at a horizontal level or in a horizontal layer in a continuous or non-continuous time interval. (see Template 4.10)
          this.ForecastTimeInDefinedUnits += U_NUMx4(SectionNumbers[51], SectionNumbers[52], SectionNumbers[53], SectionNumbers[54]);
        }
        else if (this.ProductDefinitionTemplateNumber == 11) { // Individual ensemble forecast, control and perturbed, at a horizontal level or in a horizontal layer, in a continuous or non-continuous time interval. (see Template 4.11)
          this.ForecastTimeInDefinedUnits += U_NUMx4(SectionNumbers[53], SectionNumbers[54], SectionNumbers[55], SectionNumbers[56]);
        }
        else if (this.ProductDefinitionTemplateNumber == 12) { // Derived forecasts based on all ensemble members at a horizontal level or in a horizontal layer, in a continuous or non-continuous time interval. (see Template 4.12)
          this.ForecastTimeInDefinedUnits += U_NUMx4(SectionNumbers[52], SectionNumbers[53], SectionNumbers[54], SectionNumbers[55]);
        }
        else if (this.ProductDefinitionTemplateNumber == 13) { // Derived forecasts based on a cluster of ensemble members over a rectangular area at a horizontal level or in a horizontal layer, in a continuous or non-continuous time interval. (see Template 4.13)
          this.ForecastTimeInDefinedUnits += U_NUMx4(SectionNumbers[84], SectionNumbers[85], SectionNumbers[86], SectionNumbers[87]);
        }
        else if (this.ProductDefinitionTemplateNumber == 14) { // Derived forecasts based on a cluster of ensemble members over a circular area at a horizontal level or in a horizontal layer, in a continuous or non-continuous time interval. (see Template 4.14)
          this.ForecastTimeInDefinedUnits += U_NUMx4(SectionNumbers[80], SectionNumbers[81], SectionNumbers[82], SectionNumbers[83]);
        }
        else if (this.ProductDefinitionTemplateNumber == 42) { // Average, accumulation, and/or extreme values or other statistically processed values at a horizontal level or in a horizontal layer in a continuous or non-continuous time interval for atmospheric chemical constituents. (see Template 4.42)
          this.ForecastTimeInDefinedUnits += U_NUMx4(SectionNumbers[52], SectionNumbers[53], SectionNumbers[54], SectionNumbers[55]);
        }
        else if (this.ProductDefinitionTemplateNumber == 43) { // Individual ensemble forecast, control and perturbed, at a horizontal level or in a horizontal layer, in a continuous or non-continuous time interval for atmospheric chemical constituents. (see Template 4.43)
          this.ForecastTimeInDefinedUnits += U_NUMx4(SectionNumbers[55], SectionNumbers[56], SectionNumbers[57], SectionNumbers[58]);
        }
        else if (this.ProductDefinitionTemplateNumber == 46) { // Average, accumulation, and/or extreme values or other statistically processed values at a horizontal level or in a horizontal layer in a continuous or non-continuous time interval for aerosol. (see Template 4.46)
          this.ForecastTimeInDefinedUnits += U_NUMx4(SectionNumbers[63], SectionNumbers[64], SectionNumbers[65], SectionNumbers[66]);
        }
        else if (this.ProductDefinitionTemplateNumber == 47) { // Individual ensemble forecast, control and perturbed, at a horizontal level or in a horizontal layer, in a continuous or non-continuous time interval for aerosol. (see Template 4.47)
          this.ForecastTimeInDefinedUnits += U_NUMx4(SectionNumbers[66], SectionNumbers[67], SectionNumbers[68], SectionNumbers[69]);
        }
        println(this.ForecastTimeInDefinedUnits);

        this.ForecastConvertedTime = this.ForecastTimeInDefinedUnits * DayPortion;

        print("Type of first fixed surface:\t");
        this.TypeOfFirstFixedSurface = SectionNumbers[23];
        switch (this.TypeOfFirstFixedSurface) {
          case 1: println("Ground or Water Surface"); break;
          case 2: println("Cloud Base Level"); break;
          case 3: println("Level of Cloud Tops"); break;
          case 4: println("Level of 0o C Isotherm"); break;
          case 5: println("Level of Adiabatic Condensation Lifted from the Surface"); break;
          case 6: println("Maximum Wind Level"); break;
          case 7: println("Tropopause"); break;
          case 8: println("Nominal Top of the Atmosphere"); break;
          case 9: println("Sea Bottom"); break;
          case 10: println("Entire Atmosphere"); break;
          case 11: println("Cumulonimbus Base (CB)"); break;
          case 12: println("Cumulonimbus Top (CT)"); break;
          case 20: println("Isothermal Level"); break;
          case 100: println("Isobaric Surface"); break;
          case 101: println("Mean Sea Level"); break;
          case 102: println("Specific Altitude Above Mean Sea Level"); break;
          case 103: println("Specified Height Level Above Ground"); break;
          case 104: println("Sigma Level"); break;
          case 105: println("Hybrid Level"); break;
          case 106: println("Depth Below Land Surface"); break;
          case 107: println("Isentropic (theta) Level"); break;
          case 108: println("Level at Specified Pressure Difference from Ground to Level"); break;
          case 109: println("Potential Vorticity Surface"); break;
          case 111: println("Eta Level"); break;
          case 113: println("Logarithmic Hybrid Level"); break;
          case 114: println("Snow Level"); break;
          case 117: println("Mixed Layer Depth"); break;
          case 118: println("Hybrid Height Level"); break;
          case 119: println("Hybrid Pressure Level"); break;
          case 150: println("Generalized Vertical Height Coordinate (see Note 5)"); break;
          case 160: println("Depth Below Sea Level"); break;
          case 161: println("Depth Below Water Surface"); break;
          case 162: println("Lake or River Bottom"); break;
          case 163: println("Bottom Of Sediment Layer"); break;
          case 164: println("Bottom Of Thermally Active Sediment Layer"); break;
          case 165: println("Bottom Of Sediment Layer Penetrated By Thermal Wave"); break;
          case 166: println("Maxing Layer"); break;
          case 200: println("Entire atmosphere (considered as a single layer)"); break;
          case 201: println("Entire ocean (considered as a single layer)"); break;
          case 204: println("Highest tropospheric freezing level"); break;
          case 206: println("Grid scale cloud bottom level"); break;
          case 207: println("Grid scale cloud top level"); break;
          case 209: println("Boundary layer cloud bottom level"); break;
          case 210: println("Boundary layer cloud top level"); break;
          case 211: println("Boundary layer cloud layer"); break;
          case 212: println("Low cloud bottom level"); break;
          case 213: println("Low cloud top level"); break;
          case 214: println("Low cloud layer"); break;
          case 215: println("Cloud ceiling"); break;
          case 220: println("Planetary Boundary Layer"); break;
          case 221: println("Layer Between Two Hybrid Levels"); break;
          case 222: println("Middle cloud bottom level"); break;
          case 223: println("Middle cloud top level"); break;
          case 224: println("Middle cloud layer"); break;
          case 232: println("High cloud bottom level"); break;
          case 233: println("High cloud top level"); break;
          case 234: println("High cloud layer"); break;
          case 235: println("Ocean Isotherm Level (1/10  C)"); break;
          case 236: println("Layer between two depths below ocean surface"); break;
          case 237: println("Bottom of Ocean Mixed Layer (m)"); break;
          case 238: println("Bottom of Ocean Isothermal Layer (m)"); break;
          case 239: println("Layer Ocean Surface and 26C Ocean Isothermal Level"); break;
          case 240: println("Ocean Mixed Layer"); break;
          case 241: println("Ordered Sequence of Data"); break;
          case 242: println("Convective cloud bottom level"); break;
          case 243: println("Convective cloud top level"); break;
          case 244: println("Convective cloud layer"); break;
          case 245: println("Lowest level of the wet bulb zero"); break;
          case 246: println("Maximum equivalent potential temperature level"); break;
          case 247: println("Equilibrium level"); break;
          case 248: println("Shallow convective cloud bottom level"); break;
          case 249: println("Shallow convective cloud top level"); break;
          case 251: println("Deep convective cloud bottom level"); break;
          case 252: println("Deep convective cloud top level"); break;
          case 253: println("Lowest bottom level of supercooled liquid water layer"); break;
          case 254: println("Highest top level of supercooled liquid water layer"); break;
          case 255: println("Missing"); break;
          default: println(this.TypeOfFirstFixedSurface); break;
        }
      }

      SectionNumbers = getGrib2Section(5); // Section 5: Data Representation Section

      if (SectionNumbers.length > 1) {
        print("Number of data points:\t");
        this.NumberOfDataPoints = U_NUMx4(SectionNumbers[6], SectionNumbers[7], SectionNumbers[8], SectionNumbers[9]);
        println(this.NumberOfDataPoints);

        print("Data Representation Template Number:\t");
        this.DataRepresentationTemplateNumber = U_NUMx2(SectionNumbers[10], SectionNumbers[11]);
        switch (this.DataRepresentationTemplateNumber) {
          case 0: println("Grid point data - simple packing"); break;
          case 1: println("Matrix value - simple packing"); break;
          case 2: println("Grid point data - complex packing"); break;
          case 3: println("Grid point data - complex packing and spatial differencing"); break;
          case 4: println("Grid point data – IEEE floating point data"); break;
          case 40: println("Grid point data – JPEG 2000 Code Stream Format"); break;
          case 41: println("Grid point data – Portable Network Graphics (PNG)"); break;
          case 50: println("Spectral data -simple packing"); break;
          case 51: println("Spherical harmonics data - complex packing"); break;
          case 61: println("Grid point data - simple packing with logarithm pre-processing"); break;
          case 65535: println("Missing"); break;
          default : println(this.DataRepresentationTemplateNumber); break;
        }

        print("Reference value (R):\t");
        this.ReferenceValue = IEEE32(IntToBinary32(U_NUMx4(SectionNumbers[12], SectionNumbers[13], SectionNumbers[14], SectionNumbers[15])));
        println(this.ReferenceValue);

        print("Binary Scale Factor (E):\t");
        this.BinaryScaleFactor = S_NUMx2(SectionNumbers[16], SectionNumbers[17]);
        println(this.BinaryScaleFactor);

        print("Decimal Scale Factor (D):\t");
        this.DecimalScaleFactor = S_NUMx2(SectionNumbers[18], SectionNumbers[19]);
        println(this.DecimalScaleFactor);

        print("Number of bits used for each packed value:\t");
        this.NumberOfBitsUsedForEachPackedValue = SectionNumbers[20];
        println(this.NumberOfBitsUsedForEachPackedValue);

        print("Type of original field values:\t");
        JPEG2000_TypeOfOriginalFieldValues = SectionNumbers[21];
        switch (JPEG2000_TypeOfOriginalFieldValues) {
          case 0: println("Floating point"); break;
          case 1: println("Integer"); break;
          case 255: println("Missing"); break;
          default: println(JPEG2000_TypeOfOriginalFieldValues); break;
        }

        // parameters over 21 used in Complex Packings e.g JPEG-2000
        JPEG2000_TypeOfCompression = -1;
        JPEG2000_TargetCompressionRatio = -1;
        if (this.DataRepresentationTemplateNumber == 40) { // Grid point data – JPEG 2000 Code Stream Format

          print("JPEG-2000/Type of Compression:\t");
          JPEG2000_TypeOfCompression = SectionNumbers[22];
          switch (JPEG2000_TypeOfCompression) {
            case 0: println("Lossless"); break;
            case 1: println("Lossy"); break;
            case 255: println("Missing"); break;
            default: println(JPEG2000_TypeOfCompression); break;
          }

          print("JPEG-2000/Target compression ratio (M):\t");
          JPEG2000_TargetCompressionRatio = SectionNumbers[23];
          println(JPEG2000_TargetCompressionRatio);
          //The compression ratio M:1 (e.g. 20:1) specifies that the encoded stream should be less than ((1/M) x depth x number of data points) bits,
          //where depth is specified in octet 20 and number of data points is specified in octets 6-9 of the Data Representation Section.
        }
        else if ((this.DataRepresentationTemplateNumber == 2) || // Grid point data - complex packing
                 (this.DataRepresentationTemplateNumber == 3)) { // Grid point data - complex packing and spatial differencing

          print("ComplexPacking/Type of Compression:\t");
          ComplexPacking_GroupSplittingMethodUsed = SectionNumbers[22];
          switch (ComplexPacking_GroupSplittingMethodUsed) {
            case 0: println("Row by row splitting"); break;
            case 1: println("General group splitting"); break;
            case 255: println("Missing"); break;
            default: println(ComplexPacking_GroupSplittingMethodUsed); break;
          }

          print("ComplexPacking/Missing value management used:\t");
          ComplexPacking_MissingValueManagementUsed = SectionNumbers[23];
          switch (ComplexPacking_MissingValueManagementUsed) {
            case 0: println("No explicit missing values included within data values"); break;
            case 1: println("Primary missing values included within data values"); break;
            case 2: println("Primary and secondary missing values included within data values"); break;
            case 255: println("Missing"); break;
            default: println(ComplexPacking_MissingValueManagementUsed); break;
          }

          print("ComplexPacking/Primary missing value substitute:\t");
          ComplexPacking_PrimaryMissingValueSubstitute = IEEE32(IntToBinary32(U_NUMx4(SectionNumbers[24], SectionNumbers[25], SectionNumbers[26], SectionNumbers[27])));
          println(ComplexPacking_PrimaryMissingValueSubstitute);

          print("ComplexPacking/Secondary missing value substitute:\t");
          ComplexPacking_SecondaryMissingValueSubstitute = IEEE32(IntToBinary32(U_NUMx4(SectionNumbers[28], SectionNumbers[29], SectionNumbers[30], SectionNumbers[31])));
          println(ComplexPacking_SecondaryMissingValueSubstitute);

          print("ComplexPacking/Number of groups of data values into which field is split:\t");
          ComplexPacking_NumberOfGroupsOfDataValues = U_NUMx4(SectionNumbers[32], SectionNumbers[33], SectionNumbers[34], SectionNumbers[35]);
          println(ComplexPacking_NumberOfGroupsOfDataValues);

          print("ComplexPacking/Reference for group widths:\t");
          ComplexPacking_ReferenceForGroupWidths = SectionNumbers[36];
          println(ComplexPacking_ReferenceForGroupWidths);

          print("ComplexPacking/Number of bits used for group widths:\t");
          ComplexPacking_NumberOfBitsUsedForGroupWidths = SectionNumbers[37];
          println(ComplexPacking_NumberOfBitsUsedForGroupWidths);

          print("ComplexPacking/Reference for group lengths:\t");
          ComplexPacking_ReferenceForGroupLengths = U_NUMx4(SectionNumbers[38], SectionNumbers[39], SectionNumbers[40], SectionNumbers[41]);
          println(ComplexPacking_ReferenceForGroupLengths);

          print("ComplexPacking/Length increment for the group lengths:\t");
          ComplexPacking_LengthIncrementForTheGroupLengths = SectionNumbers[42];
          println(ComplexPacking_LengthIncrementForTheGroupLengths);

          print("ComplexPacking/True length of last group:\t");
          ComplexPacking_TrueLengthOfLastGroup = U_NUMx4(SectionNumbers[43], SectionNumbers[44], SectionNumbers[45], SectionNumbers[46]);
          println(ComplexPacking_TrueLengthOfLastGroup);

          print("ComplexPacking/Number of bits used for the scaled group lengths:\t");
          ComplexPacking_NumberOfBitsUsedForTheScaledGroupLengths = SectionNumbers[47];
          println(ComplexPacking_NumberOfBitsUsedForTheScaledGroupLengths);

          if (this.DataRepresentationTemplateNumber == 3) { // Grid point data - complex packing and spatial differencing

            print("ComplexPacking/Order of Spatial Differencing:\t");
            ComplexPacking_OrderOfSpatialDifferencing = SectionNumbers[48];
            println(ComplexPacking_OrderOfSpatialDifferencing);

            print("ComplexPacking/Number of octets required in the Data Section to specify the extra descriptors:\t");
            ComplexPacking_NumberOfExtraOctetsRequiredInDataSection = SectionNumbers[49];
            println(ComplexPacking_NumberOfExtraOctetsRequiredInDataSection);
          }
        }
      }

      //////////////////////////////////////////////////
      if (this.DataAllocated == false) {
        this.DataValues = new float[DATA_numMembers][this.Nx * this.Ny];
        DataTitles = new String[DATA_numMembers];

        this.DataAllocated = true;
      }
      //////////////////////////////////////////////////

      SectionNumbers = getGrib2Section(6); // Section 6: Bit-Map Section

      if (SectionNumbers.length > 1) {
        print("Bit map indicator:\t");
        Bitmap_Indicator = SectionNumbers[6];
        switch (Bitmap_Indicator) {
          case 0: println("A bit map applies to this product and is specified in this Section."); break;
          case 254: println("A bit map defined previously in the same GRIB message applies to this product."); break;
          case 255: println("A bit map does not apply to this product."); break;
          default : println("A bit map pre-determined by the originating/generating Centre applies to this product and is not specified in this Section."); break;
        }

        if (Bitmap_Indicator == 0) { // A bit map applies to this product and is specified in this Section.

          this.NullBitmapFlags = new int[(SectionNumbers.length - 7) * 8];

          println(">>>>> NullBitmapFlags.length", this.NullBitmapFlags.length);

          for (int i = 0; i < SectionNumbers.length - 7; i++) {
            String b = binary(SectionNumbers[7 + i], 8);

            for (int j = 0; j < 8; j++) {
              this.NullBitmapFlags[i * 8 + j] = int(b.substring(j, j + 1));
            }
          }
        }
      }

      if (this.DataRepresentationTemplateNumber == 40) { // Grid point data – JPEG 2000 Code Stream Format

        Bitmap_beginPointer = nPointer + 6;

        SectionNumbers = getGrib2Section(7); // Section 7: Data Section

        if (SectionNumbers.length > 100) { // ???????? to handle the case of no bitmap

          Bitmap_endPointer = nPointer;

          int n = Bitmap_beginPointer;

          println(hex(fileBytes[n], 2), hex(fileBytes[n + 1], 2));  // FF 4F : Marker Start of codestream
          n += 2;

          println(hex(fileBytes[n], 2), hex(fileBytes[n + 1], 2));  // FF 51 : Marker Image and tile size
          n += 2;

          JPEG2000_Lsiz = U_NUMx2(fileBytes[n], fileBytes[n + 1]);
          println("Lsiz =", JPEG2000_Lsiz);  // Lsiz : Length of marker segment in bytes (not including the marker)
          n += 2;

          JPEG2000_Rsiz = U_NUMx2(fileBytes[n], fileBytes[n + 1]);
          println("Rsiz =", JPEG2000_Rsiz);  // Rsiz : Denotes capabilities that a decoder needs to properly decode the codestream
          n += 2;
          print("\t");
          switch (JPEG2000_Rsiz) {
            case 0: println("Capabilities specified in this Recommendation | International Standard only"); break;
            case 1: println("Codestream restricted as described for Profile 0 from Table A.45"); break;
            case 2: println("Codestream restricted as described for Profile 1 from Table A.45"); break;
            default: println("Reserved"); break;
          }

          JPEG2000_Xsiz = U_NUMx4(fileBytes[n], fileBytes[n + 1], fileBytes[n + 2], fileBytes[n + 3]);
          println("Xsiz =", JPEG2000_Xsiz);  // Xsiz : Width of the reference grid
          n += 4;

          JPEG2000_Ysiz = U_NUMx4(fileBytes[n], fileBytes[n + 1], fileBytes[n + 2], fileBytes[n + 3]);
          println("Ysiz =", JPEG2000_Ysiz);  // Ysiz : Height of the reference grid
          n += 4;

          JPEG2000_XOsiz = U_NUMx4(fileBytes[n], fileBytes[n + 1], fileBytes[n + 2], fileBytes[n + 3]);
          println("XOsiz =", JPEG2000_XOsiz);  // XOsiz : Horizontal offset from the origin of the reference grid to the left side of the image area
          n += 4;

          JPEG2000_YOsiz = U_NUMx4(fileBytes[n], fileBytes[n + 1], fileBytes[n + 2], fileBytes[n + 3]);
          println("YOsiz =", JPEG2000_YOsiz);  // YOsiz : Vertical offset from the origin of the reference grid to the top side of the image area
          n += 4;

          JPEG2000_XTsiz = U_NUMx4(fileBytes[n], fileBytes[n + 1], fileBytes[n + 2], fileBytes[n + 3]);
          println("XTsiz =", JPEG2000_XTsiz);  // XTsiz : Width of one reference tile with respect to the reference grid
          n += 4;

          JPEG2000_YTsiz = U_NUMx4(fileBytes[n], fileBytes[n + 1], fileBytes[n + 2], fileBytes[n + 3]);
          println("YTsiz =", JPEG2000_YTsiz);  // YTsiz : Height of one reference tile with respect to the reference grid
          n += 4;

          JPEG2000_XTOsiz = U_NUMx4(fileBytes[n], fileBytes[n + 1], fileBytes[n + 2], fileBytes[n + 3]);
          println("XTOsiz =", JPEG2000_XTOsiz);  // XTOsiz : Horizontal offset from the origin of the reference grid to the left side of the first tile
          n += 4;

          JPEG2000_YTOsiz = U_NUMx4(fileBytes[n], fileBytes[n + 1], fileBytes[n + 2], fileBytes[n + 3]);
          println("YTOsiz =", JPEG2000_YTOsiz);  // YTOsiz : Vertical offset from the origin of the reference grid to the top side of the first tile
          n += 4;

          JPEG2000_Csiz = U_NUMx2(fileBytes[n], fileBytes[n + 1]);
          println("Csiz =", JPEG2000_Csiz);  // Csiz : Number of components in the image
          n += 2;

          JPEG2000_Ssiz = fileBytes[n];
          println("Ssiz =", JPEG2000_Ssiz);  // Ssiz : Precision (depth) in bits and sign of the ith component samples
          n += 1;

          JPEG2000_XRsiz = fileBytes[n];
          println("XRsiz =", JPEG2000_XRsiz);  // XRsiz : Horizontal separation of a sample of ith component with respect to the reference grid. There is one occurrence of this parameter for each component
          n += 1;

          JPEG2000_YRsiz = fileBytes[n];
          println("YRsiz =", JPEG2000_YRsiz);  // YRsiz : Vertical separation of a sample of ith component with respect to the reference grid. There is one occurrence of this parameter for each component.
          n += 1;

          if ((fileBytes[n] == -1) && (fileBytes[n + 1] == 100)) { // the case of optional Comment

            println(hex(fileBytes[n], 2), hex(fileBytes[n + 1], 2));  // FF 64 : Marker Comment
            n += 2;

            JPEG2000_Lcom = U_NUMx2(fileBytes[n], fileBytes[n + 1]);
            println("Lcom =", JPEG2000_Lcom);  // Lcom : Length of marker segment in bytes (not including the marker)
            n += 2;

            JPEG2000_Rcom = U_NUMx2(fileBytes[n], fileBytes[n + 1]);
            println("Rcom =", JPEG2000_Rcom);  // Rcom : Registration value of the marker segment
            n += 2;

            print("Comment: ");
            for (int i = 0; i < JPEG2000_Lcom - 4; i++) {
              cout(fileBytes[n]);
              n += 1;
            }
            println();
          }

          println("numXtiles:", (JPEG2000_Xsiz - JPEG2000_XTOsiz) / float(JPEG2000_XTsiz));
          println("numYtiles:", (JPEG2000_Ysiz - JPEG2000_YTOsiz) / float(JPEG2000_YTsiz));

          println(hex(fileBytes[n], 2), hex(fileBytes[n + 1], 2));  // FF 52 : Marker Coding style default
          n += 2;

          JPEG2000_Lcod = U_NUMx2(fileBytes[n], fileBytes[n + 1]);
          println("Lcod =", JPEG2000_Lcod);  // Lcod : Length of marker segment in bytes (not including the marker)
          n += 2;

          JPEG2000_Scod = fileBytes[n];
          println("Scod =", JPEG2000_Scod);  // Scod : Coding style for all components
          n += 1;

          // SGcod : Parameters for coding style designated in Scod. The parameters are independent of components.

          JPEG2000_SGcod_ProgressionOrder = fileBytes[n];
          println("JPEG2000_SGcod_ProgressionOrder =", JPEG2000_SGcod_ProgressionOrder); // Progression order
          n += 1;

          JPEG2000_SGcod_NumberOfLayers = U_NUMx2(fileBytes[n], fileBytes[n + 1]);
          println("JPEG2000_SGcod_NumberOfLayers =", JPEG2000_SGcod_NumberOfLayers); // Number of layers
          n += 2;

          JPEG2000_SGcod_MultipleComponentTransformation = fileBytes[n];
          println("JPEG2000_SGcod_MultipleComponentTransformation =", JPEG2000_SGcod_MultipleComponentTransformation); // Multiple component transformation usage
          n += 1;

          // SPcod : Parameters for coding style designated in Scod. The parameters relate to all components.

          JPEG2000_SPcod_NumberOfDecompositionLevels = fileBytes[n];
          println("JPEG2000_SPcod_NumberOfDecompositionLevels =", JPEG2000_SPcod_NumberOfDecompositionLevels); // Number of decomposition levels, NL, Zero implies no transformation.
          n += 1;

          JPEG2000_SPcod_CodeBlockWidth = fileBytes[n];
          println("JPEG2000_SPcod_CodeBlockWidth =", JPEG2000_SPcod_CodeBlockWidth); // Code-block width
          n += 1;

          JPEG2000_SPcod_CodeBlockHeight = fileBytes[n];
          println("JPEG2000_SPcod_CodeBlockHeight =", JPEG2000_SPcod_CodeBlockHeight); // Code-block height
          n += 1;

          JPEG2000_SPcod_CodeBlockStyle = fileBytes[n];
          println("JPEG2000_SPcod_CodeBlockStyle =", JPEG2000_SPcod_CodeBlockStyle); // Code-block style
          n += 1;

          JPEG2000_SPcod_Transformation = fileBytes[n];
          println("JPEG2000_SPcod_Transformation =", JPEG2000_SPcod_Transformation); // Wavelet transformation used
          n += 1;

      //Ii through In: Precinct sizePrecinct size
      //If Scod or Scoc = xxxx xxx0, this parameter is not presen; otherwise
      //this indicates precinct width and height. The first parameter (8 bits)
      //corresponds to the NLLL sub-band. Each successive parameter
      //corresponds to each successive resolution level in order.

          println(hex(fileBytes[n], 2), hex(fileBytes[n + 1], 2));  // FF 5C : Marker Quantization default
          n += 2;

          JPEG2000_Lqcd = U_NUMx2(fileBytes[n], fileBytes[n + 1]);
          println("Lqcd =", JPEG2000_Lqcd);  // Lqcd : Length of marker segment in bytes (not including the marker)
          n += 2;

          JPEG2000_Sqcd = fileBytes[n];
          println("Sqcd =", JPEG2000_Sqcd);  // Sqcd : Quantization style for all components
          n += 1;

          //int JPEG2000_SPgcd = function(...);
          //println("SPgcd =", JPEG2000_SPcod);  // SPgcd : Quantization step size value for the ith sub-band in the defined order
          n += JPEG2000_Lqcd - 3;

          println(hex(fileBytes[n], 2), hex(fileBytes[n + 1], 2));  // FF 90 : Marker Start of tile-part
          n += 2;

          JPEG2000_Lsot = U_NUMx2(fileBytes[n], fileBytes[n + 1]);
          println("Lsot =", JPEG2000_Lsot);  // Lsot : Length of marker segment in bytes (not including the marker)
          n += 2;

          JPEG2000_Isot = U_NUMx2(fileBytes[n], fileBytes[n + 1]);
          println("Isot =", JPEG2000_Isot);  // Isot : Tile index. This number refers to the tiles in raster order starting at the number 0
          n += 2;

          JPEG2000_Psot = U_NUMx4(fileBytes[n], fileBytes[n + 1], fileBytes[n + 2], fileBytes[n + 3]);
          println("Psot =", JPEG2000_Psot);  // Psot : Length, in bytes, from the beginning of the first byte of this SOT marker segment of the tile-part to the end of the data of that tile-part. Figure A.16 shows this alignment. Only the last tile-part in the codestream may contain a 0 for Psot. If the Psot is 0, this tile-part is assumed to contain all data until the EOC marker.
          n += 4;

          JPEG2000_TPsot = fileBytes[n];
          println("TPsot =", JPEG2000_TPsot);  // TPsot : Tile-part index. There is a specific order required for decoding tile-parts; this index denotes the order from 0. If there is only one tile-part for a tile, then this value is zero. The tile-parts of this tile shall appear in the codestream in this order, although not necessarily consecutively.
          n += 1;

          JPEG2000_TNsot = fileBytes[n];
          println("TNsot =", JPEG2000_TNsot);  // TNsot : Number of tile-parts of a tile in the codestream. Two values are allowed: the correct number of tileparts for that tile and zero. A zero value indicates that the number of tile-parts of this tile is not specified in this tile-part.
          n += 1;
          print("\t");
          switch (JPEG2000_TNsot) {
            case 0: println("Number of tile-parts of this tile in the codestream is not defined in this header"); break;
            default: println("Number of tile-parts of this tile in the codestream"); break;
          }

          println(hex(fileBytes[n], 2), hex(fileBytes[n + 1], 2));  // FF 93 : Start of data
          n += 2;

          //printMore(n, 100); // <<<<<<<<<<<<<<<<<<<<

      /*

      see page 84: Annex D
      Coefficient bit modeling

        see page 174

      L-R-C-P: For each quality layer q = 0, …, LYEpoc - 1
      For each resolution delta r = RSpoc, …, REpoc-1
      For each component, c=CSpoc, …, CEpoc-1
      For each precinct, p
      Packet P(q,r,c,p) appears.
      */

          int o = 0;
          print("CodeStream: ");
          while (!((fileBytes[n] == -1) && (fileBytes[n + 1] == -39))) { // note: If the Psot is 0 we need another algorithm to read because in that case the tile-part is assumed to contain all data until the EOC marker.
            //cout(fileBytes[n]);
      /*
            print(o++);
            println("(" + hex(fileBytes[n]) + ")");
      */
            n += 1;
          }
          println();

           //printing the end of grib

           printMore(n, 2); // <<<<<<<<<<<<<<<<<<<<
           n += 2;

          byte[] imageBytes = new byte[1 + Bitmap_endPointer - Bitmap_beginPointer];
          for (int i = 0; i < imageBytes.length; i++) {
            imageBytes[i] = fileBytes[i + Bitmap_beginPointer];
          }
          this.DataTitles[memberID] = DATA_Filename.replace(".grib2", "");
          if (DATA_numMembers > 1) {
            this.DataTitles[memberID] += nf(memberID, 2);
          }

          Bitmap_FileName = Jpeg2000Folder + this.DataTitles[memberID] + ".jp2";

          saveBytes(Bitmap_FileName, imageBytes);
          println("Bitmap section saved at:", Bitmap_FileName);

          Bitmap_FileLength = 1 + Bitmap_endPointer - Bitmap_beginPointer;
        }
        else {
          this.DataTitles[memberID] = DATA_Filename.replace(".grib2", "");
          if (DATA_numMembers > 1) {
            this.DataTitles[memberID] += nf(memberID, 2);
          }
          Bitmap_FileName = "";
          Bitmap_FileLength = 0;
        }
      }

      else if ((this.DataRepresentationTemplateNumber == 0) || // Grid point data - simple packing

               (this.DataRepresentationTemplateNumber == 2) || // Grid point data - complex packing
               (this.DataRepresentationTemplateNumber == 3)) { // Grid point data - complex packing and spatial differencing

        Bitmap_beginPointer = nPointer + 6;

        //s = getGrib2Section(7); // Section 7: Data Section

        //if (SectionNumbers.length > 1)
        { // ???????? to handle the case of no bitmap

          Bitmap_endPointer = nPointer;

          nPointer = Bitmap_beginPointer;
          int b = 0;

          float[] data = new float[0];

          if (this.DataRepresentationTemplateNumber == 0) { // Grid point data - simple packing

            data = new float[this.NumberOfDataPoints];

            for (int i = 0; i < this.NumberOfDataPoints; i++) {
              int[] m = new int[this.NumberOfBitsUsedForEachPackedValue];
              for (int j = 0; j < m.length; j++) {
                m[j] = getNthBit(fileBytes[nPointer], b);
                b += 1;
                if (b == 8) {
                  b = 0;
                  nPointer += 1;
                }
              }
              data[i] = U_NUMxI(m);
            }
          }

          if ((this.DataRepresentationTemplateNumber == 2) || // Grid point data - complex packing
              (this.DataRepresentationTemplateNumber == 3)) { // Grid point data - complex packing and spatial differencing

            println();
            println("First value(s) of original (undifferenced) scaled data values, followed by the overall minimum of the differences.");

            int FirstValues1 = 0;
            int FirstValues2 = 0;
            int OverallMinimumOfTheDifferences = 0;

            {
              int[] m = new int[8 * ComplexPacking_NumberOfExtraOctetsRequiredInDataSection];
              for (int j = 0; j < m.length; j++) {
                m[j] = getNthBit(fileBytes[nPointer], b);

                b += 1;
                if (b == 8) {
                  b = 0;
                  nPointer += 1;
                }
              }
              FirstValues1 = S_NUMxI(m);
              println("FirstValues1 =", FirstValues1);
            }

            if (ComplexPacking_OrderOfSpatialDifferencing == 2) { //second order spatial differencing

              int[] m = new int[8 * ComplexPacking_NumberOfExtraOctetsRequiredInDataSection];
              for (int j = 0; j < m.length; j++) {
                m[j] = getNthBit(fileBytes[nPointer], b);
                b += 1;
                if (b == 8) {
                  b = 0;
                  nPointer += 1;
                }
              }
              FirstValues2 = S_NUMxI(m);
              println("FirstValues2 =", FirstValues2);
            }

            {
              int[] m = new int[8 * ComplexPacking_NumberOfExtraOctetsRequiredInDataSection];
              for (int j = 0; j < m.length; j++) {
                m[j] = getNthBit(fileBytes[nPointer], b);
                b += 1;
                if (b == 8) {
                  b = 0;
                  nPointer += 1;
                }
              }

              OverallMinimumOfTheDifferences = S_NUMxI(m);
              println("OverallMinimumOfTheDifferences =", OverallMinimumOfTheDifferences);
            }

            // read the group reference values
            int[] group_refs = new int[ComplexPacking_NumberOfGroupsOfDataValues];

            for (int i = 0; i < ComplexPacking_NumberOfGroupsOfDataValues; i++) {
              int[] m = new int[this.NumberOfBitsUsedForEachPackedValue];
              for (int j = 0; j < m.length; j++) {
                m[j] = getNthBit(fileBytes[nPointer], b);
                b += 1;
                if (b == 8) {
                  b = 0;
                  nPointer += 1;
                }
              }
              group_refs[i] = U_NUMxI(m);
            }
            //println(group_refs);

            //Bits set to zero shall be appended where necessary to ensure this sequence of numbers ends on an octet boundary.
            if (b != 0) {
              b = 0;
              nPointer += 1;
            }

            // read the group widths
            int[] group_widths = new int[ComplexPacking_NumberOfGroupsOfDataValues];

            for (int i = 0; i < ComplexPacking_NumberOfGroupsOfDataValues; i++) {
              int[] m = new int[ComplexPacking_NumberOfBitsUsedForGroupWidths];
              for (int j = 0; j < m.length; j++) {
                m[j] = getNthBit(fileBytes[nPointer], b);
                b += 1;
                if (b == 8) {
                  b = 0;
                  nPointer += 1;
                }
              }
              group_widths[i] = U_NUMxI(m);

              group_widths[i] += ComplexPacking_ReferenceForGroupWidths;
            }
            //println(group_widths);

            //Bits set to zero shall be appended where necessary to ensure this sequence of numbers ends on an octet boundary.
            if (b != 0) {
              b = 0;
              nPointer += 1;
            }

            // read the group lengths
            int[] group_lengths = new int[ComplexPacking_NumberOfGroupsOfDataValues];

            if (ComplexPacking_GroupSplittingMethodUsed == 1) {
              for (int i = 0; i < ComplexPacking_NumberOfGroupsOfDataValues; i++) {
                int[] m = new int[ComplexPacking_NumberOfBitsUsedForTheScaledGroupLengths];
                for (int j = 0; j < m.length; j++) {
                  m[j] = getNthBit(fileBytes[nPointer], b);
                  b += 1;
                  if (b == 8) {
                    b = 0;
                    nPointer += 1;
                  }
                }
                group_lengths[i] = U_NUMxI(m);

                group_lengths[i] = group_lengths[i] * ComplexPacking_LengthIncrementForTheGroupLengths + ComplexPacking_ReferenceForGroupLengths;
              }
              group_lengths[ComplexPacking_NumberOfGroupsOfDataValues - 1] = ComplexPacking_TrueLengthOfLastGroup;
            }
            else {
              println("Error: It does not support this splitting method:", ComplexPacking_GroupSplittingMethodUsed);
            }
            //println(group_lengths);

            //Bits set to zero shall be appended where necessary to ensure this sequence of numbers ends on an octet boundary.
            if (b != 0) {
              b = 0;
              nPointer += 1;
            }

            // check
            int total = 0;
            for (int i = 0; i < ComplexPacking_NumberOfGroupsOfDataValues; i++) {
              total += group_lengths[i];
            }
            if (total != this.NumberOfDataPoints) {
            //if (total != this.Np) {
              println("Error: Size mismatch!");
            }

            data = new float[total];

            int count = 0;

            for (int i = 0; i < ComplexPacking_NumberOfGroupsOfDataValues; i++) {
              if (group_widths[i] != 0) {
                for (int j = 0; j < group_lengths[i]; j++) {
                  int[] m = new int[group_widths[i]];
                  for (int k = 0; k < m.length; k++) {
                    m[k] = getNthBit(fileBytes[nPointer], b);
                    b += 1;
                    if (b == 8) {
                      b = 0;
                      nPointer += 1;
                    }
                  }

                  data[count] = U_NUMxI(m) + group_refs[i];

                  count += 1;
                }
              }
              else {
                for (int j = 0; j < group_lengths[i]; j++) {
                  data[count] = group_refs[i];

                  count += 1;
                }
              }
            }

            // not sure if this algorithm works fine for complex packing WITHOUT spatial differencing ?????
            if (this.DataRepresentationTemplateNumber == 3) { // Grid point data - complex packing and spatial differencing

              // spatial differencing
              if (ComplexPacking_OrderOfSpatialDifferencing == 1) { // case of first order
                data[0] = FirstValues1;
                for (int i = 1; i < total; i++) {
                  data[i] += OverallMinimumOfTheDifferences;
                  data[i] = data[i] + data[i - 1];
                }
              }
              else if (ComplexPacking_OrderOfSpatialDifferencing == 2) { // case of second order
                data[0] = FirstValues1;
                data[1] = FirstValues2;
                for (int i = 2; i < total; i++) {
                  data[i] += OverallMinimumOfTheDifferences;
                  data[i] = data[i] + (2 * data[i - 1]) - data[i - 2];
                }
              }
            }
          }

          // Mode  0 +x, -y, adjacent x, adjacent rows same dir
          // Mode  64 +x, +y, adjacent x, adjacent rows same dir
          if ((this.ScanningMode == 0) || (this.ScanningMode == 64)) {
            // Mode  128 -x, -y, adjacent x, adjacent rows same dir
            // Mode  192 -x, +y, adjacent x, adjacent rows same dir
            // change -x to +x ie east to west -> west to east
          } else if ((this.ScanningMode == 128) || (this.ScanningMode == 192)) {
            float tmp;
            int mid = (int) this.Nx / 2;
            //System.out.println( "this.Nx =" +this.Nx +" mid ="+ mid );
            for (int index = 0; index < data.length; index += this.Nx) {
              for (int idx = 0; idx < mid; idx++) {
                tmp = data[index + idx];
                data[index + idx] = data[index + this.Nx - idx - 1];
                data[index + this.Nx - idx - 1] = tmp;
                //System.out.println( "switch " + (index + idx) + " " +
                //(index + this.Nx -idx -1) );
              }
            }
          }
          else {
            // scanMode == 16, 80, 144, 208 adjacent rows scan opposite dir
            float tmp;
            int mid = (int) this.Nx / 2;
            //System.out.println( "this.Nx =" +this.Nx +" mid ="+ mid );
            for (int index = 0; index < data.length; index += this.Nx) {
              int row = (int) index / this.Nx;
              if (row % 2 == 1) {  // odd numbered row, calculate reverse index
                for (int idx = 0; idx < mid; idx++) {
                  tmp = data[index + idx];
                  data[index + idx] = data[index + this.Nx - idx - 1];
                  data[index + this.Nx - idx - 1] = tmp;
                  //System.out.println( "switch " + (index + idx) + " " +
                  //(index + this.Nx -idx -1) );
                }
              }
            }
          }

          //Bits set to zero shall be appended where necessary to ensure this sequence of numbers ends on an octet boundary.
          if (b != 0) {
            b = 0;
            nPointer += 1;
          }

          nPointer -= 1; // <<<<????

          println("nPointer", nPointer);
          println("fileBytes.length", fileBytes.length);

          println("data.length", data.length);
          println("Nx X Ny", this.Nx, this.Ny, this.Nx * this.Ny);

          float BB = pow(2, this.BinaryScaleFactor);
          float DD = pow(10, this.DecimalScaleFactor);
          float RR = this.ReferenceValue;

          if (Bitmap_Indicator == 0) { // A bit map applies to this product

            int i = -1;
            for (int q = 0; q < this.Nx * this.Ny; q++) {
              if (this.NullBitmapFlags[q] == 0) {
                this.DataValues[memberID][q] = FLOAT_undefined;
              }
              else {
                i += 1;

                this.DataValues[memberID][q] = ((data[i] * BB) + RR) / DD;
              }
            }
          }
          else {
            for (int q = 0; q < this.Nx * this.Ny; q++) {
              int i = q;

              this.DataValues[memberID][q] = ((data[i] * BB) + RR) / DD;
            }
          }

          //for (int q = 0; q < 20; q++) println(this.DataValues[memberID][q]);

          this.DataTitles[memberID] = DATA_Filename.replace(".grib2", "");
          if (DATA_numMembers > 1) {
            this.DataTitles[memberID] += nf(memberID, 2);
          }
          Bitmap_FileName = Jpeg2000Folder + this.DataTitles[memberID] + ".jp2"; // not a jp2 file!
          Bitmap_FileLength = 1 + Bitmap_endPointer - Bitmap_beginPointer;

        }
        /*
        else {
          this.DataTitles[memberID] = DATA_Filename.replace(".grib2", "");
          if (DATA_numMembers > 1) {
            this.DataTitles[memberID] += nf(memberID, 2);
          }
          Bitmap_FileName = "";
          Bitmap_FileLength = 0;
        }
        */

      }

      SectionNumbers = getGrib2Section(8); // Section 8: 7777


      try {
        if (this.DataRepresentationTemplateNumber == 40) { // Grid point data – JPEG 2000 Code Stream Format

          println("Openning:", Bitmap_FileName);

          RandomAccessFile raf = new RandomAccessFile(Bitmap_FileName, "r");

          String[] argv = new String[4];
          argv[0] = "-rate";
          argv[1] = nf(this.NumberOfBitsUsedForEachPackedValue, 0); // number of bits per pixel
          argv[2] = "-verbose";
          argv[3] = "off";

          Grib2JpegDecoder g2j = new Grib2JpegDecoder(argv);

          byte[] buf = new byte[Bitmap_FileLength];

          raf.read(buf);
          g2j.decode(buf);

          println("g2j.data.length", g2j.data.length);
          println("Nx X Ny", this.Nx, this.Ny, this.Nx * this.Ny);

          float BB = pow(2, this.BinaryScaleFactor);
          float DD = pow(10, this.DecimalScaleFactor);
          float RR = this.ReferenceValue;

          if (Bitmap_Indicator == 0) { // A bit map applies to this product

            int i = -1;
            for (int q = 0; q < this.Nx * this.Ny; q++) {
              if (this.NullBitmapFlags[q] == 0) {
                this.DataValues[memberID][q] = FLOAT_undefined;
              }
              else {
                i += 1;

                this.DataValues[memberID][q] = ((g2j.data[i] * BB) + RR) / DD;
              }
            }
          }
          else {
            for (int q = 0; q < this.Nx * this.Ny; q++) {
              int i = q;

              this.DataValues[memberID][q] = ((g2j.data[i] * BB) + RR) / DD;
            }
          }
        }
      }
      catch (IOException e) {
        println("error:", e);
      }
    }
  }
}

String[][] CalendarMONTH = {
    {"January", "janvier"},
    {"February", "février"},
    {"March", "mars"},
    {"April", "avril"},
    {"May", "mai"},
    {"June", "juin"},
    {"July", "juillet"},
    {"August", "août"},
    {"September", "septembre"},
    {"October", "octobre"},
    {"November", "novembre"},
    {"December", "décembre"}
};

int CalendarLength[] = {
  31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31
};

int Convert2Date (int _MONTH, int _DAY) {
  int k = 0;
  for (int i = 0; i < (_MONTH - 1); i += 1) {
    for (int j = 0; j < CalendarLength[i]; j += 1) {
      k += 1;
      if (k == 365) k = 0;
    }
  }
  k += _DAY - 1;

  k = k % 365;
  return k;
}
