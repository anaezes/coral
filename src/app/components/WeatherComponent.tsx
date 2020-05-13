import moment from "moment";

const Cesium = require('cesium');

class WeatherComponent {
    wavesHeightLayer =  null;
    worldLayer = null;
    waterTempLayer = null;
    salinityLayer = null;
    wavesVelocityLayer = null;

    getImage(url){
        return fetch(url,{
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                "Content-Type": "text/plain",
                'Authorization': 'Basic ' + btoa('faculdadedeengenhariadoporto_santos:5xHPl1YW0gsUb')}
        }).then( r => r.blob() ) // consume as a Blob
            .then( blob => {
                const url = URL.createObjectURL( blob );
                return url;
            }).catch(err => {
                return err;
            });
    }

    setSalinity(viewer, display:boolean){
        if (!display) {
            viewer.imageryLayers.remove(this.salinityLayer);
            this.salinityLayer = null;
        } else {
            let url = 'https://api.meteomatics.com/2020-05-09T00Z/salinity:psu/80,-180_-80,180:0.2,0.2/png'
            this.getImage(url).then(image => {
                    this.salinityLayer = viewer.imageryLayers.addImageryProvider(new Cesium.SingleTileImageryProvider({
                        url: image,
                        rectangle: Cesium.Rectangle.fromDegrees(
                            -180.0,
                            -80.0,
                            180.0,
                            80.0),
                    }));
                }
            );
        }
    }

    setWorldTemp(viewer: any, display: boolean) {
        if (!display) {
            viewer.imageryLayers.remove(this.worldLayer);
            this.worldLayer = null;
        } else {
            let url = 'https://api.meteomatics.com/2020-05-13T12:00:00Z/t_0m:C/90,-180_-90,180:600x400/png';
            this.getImage(url).then(image => {
                this.worldLayer = viewer.imageryLayers.addImageryProvider(new Cesium.SingleTileImageryProvider({
                    url: image,
                    rectangle: Cesium.Rectangle.fromDegrees(
                        -180.0,
                        -90.0,
                        180.0,
                        90.0),
                })); })
            }
    }

    setWaterTemp(viewer: any, display: boolean, date?) {
        if (!display) {
            viewer.imageryLayers.remove(this.waterTempLayer);
            this.waterTempLayer = null;
        } else {
            // TODO
            //http://nrt.cmems-du.eu/thredds/wms/global-analysis-forecast-phy-001-024?service=WMS&request=GetLegendGraphic&layer=thetao&styles=boxfill%2Fsst_36&format=image%2Fpng&transparent=true&version=1.1.1&colorscalerange=0%2C36&belowmincolor=extend&belowmaxcolor=extend&width=256&height=256&srs=EPSG%3A3857&

            var today = new Date();
            today.setHours(12);
            this.waterTempLayer = viewer.imageryLayers.addImageryProvider(
                new Cesium.WebMapServiceImageryProvider({
                    url: "http://nrt.cmems-du.eu/thredds/wms/global-analysis-forecast-phy-001-024",
                    layers: "thetao",
                    parameters: {
                        service:"WMS",
                        request: "GetMap",
                        version: "1.3.0",
                        format:"image/png",
                        styles:"boxfill/sst_36",
                        transparent: "true",
                        colorscalerange:"0,36",
                        belowmincolor:"extend",
                        belowmaxcolor:"extend",
                        attribution:"E.U. Copernicus Marine Service Information",
                        time: encodeURI(this.formatDateForRequest(today)),
                    },
                })
            );
        }
    }

    setWavesVelocity(viewer: any, display: boolean, date?: any) {
        if (!display) {
            viewer.imageryLayers.remove(this.wavesVelocityLayer);
            this.wavesVelocityLayer = null;
        } else {
            var today = new Date();
            today.setMinutes(30, 0, 0);

            this.wavesVelocityLayer = viewer.imageryLayers.addImageryProvider(
                new Cesium.WebMapServiceImageryProvider({
                    url: "http://nrt.cmems-du.eu/thredds/wms/global-analysis-forecast-phy-001-024-hourly-t-u-v-ssh?",
                    layers: "sea_water_velocity",
                    parameters: {
                        service:"WMS",
                        request: "GetMap",
                        version: "1.3.0",
                        format:"image/png",
                        styles: 'vector/rainbow',
                        transparent: "true",
                        colorscalerange:"0.00193016,1.9712055",
                        ELEVATION:"-0.49402499198913574",
                        attribution:"E.U. Copernicus Marine Service Information",
                        time: encodeURI(today.toISOString()),
                        NUMCOLORBANDS:"250",
                        continuousWorld: "true"
                    },
                })
            );
        }
    }

    setWavesHeight(viewer: any, display: boolean, date?: any) {
        if (!display) {
            viewer.imageryLayers.remove(this.wavesHeightLayer);
            this.wavesHeightLayer = null;
        } else {
            this.wavesHeightLayer = viewer.imageryLayers.addImageryProvider(
                new Cesium.WebMapServiceImageryProvider({
                    url: "http://nrt.cmems-du.eu/thredds/wms/global-analysis-forecast-wav-001-027",
                    layers: "VHM0",
                    parameters: {
                        service: "WMS",
                        request: "GetMap",
                        version: "1.3.0",
                        format: "image/png",
                        styles: "boxfill/rainbow",
                        transparent: "true",
                        colorscalerange: "0.01,10",
                        attribution: "E.U. Copernicus Marine Service Information",
                        time: encodeURI(this.getTime(date)),
                    },
                })
            );
        }
    }

    getTime(d?: any){
        let date;
        d === undefined ? date = new Date() : date = d;

        // Multiple of 3
        let hour = date.getHours() % 3;

        if(hour === 1)
            hour -= 1;
        else if(hour === 2)
            hour -= 2;

        date.setHours(hour);

        return this.formatDateForRequest(date);
    }

    public formatDateForRequest(date: Date) {
        return moment(date)
            .format('YYYY-MM-DDThh:00:00.000')
            .concat('Z')
    }


}
export default WeatherComponent