'use strict';

var http = require("http");
var Plotly = require("plotly.js-dist");

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
        ParameterLevel: ParameterLevel
};

var mocks;
var loading = document.getElementById('loading');

switch(process.env.NODE_ENV) {
    case 'proxy-data':
        mocks = [
            'https://dd.meteo.gc.ca/model_gem_global/25km/grib2/lat_lon/00/003/CMC_glb_TMP_ISBL_1000_latlon.24x.24_2019071000_P003.grib2',
            'https://dd.meteo.gc.ca/model_gem_global/25km/grib2/lat_lon/00/048/CMC_glb_TMP_ISBL_970_latlon.24x.24_2019071000_P048.grib2'
        ];

        console.log('Using grib2 data fetched from Datamart using proxy server!')
        break;
    case 'local-data':
        mocks = [
            './grib2/CMC_gdwps_global_HTSGW_SFC_0_latlon0.25x0.25_2019071000_P000.grib2',
            './grib2/CMC_geps-raw_TMP_TGL_2m_latlon0p5x0p5_2019070900_P060_allmbrs.grib2',
            './grib2/CMC_glb_TMP_ISBL_1000_latlon.24x.24_2019071000_P003.grib2'
        ];

        console.log('Using local (already downloaded) grib2 data')
        break;
    default:
        console.error('BAD BUNDLE');
        break;
}

function makeDropDown() {
  var dropDown = document.getElementById("file-selector");
  var i;
  for (i in mocks) {
    var opt = document.createElement("option");
    opt.value = mocks[i];
    opt.text = mocks[i]
          .replace('https://dd.meteo.gc.ca', '')
          .replace('./grib2/', '');
    dropDown.append(opt);
  }

  dropDown.addEventListener("change", function(e) {
    go(e.target.value);
  });
}

function go(link) {
  loading.style.display = 'block'
  link = link.replace('https://', 'http://');

  if(process.env.NODE_ENV === 'proxy-data') {
      link = link.replace('://dd.meteo.gc.ca/', '://localhost:3000/');
      link = link.replace('://dd.weather.gc.ca/', '://localhost:3000/');
  }

  DATA.numMembers = link.indexOf('ensemble') !== -1 ?
          21 : // i.e. ensembles
          1; //i.e. deterministic

  var myGrid = new GRIB2CLASS(DATA, {
          log: false
  });

  http.get(link, function (res, err) {
          if(err) {
            loading.style.display = 'none'
          }
          var allChunks = [];
          res.on("data", function (chunk) {
                  allChunks.push(chunk);
          });
          res.on("end", function () {
                  myGrid.parse(Buffer.concat(allChunks));
                  console.log(myGrid);

                  //basicPlot(myGrid);
                  interactivePlot(myGrid);
          });
  })
  .on('error', function(err) {
    loading.style.display = 'none';
    window.alert(err)
  })
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

function interactivePlot(grid) {
        var nx = grid.Nx;
        var ny = grid.Ny;
        var nMembers = grid.DataValues.length; // actual values are here in correct scale - undefined values are NaN!

        // let's start with deterministic data i.e. member 0
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
                type: 'heatmap',
                z: z,
                //x: reader.getDataVariable(LON_NAME),
                //y: reader.getDataVariable(LAT_NAME),
                hovertemplate: '%{z:.1f}K<extra>(%{x}, %{y})</extra>',
                colorbar: {
                        len: 0.5
                }
        }, {
                type: 'scattergeo'
        }];

        var layout = {
                xaxis: {
                        visible: false,
                        constrain: 'domain',
                        scaleanchor: 'y',
                        fixedrange: true
                },
                yaxis: {
                        visible: false,
                        constrain: 'domain',
                        scaleratio: 0.5,
                        fixedrange: true
                },
                geo: {
                        projection: { rotation: { lon: 180 + grid.Lo1 } },
                        bgcolor: 'rgba(0,0,0,0)',
                        dragmode: false
                },
                margin: {t:0, b:0}
        };

        var config = {
                scrollZoom: false,
                responsive: true,
                modeBarButtonsToRemove: ['pan2d']
        };

        Plotly.newPlot('gd', data, layout, config)
                .then(function (gd) {
                        Plotly.d3.select(gd).select('g.geo > .bg > rect').style('pointer-events', null)

                        loading.style.display = 'none'
                });
}

// Global wave model
//var link = 'https://dd.weather.gc.ca/model_wave/ocean/global/grib2/00/CMC_gdwps_global_HTSGW_SFC_0_latlon0.25x0.25_2019071000_P000.grib2';

// Global model
var link = 'https://dd.weather.gc.ca/model_gem_global/25km/grib2/lat_lon/00/003/CMC_glb_TMP_ISBL_1000_latlon.24x.24_2019071000_P003.grib2';

// Global ensemble model
//var link = 'https://dd.weather.gc.ca/ensemble/geps/grib2/raw/00/060/CMC_geps-raw_TMP_TGL_2m_latlon0p5x0p5_2019070900_P060_allmbrs.grib2';

// Other:
//var link = 'https://dd.weather.gc.ca/ensemble/reps/15km/grib2/raw/00/072/CMC-reps-srpe-raw_TMP_TGL_2m_ps15km_2019070900_P072_allmbrs.grib2';
//var link = 'https://dd.weather.gc.ca/model_gem_regional/10km/grib2/18/054/CMC_reg_TMP_TGL_2_ps10km_2019070918_P054.grib2';
//var link = 'https://dd.weather.gc.ca/model_hrdps/continental/grib2/18/006/CMC_hrdps_continental_TMP_TGL_80_ps2.5km_2019070918_P006-00.grib2';
//var link = 'https://dd.weather.gc.ca/model_hrdps/west/grib2/12/006/CMC_hrdps_west_TMP_TGL_2_ps2.5km_2019070912_P006-00.grib2';
//var link = 'https://dd.weather.gc.ca/model_hrdps/east/grib2/12/006/CMC_hrdps_east_TMP_TGL_2_ps2.5km_2019070912_P006-00.grib2';

window.go = go

makeDropDown();
go(mocks[0]);

// go('https://dd.weather.gc.ca/model_gem_global/25km/grib2/lat_lon/00/003/CMC_glb_TMP_ISBL_1000_latlon.24x.24_2019071000_P003.grib2')
