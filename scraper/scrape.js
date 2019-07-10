const REDIS_QUEUE='url'
const REDIS_DB=2
const COUCHDB_URL=process.env['COUCHDB_URL'] || 'http://localhost:5984'

// Axios
const axios = require('axios')

// Redis for queuing
const redis = require('redis')
var client = redis.createClient()
client.select(REDIS_DB);
const {promisify} = require('util');
const rpushAsync = promisify(client.rpush).bind(client);
const rpopAsync = promisify(client.lpop).bind(client);

// CouchDB
const nano = require('nano')(COUCHDB_URL);
const db = nano.db.use('dd-meteo-gc-ca');

function walk(path) {
  var docs = [];
  return axios
    .get('https://dd.meteo.gc.ca' + path)
    .then(response => {
      var lines = response.data.split('\n')
      for(var i = 0; i < lines.length; i++) {
        if(!lines[i].startsWith('<img')) continue

        var l = lines[i]
        var m = l.match(/<a[^>]*>([^<]*)<\/a>/)

        var filepath = path + m[1]
        var rem = l.split('</a>')[1]
        m = rem.match(/\w*(\d\d\d\d-\d\d-\d\d \d\d:\d\d)\w*(.*)/)
        var mtime = m[1]
        var size = m[2].trim()
        var directory = filepath.slice(-1) === '/'

        var doc = {_id: filepath, filepath, mtime, size, directory}
        docs.push(doc)
      }
      return db.bulk({docs})
    })
    .then(function() {
      // Add to queue
      var toQueue = docs.filter(d => d.directory).map(d => d.filepath)
      if(toQueue.length > 0) return rpushAsync(`${REDIS_QUEUE}-${path.split('/').length}`, toQueue)
    })
    .then(function() {
      return Promise.resolve(true)
    })
}

function delay(duration) {
    return function(value) {
        return new Promise(function(resolve) {
            setTimeout(function() {
                resolve(value);
            }, duration || 0);
        });
    };
};

function processNext(level) {
  rpopAsync(`${REDIS_QUEUE}-${level}`)
  .then(data => {
      if(!data) throw 'Empty queue'
      console.log(`Processing url: ${data}`)
        return walk(data).then(delay(100))
  })
  .catch(function(err) {
    console.log(err);
    if(err === 'Empty queue') {
      level += 1
      console.log(`Moving to level ${level}`)
      if(level > 100) {
        console.log('Exceeded max number of levels')
        process.exit(0);
      }
    }
  })
  .then(function() {
    processNext(level)
  })
}

processNext(0)
