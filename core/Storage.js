const low = require('lowdb');
const lodashId = require('lodash-id');
const FileSync = require('lowdb/adapters/FileSync');

class Storage {
    constructor(dbFile) {
        this.adapter = new FileSync(dbFile, {
            serialize: (obj) => JSON.stringify(obj),
            deserialize: (data) => JSON.parse(data)
        });
        this.db = low(this.adapter);

        this.db._.mixin(lodashId);

        this.db.defaults({ areas: [], head: '' }).write();

        this.areasDB = this.db.get('areas');
    }

    getAreas() {
        return this.areasDB.value();
    }

    addArea(areaID) {
        return this.areasDB.insert({
            id: areaID,
            areas: [],
            records: []
        }).write();
    }

    hasArea(areaID) {
        return this.areasDB.getById(areaID).value();
    }

    getArea(areaID) {
        const areaInDB = this.areasDB.getById(areaID).value();

        if (!areaInDB) return this.addArea(areaID);
        return areaInDB;
    }

    updateArea(areaID, areaObject) {
        return this.areasDB.updateById(areaID, areaObject).write();
    }

    deleteArea(areaID) {
        if (this.areasDB.getById(areaID).value()) return this.areasDB.removeById(areaID).write();
    }
}

module.exports = Storage;