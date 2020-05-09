
const Cesium = require('cesium');

class WeatherComponent {
    wavesLayer =  null;
    worldLayer = null;
    waterLayer = null;

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