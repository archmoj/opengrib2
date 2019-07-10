const Plotly = require('plotly.js-dist')

const dataUrl = './rows-by-ext.json'

const gd = document.createElement('div')
document.body.appendChild(gd)

const colors = ['#f2f0f7', '#dadaeb', '#bcbddc', '#9e9ac8', '#807dba', '#6a51a3', '#4a1486'].reverse()
const len = colors.length;

Plotly.d3.json(dataUrl, (err, d) => {
    const rows = d.rows
        .filter(r => r.value > 1)
        .sort((a, b) => b.value - a.value)

    const labels = rows.map(r => r.key[0])
    const values = rows.map(r => r.value)

    const barColors = values.map((v, i) => colors[i] || colors[len - 1])

    Plotly.newPlot(gd, [{
        type: 'bar',
        x: labels,
        y: values,
        marker: {color: barColors},
        showlegend: false
    }, {
        type: 'pie',
		textinfo: 'percent',
		labels: labels.slice(0, len),
		values: values.slice(0, len),
		marker: {colors: colors},
		domain: {x: [0.6, 1], y: [0.45, 1]}
    }], {
        font: {size: 20},
        xaxis: {
            title: {text: 'Filename extension'}
        },
        yaxis: {
            type: 'log',
            title: {text: '# of entries in Datamart'}
        },
        margin: {l: 150, t: 150, b: 150, r: 150},
        width: window.innerWidth,
        height: window.innerHeight
    })
})
