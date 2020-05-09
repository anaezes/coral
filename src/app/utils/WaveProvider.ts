
const apikey = 'd56d2342-d933-11e9-b707-0242ac130004-d56d2464-d933-11e9-b707-0242ac130004';

class WaveProvider {
    async getWaveHeight(lat, lng, start, end) {
        let params = 'waveHeight';
        let url = `https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lng}&params=${params}&start=${start}&end=${end}`;

        return fetch(url, {
            headers: {
                'Authorization': apikey
            }
        }).then(response => response.text())
            .then(text => {
                console.log(text);
                return text;
            }).catch(err => {
                console.error('fetch failed', err);
                return err;
            });
    }

}

export default WaveProvider
