class Archiver {
    constructor(bingParser, storage, updateHandler) {
        this.bingParser = bingParser;
        this.storage = storage;
        this.updateHandler = updateHandler;
    }

    static findParentLastUpdated(areas, id) {
        const area = areas.find(coronaArea => coronaArea.id === id);

        if (area.lastUpdated) return area.lastUpdated;

        if (area.parentId) return Archiver.findParentLastUpdated(areas, area.parentId);
    }

    run() {
        this.bingParser.fetch().then(corona => {
            const dbHeadID = this.storage.db.get('head').value();
        
            if (dbHeadID !== corona.head) {
                console.log(`Updating database head from ${dbHeadID} to ${corona.head}`);
                this.storage.db.set('head', corona.head).write();
            }
        
            const headArea = corona.areas.find(area => area.id === corona.head);
            const lastUpdated = new Date(headArea.lastUpdated).getTime();
        
            if (lastUpdated <= this.storage.db.get('lastUpdated').value()) return;
        
            console.log(`Updating database lastUpdated to ${lastUpdated}`);
            this.storage.db.set('lastUpdated', lastUpdated).write();
        
            corona.areas.forEach(area => {
                let changes = false;

                if (!area.lastUpdated && area.parentId) area.lastUpdated = Archiver.findParentLastUpdated(corona.areas, area.parentId);

                area.lastUpdated = new Date(area.lastUpdated).getTime();
        
                const dbArea = this.storage.getArea(area.id);
        
                if (area.lastUpdated <= dbArea.lastUpdated) return;
        
                dbArea.lastUpdated = area.lastUpdated;
        
                ['displayName', 'lat', 'long', 'parentId'].forEach(key => {
                    if (dbArea[key] !== area[key]) {
                        console.log(`Updating area ${key} from ${dbArea[key]} to ${area[key]}`);
                        dbArea[key] = area[key];
                        changes = true;
                    }
                });
        
                let areaChanges = true;
                area.areas.forEach(subArea => {
                    if (dbArea.areas.indexOf(subArea) < 0) {
                        dbArea.areas.push(subArea);
                        changes = true;
                    }
                });
        
                let valChanges = false;

                if (dbArea.records.length > 0) {
                    const latestRecord = dbArea.records[dbArea.records.length - 1];

                    ['totalConfirmed', 'totalDeaths', 'totalRecovered'].every(key => {
                        if (latestRecord[key] !== area[key]) {
                            valChanges = true;
                            changes = true;
                            return false;
                        }

                        return true;
                    });
                } else {
                    valChanges = true;
                    changes = true;
                }

                if (valChanges) {
                    dbArea.records.push({
                        time: area.lastUpdated,
                        totalConfirmed: area.totalConfirmed,
                        totalDeaths: area.totalDeaths,
                        totalRecovered: area.totalRecovered
                    });

                    this.updateHandler(area.id, area);
                }

                if (changes) this.storage.updateArea(area.id, dbArea);
            });
        });
    }
}

module.exports = Archiver;