const urlAis =  'https://coral-cors.herokuapp.com/https://ripples.lsts.pt/imcrouter/ships';
//const urlAis =  'https://ripples.lsts.pt/imcrouter/ships';


class AisProvider {
/*    async getAllAis() {
        return fetch(urlAllAis)
            .then(response => response.text())
            .then(text => {
                return text;
            }).catch(err => {
                console.error('fetch failed', err);
                return err;
            });
    }*/

    async getAisFromArea(latMax, latMin, lonMax, lonMin ) {
        let url = new URL(urlAis),
            params = { latmax: latMax, latmin: latMin,
                lonmax: lonMax, lonmin: lonMin  }
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        let urlArea = url.toString();

        //debug
        //console.log(urlArea);

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
