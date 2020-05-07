const urlAllAis =  'https://ripples.lsts.pt/ais';


class AisProvider {
    async getAllAis() {
        return fetch(urlAllAis)
            .then(response => response.text())
            .then(text => {
                return text;
            }).catch(err => {
                console.error('fetch failed', err);
                return err;
            });
    }

    async getAisFromArea(latMax, latMin, lonMax, lonMin ) {
        let url = new URL("http://localhost:9090/ships"),
            params = { latmax: latMax, latmin: latMin,
                lonmax: lonMax, lonmin: lonMin  }
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        let urlArea = url.toString();

        return fetch(urlArea)
            .then(response => response.text())
            .then(text => {
                return text;
            }).catch(err => {
                console.error('fetch failed', err);
                return err;
            });
    }
}

export default  AisProvider
