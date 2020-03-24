const axios = require('axios');

class BingParser {
    constructor(dataURL) {
        this.dataURL = dataURL;
    }

    static recurseCorona(coronaArea) {
        const areaData = [];

        coronaArea.areas = coronaArea.areas.map(area => {
            areaData.push(...BingParser.recurseCorona(area));

            return area.id;
        })

        areaData.push(coronaArea);

        return areaData;
    }

    fetch() {
        return axios.get(this.dataURL, { headers: { 'accept-language': 'en-US' } }).then(res => {
            return res.data;
        }).then(coronaData => {
            return {
                head: coronaData.id,
                areas: BingParser.recurseCorona(coronaData)
            }
        });
    }
}

module.exports = BingParser;