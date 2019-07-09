/**
 *
 * To run
 *
 * - cp /path/to/data.nc ./build/data.nc
 * - npm i -g budo
 * - budo plot.js --open --live --force-default-index
 */

const NetCDF = require('netcdfjs')
const Plotly = require('plotly.js-dist')

const DATA_URL = './build/data.nc'
const LON_NAME = 'longitude'
const LAT_NAME = 'latitude'

const fetchData = () => new Promise(resolve => {
  window.fetch(DATA_URL)
    .then(resp => resp.arrayBuffer())
    .then(d => resolve(new NetCDF(d)))
})

Promise.all([fetchData()]).then(data => {
  const reader = window.reader = data[0]

  const dims = reader.header.dimensions.map(d => d.size)
  const zVar = reader.header.variables[3];
  const zName = zVar.name;

  console.log('plotting', zName, zVar)

  const values = reader.getDataVariable(zName)[0]
  const z = new Array(dims[0])

  let k = 0;
  for(let i = 0; i < dims[0]; i++) {
    z[i] = new Array(dims[1])
    for(let j = 0; j < dims[1]; j++) {
      z[i][j] = values[k++];
    }
  }

  const gd = document.createElement('div')
  document.body.appendChild(gd)

  Plotly.newPlot(gd, [{
    type: 'heatmap',
    z: z,
    x: reader.getDataVariable(LON_NAME),
    y: reader.getDataVariable(LAT_NAME),
    hovertemplate: '%{z:.1f}K<extra>(%{x}, %{y})</extra>',
    colorbar: {
      len: 0.5
    }
  }, {
    type: 'scattergeo'
  }], {
    width: 0.9 * window.innerWidth,
    height: 0.9 * window.innerHeight,
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
      bgcolor: 'rgba(0,0,0,0)',
      dragmode: false
    }
  }, {
    scrollZoom: false
  })
  .then(gd => {
    Plotly.d3.select(gd).select('g.geo > .bg > rect').style('pointer-events', null)
  })
})
