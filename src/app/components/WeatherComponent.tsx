
const Cesium = require('cesium');

class WeatherComponent {
    wavesLayer =  null;
    worldLayer = null;
    waterLayer = null;
    salinityLayer: any;

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
            this.worldLayer = viewer.imageryLayers.addImageryProvider(new Cesium.SingleTileImageryProvider({
                url: "../images/world-temp.png",
                rectangle: Cesium.Rectangle.fromDegrees(
                    -180.0,
                    -90.0,
                    180.0,
                    90.0),
            }));
        }
    }

    setWaterTemp(viewer: any, display: boolean) {
        if (!display) {
            viewer.imageryLayers.remove(this.waterLayer);
            this.waterLayer = null;
        } else {
            this.waterLayer = viewer.imageryLayers.addImageryProvider(new Cesium.SingleTileImageryProvider({
                url: "../images/water-temp.png",
                rectangle: Cesium.Rectangle.fromDegrees(
                    -180.0,
                    -80.0,
                    180.0,
                    80.0),
            }));
        }
    }

    setWaves(viewer: any, display: boolean) {
        if (!display) {
            viewer.imageryLayers.remove(this.wavesLayer);
            this.wavesLayer = null;
        } else {
            this.wavesLayer = viewer.imageryLayers.addImageryProvider(new Cesium.SingleTileImageryProvider({
                url: "../images/waves.png",
                rectangle: Cesium.Rectangle.fromDegrees(
                    -180.0,
                    -90.0,
                    180.0,
                    90.0),
            }));
        }
    }


}
export default WeatherComponent