"use strict";

module.exports = function grib2links (opts) {
    var YYYY = String("0000" + opts.year).slice(-4);
    var MM = String("00" + opts.month).slice(-2);
    var DD = String("00" + opts.day).slice(-2);
    var HH = String("00" + opts.hour).slice(-2);
    var FHR = String("000" + opts.forecastHour).slice(-3);

    var timeStamp = YYYY + MM + DD + HH + "_P" + FHR;

    return [
        "https://dd.weather.gc.ca/model_wave/ocean/global/grib2/" + HH + "/CMC_gdwps_global_HTSGW_SFC_0_latlon0.25x0.25_" + timeStamp + ".grib2",
        "https://dd.weather.gc.ca//model_gem_global/25km/grib2/lat_lon/" + HH + "/" + FHR + "/CMC_glb_TMP_TGL_2_latlon.24x.24_" + timeStamp + ".grib2",
        "https://dd.weather.gc.ca/model_hrdps/west/grib2/" + HH + "/" + FHR + "/CMC_hrdps_west_TMP_TGL_2_ps2.5km_" + timeStamp + "-00.grib2",
        "https://dd.weather.gc.ca/model_hrdps/east/grib2/" + HH + "/" + FHR + "/CMC_hrdps_east_TMP_TGL_2_ps2.5km_" + timeStamp + "-00.grib2",
        "https://dd.weather.gc.ca/model_hrdps/continental/grib2/" + HH + "/" + FHR + "/CMC_hrdps_continental_TMP_TGL_80_ps2.5km_" + timeStamp + "-00.grib2",
        "https://dd.weather.gc.ca/model_gem_regional/10km/grib2/" + HH + "/" + FHR + "/CMC_reg_TMP_TGL_2_ps10km_" + timeStamp + ".grib2",
        "https://dd.weather.gc.ca/ensemble/reps/15km/grib2/raw/" + HH + "/" + FHR + "/CMC-reps-srpe-raw_TMP_TGL_2m_ps15km_" + timeStamp + "_allmbrs.grib2",
        "https://dd.weather.gc.ca/ensemble/geps/grib2/raw/" + HH + "/" + FHR + "/CMC_geps-raw_TMP_TGL_2m_latlon0p5x0p5_" + timeStamp + "_allmbrs.grib2"
    ];
};
