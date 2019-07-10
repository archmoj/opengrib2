# scraper

Simple tool to scrape all the data in [dd.meteo.gc.ca](https://dd.meteo.gc.ca).

On 2019-07-10, we indexed 15 millions files which have the following file extensions:
![file format distribution](graphs/2019-07-10.png)
## How to use

### Requirements

- **Node** for scraping
- **Redis** for queuing and distribute work across multiple workers
- **CouchDB** to index all the entries

### Usage

To start scraping `dd.meteo.gc.ca` from its root '/', add an entry in the Redis queue:
`redis-cli -n 2 rpush url-0 /`
Then you start the scraper with
`COUCHDB_URL=http://username:password@localhost:5984 node scraper.js`
