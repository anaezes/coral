import moment from "moment";
import Model from "./Model";
import models from '../../data/models.json';
import {ModelJSON} from "../utils/ModelUtils";

const Cesium = require('cesium');

class EnvironmentComponent {
    wavesHeightLayer =  null;
    worldLayer = null;
    waterTempLayer = null;
    salinityLayer = null;
    wavesVelocityLayer = null;
    wrecksLayer = null;
    wrecksLayerWorldTerrain =  null;
    bathymetryLayer = null ;
    aisDensityLayer = null;
    public models : Array<Model> = new Array<Model>();
    static legend : HTMLImageElement | undefined;
    //images : Map<string, string> = new Map<string, string>();

    constructor() {
        let t : Array<ModelJSON> = JSON.parse(JSON.stringify(models.wrecks));
        for (let i = 0; i < t.length; i++) {
            this.models.push( new Model(t[i]));
        }
    }

    update(auvPosition, viewer) {
        let dist, assetId;

        this.models.forEach(model => {
            assetId = model.assetId;
            dist = Cesium.Cartesian3.distance(auvPosition, new Cesium.Cartesian3.fromDegrees(model.longitude, model.latitude)) / 1000;

            if (dist <= 3.0) {
                if(model.pin === undefined) {
                    this.renderModel(model, viewer);
                }
            } else {
                if(model.active)
                    this.removeModel(model, viewer);
            }
        });
    }


    renderModel(model: Model, viewer){

        if(model.assetId !== undefined) {
            let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
                Cesium.Cartesian3.fromDegrees(model.longitude, model.latitude, model.depth));

            var tileset = viewer.scene.primitives.add(
                new Cesium.Cesium3DTileset({
                    url: Cesium.IonResource.fromAssetId(model.assetId),
                    modelMatrix : modelMatrix
                })
            )

            model.primitive = tileset;
            console.log("colocou modelo!!!");
        }

        let pinBuilder = new Cesium.PinBuilder();
        let pin = viewer.entities.add({
                name : model.name.toString(),
                position : Cesium.Cartesian3.fromDegrees(model.longitude, model.latitude, model.depth+10),
                billboard: {
                        image: pinBuilder.fromColor(Cesium.Color.ROYALBLUE, 48).toDataURL(),
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                },
                label: {
                    text: model.name,
                    font: "12px sans-serif",
                    showBackground: true,
                    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
                        0.0,
                        20000.0
                    )

                }
            });

        model.active = true;
        model.pin = pin;
    }

    removeModel(model: Model, viewer){
        console.log("remove: " + model.assetId);
        if(viewer.entities.contains(model.pin))
            viewer.entities.remove(model.pin);
        model.active = false;
        model.pin = undefined;

        if(viewer.scene.primitives.contains(model.primitive)) {
            viewer.scene.primitives.remove(model.primitive);
            model.primitive = undefined;
        }
    }


    getImage(url, autentication?){
        return fetch(url,{
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                "Content-Type": "text/plain",
                'Authorization': 'Basic ' + btoa(autentication)}
        }).then( r => r.blob() ) // consume as a Blob
            .then( blob => {
                const url = URL.createObjectURL( blob );
                return url;
            }).catch(err => {
                return err;
            });
    }
    /*
    * World temperature of a given date (daily)
    * TODO: pedir por wms se possivel + arrajnar + contas meteomatics -> random
    ***/
    setWorldTemp(viewer: any, display?: boolean, date? ) {
        if (!display) {
            viewer.imageryLayers.remove(this.worldLayer);
            this.worldLayer = null;
            EnvironmentComponent.legend = undefined;
        } else {
            let today;
            date === undefined ? today = new Date() : today = date;
            today.setHours(12);
            let url = 'https://api.meteomatics.com/' + this.formatDateForRequest12(today) + '/t_0m:C/90,-180_-90,180:600x400/png';
            let autentication = 'faculdadedeengenhariadoporto_santos:5xHPl1YW0gsUb';
            this.getImage(url, autentication).then(image => {
                this.worldLayer = viewer.imageryLayers.addImageryProvider(new Cesium.SingleTileImageryProvider({
                    url: image,
                    rectangle: Cesium.Rectangle.fromDegrees(
                        -180.0,
                        -90.0,
                        180.0,
                        90.0),
                }));
            });

            let img = document.createElement('img');
            img.src = "../images/worldTemp-legend.png";
            EnvironmentComponent.legend = img;
        }
    }

    /*
    * Salinity of a given date (daily)
    * **/
    setSalinity(viewer, display: boolean, date){
        if (!display) {
            viewer.imageryLayers.remove(this.salinityLayer);
            this.salinityLayer = null;
            EnvironmentComponent.legend = undefined;
        } else {
            let today;
            date === undefined ? today = new Date() : today = date;
            today.setHours(12);

            let layer = new Cesium.WebMapServiceImageryProvider({
                    url: "http://nrt.cmems-du.eu/thredds/wms/global-analysis-forecast-phy-001-024",
                    layers: "so",
                    parameters: {
                        service:"WMS",
                        request: "GetMap",
                        version: "1.3.0",
                        format:"image/png",
                        styles:"boxfill/rainbow",
                        transparent: "true",
                        colorscalerange:"31,39",
                        belowmincolor:"extend",
                        belowmaxcolor:"extend",
                        elevation:"-0.49402499198913574",
                        attribution:"E.U. Copernicus Marine Service Information",
                        time: encodeURI(this.formatDateForRequest24(today))
                    },
                });

            layer.defaultAlpha = 0.5;
            this.salinityLayer = viewer.imageryLayers.addImageryProvider(layer);

            let url = 'http://nrt.cmems-du.eu/thredds/wms/global-analysis-forecast-phy-001-024?service=WMS&' +
                'request=GetLegendGraphic&layer=so&styles=boxfill%2Fsst_36&format=image%2Fpng&transparent=true' +
                '&version=1.1.1&colorscalerange=31%2C39&belowmincolor=extend&belowmaxcolor=extend' +
                '&width=256&height=256&srs=EPSG%3A3857&'
            let img = document.createElement('img');
            img.src = url;
            EnvironmentComponent.legend = img;

           // this.images.set("salinityLayer",img.src);
        }
    }

    /*
    * Water temperature of a given date (hourly)
    * **/
    setWaterTemp(viewer: any, display: boolean, date) {

        console.log("display: " + display);
        if (!display) {
            viewer.imageryLayers.remove(this.waterTempLayer);
            this.waterTempLayer = null;
            EnvironmentComponent.legend = undefined;
        } else {
            let today = date;
            let currentTime = Cesium.JulianDate.toGregorianDate(viewer.clock.currentTime);
            if(currentTime.minute > 30)
                today.setHours(currentTime.hour, 30, 0, 0);
            else
                today.setHours(currentTime.hour - 1, 30, 0, 0);


            let layer = new Cesium.WebMapServiceImageryProvider({
                    url: "http://nrt.cmems-du.eu/thredds/wms/global-analysis-forecast-phy-001-024-hourly-t-u-v-ssh?",
                    layers: "thetao",
                    parameters: {
                        service: "WMS",
                        request: "GetMap",
                        version: "1.3.0",
                        format: "image/png",
                        styles: "boxfill/sst_36",
                        transparent: "true",
                        colorscalerange: "0,36",
                        belowmincolor: "extend",
                        belowmaxcolor: "extend",
                        elevation: "-0.49402499198913574",
                        attribution: "E.U. Copernicus Marine Service Information",
                        time: encodeURI(today.toISOString()),
                    },
                });

            layer.defaultAlpha = 0.5;
            this.waterTempLayer = viewer.imageryLayers.addImageryProvider(layer);

            let url = 'http://nrt.cmems-du.eu/thredds/wms/global-analysis-forecast-phy-001-024?service=WMS&' +
                'request=GetLegendGraphic&layer=thetao&styles=boxfill%2Fsst_36&format=image%2Fpng&transparent=true' +
                '&version=1.1.1&colorscalerange=0%2C36&belowmincolor=extend&belowmaxcolor=extend' +
                '&width=256&height=256&srs=EPSG%3A3857&'
            let img = document.createElement('img');
                img.src = url;
                EnvironmentComponent.legend = img;
        }
    }

    /*
    * Mean waves velocity of a given date (hourly)
    ***/
    setWavesVelocity(viewer: any, display:boolean, date: any) {
        if (!display) {
            console.log("here");
            viewer.imageryLayers.remove(this.wavesVelocityLayer);
            this.wavesVelocityLayer = null;
            EnvironmentComponent.legend = undefined;

            viewer.terrainProvider = Cesium.createWorldTerrain({
                requestWaterMask: true,
            });

        } else {
            let today = date;
            let currentTime = Cesium.JulianDate.toGregorianDate(viewer.clock.currentTime);
            if(currentTime.minute > 30)
                today.setHours(currentTime.hour, 30, 0, 0);
            else
                today.setHours(currentTime.hour - 1, 30, 0, 0);

            let layer = new Cesium.WebMapServiceImageryProvider({
                url: "http://nrt.cmems-du.eu/thredds/wms/global-analysis-forecast-phy-001-024-hourly-t-u-v-ssh?",
                layers: "sea_water_velocity",
                parameters: {
                    service:"WMS",
                    request: "GetMap",
                    version: "1.3.0",
                    format:"image/png",
                    styles: 'vector/rainbow',
                    transparent: "true",
                    colorscalerange:"0.015746597,0.44014812",
                    ELEVATION:"-0.49402499198913574",
                    attribution:"E.U. Copernicus Marine Service Information",
                    time: encodeURI(today.toISOString()),
                    NUMCOLORBANDS:"250",
                    continuousWorld: "true"
                }
            });
            layer.defaultAlpha = 0.5;
            this.wavesVelocityLayer = viewer.imageryLayers.addImageryProvider(layer);

            viewer.terrainProvider = Cesium.createWorldTerrain({
                requestWaterMask: false,
            });

            let url = 'http://nrt.cmems-du.eu/thredds/wms/global-analysis-forecast-phy-001-024?service=WMS&' +
                'request=GetLegendGraphic&layer=sea_water_velocity&styles=boxfill%2Fsst_36&format=image%2Fpng&transparent=true' +
                '&version=1.1.1&colorscalerange=0.015746597%2C0.44014812&belowmincolor=extend&belowmaxcolor=extend' +
                '&width=256&height=256&srs=EPSG%3A3857&'
            let img = document.createElement('img');
            img.src = url;
            EnvironmentComponent.legend = img;
        }
    }

    /*
    * Mean waves height of a given date (update every 3 hours)
    ***/
    setWavesHeight(viewer: any, display:boolean, date: any) {
        if (!display) {
            viewer.imageryLayers.remove(this.wavesHeightLayer);
            this.wavesHeightLayer = null;
            EnvironmentComponent.legend = undefined;
        } else {
            let today = date;
            let currentTime = Cesium.JulianDate.toGregorianDate(viewer.clock.currentTime);
            today.setHours(currentTime.hour);
            let time = this.getMultipleTime(3, today);

            let layer = new Cesium.WebMapServiceImageryProvider({
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
                        time: encodeURI(this.formatDateForRequest24(time)),
                    },
                });
            layer.defaultAlpha = 0.8;
            this.wavesHeightLayer = viewer.imageryLayers.addImageryProvider(layer);

            let url = 'http://nrt.cmems-du.eu/thredds/wms/global-analysis-forecast-wav-001-027?service=WMS&' +
                'request=GetLegendGraphic&layer=VHM0&styles=boxfill%2Fsst_36&format=image%2Fpng&transparent=true' +
                '&version=1.1.1&colorscalerange=0.01%2C10&belowmincolor=extend&belowmaxcolor=extend' +
                '&width=256&height=256&srs=EPSG%3A3857&'
            let img = document.createElement('img');
            img.src = url;
            EnvironmentComponent.legend = img;
        }
    }

    /*
     * Show wrecks
     * **/
    showWrecks(viewer: any, display:boolean = true) {
        if (!display) {
            viewer.imageryLayers.remove(this.wrecksLayer);
            viewer.imageryLayers.remove(this.wrecksLayerWorldTerrain);
            this.wrecksLayer = null;
            viewer.terrainProvider = Cesium.createWorldTerrain({
                requestWaterMask: true,
            });
            EnvironmentComponent.legend = undefined;
        } else {
            this.wrecksLayerWorldTerrain = viewer.imageryLayers.addImageryProvider(
                new Cesium.IonImageryProvider({ assetId: 3813 })
            );
            this.wrecksLayer = viewer.imageryLayers.addImageryProvider(
                new Cesium.WebMapServiceImageryProvider({
                    url: "http://geoserver1.oceanwise.eu/wms",
                    layers: "BASEMAP:wrecks_EMODNet",
                    parameters: {
                        service: "WMS",
                        request: "GetMap",
                        version: "1.3.0",
                        format: "image/png",
                        transparent: "true",
                        attribution: "EMODNET"
                    }
                })
            );

            viewer.terrainProvider = Cesium.createWorldTerrain({
                requestWaterMask: false,
            });

            let url = 'http://geoserver1.oceanwise.eu/ows?service=WMS&request=GetLegendGraphic&format=image%2Fpng&' +
                'width=20&height=20&layer=wrecks_EMODNet'
            let img = document.createElement('img');
            img.src = url;
            EnvironmentComponent.legend = img;

        }
    }

    showBathymetryGlobe(viewer, display:boolean = true){
        if (!display) {
            viewer.imageryLayers.remove(this.bathymetryLayer);
            this.bathymetryLayer = null;
            EnvironmentComponent.legend = undefined;
        } else {
            this.bathymetryLayer = viewer.imageryLayers.addImageryProvider(
                new Cesium.WebMapServiceImageryProvider({
                    url: "https://ows.emodnet-bathymetry.eu/wms",
                    layers: "mean_multicolour",
                    parameters: {
                        service:"WMS",
                        request: "GetMap",
                        version: "1.3.0",
                        format:"image/png",
                        opacity: "0.5",
                        transparent: "true",
                        belowmincolor:"extend",
                        belowmaxcolor:"extend",
                        attribution:"EMODNET"
                    },
                })
            );

            let url = 'https://ows.emodnet-bathymetry.eu/legends/legend_multicolour.png'
            let img = document.createElement('img');
            img.src = url;
            EnvironmentComponent.legend = img;

            return this.bathymetryLayer;
        }
    }

    showAisDensity(viewer, display:boolean = true){
        if (!display) {
            viewer.imageryLayers.remove(this.aisDensityLayer);
            this.aisDensityLayer = null;
        } else {
            this.aisDensityLayer = viewer.imageryLayers.addImageryProvider(
                new Cesium.WebMapServiceImageryProvider({
                    url: "https://ows.emodnet-humanactivities.eu/wms",
                    proxy: new Cesium.DefaultProxy('/proxy/'),
                    layers: "emodnet:2017_01_st_All",
                    parameters: {
                        service:"WMS",
                        request: "GetMap",
                        version: "1.3.0",
                        format:"image/png",
                        transparent: "true",
                        isBaseLayer: 'false',
                        singleTile: 'false',
                        transitionEffect: 'resize',
                        attribution:"EMODNET"
                    },
                })
            );
        }
    }


    getMultipleTime(multiple: number, date: any){
        console.log("hour: " + date.getHours());

        let rest = date.getHours() % multiple;
        let hour = date.getHours() - rest;
        console.log("rest: " + rest);
        console.log(hour);
        date.setHours(hour, 0, 0, 0);
        console.log(date);
        return date;
    }


    public formatDateForRequest24(date: Date) {
        return moment(date)
            .format('YYYY-MM-DDTHH:00:00.000')
            .concat('Z')
    }

    public formatDateForRequest12(date: Date) {
        return moment(date)
            .format('YYYY-MM-DDThh:00:00.000')
            .concat('Z')
    }



    clearAllLayer(viewer: any) {
        viewer.imageryLayers.remove(this.bathymetryLayer);
        viewer.imageryLayers.remove(this.wrecksLayer);
        viewer.imageryLayers.remove(this.wrecksLayerWorldTerrain);
        viewer.imageryLayers.remove(this.wavesHeightLayer);
        viewer.imageryLayers.remove(this.salinityLayer);
        viewer.imageryLayers.remove(this.wavesVelocityLayer);
        viewer.imageryLayers.remove(this.waterTempLayer);
        viewer.imageryLayers.remove(this.aisDensityLayer);
        viewer.imageryLayers.remove(this.worldLayer);

        this.aisDensityLayer = null;
        this.waterTempLayer = null;
        this.wavesVelocityLayer = null;
        this.salinityLayer = null;
        this.wavesHeightLayer = null;
        this.wrecksLayer = null;
        this.worldLayer = null;

        EnvironmentComponent.legend = undefined;
    }

    public updateLayersTime(viewer, date) {
        console.log("update layers");

        if (this.wavesHeightLayer !== null) {
            viewer.imageryLayers.remove(this.wavesHeightLayer);
            this.wavesHeightLayer = null;
            this.setWavesHeight(viewer, true, date);
        }

        if (this.waterTempLayer !== null) {
            viewer.imageryLayers.remove(this.waterTempLayer);
            this.waterTempLayer = null;
            this.setWaterTemp(viewer, true, date);
        }

        if (this.wavesVelocityLayer !== null) {
            viewer.imageryLayers.remove(this.wavesVelocityLayer);
            this.wavesVelocityLayer = null;
            this.setWavesVelocity(viewer, true, date);
        }

        if (this.salinityLayer !== null) {
            viewer.imageryLayers.remove(this.salinityLayer);
            this.salinityLayer = null;
            this.setSalinity(viewer, true, date);
        }

        if (this.worldLayer !== null) {
            viewer.imageryLayers.remove(this.worldLayer);
            this.worldLayer = null;
            this.setWorldTemp(viewer, true, date);
        }

    }


}
export default EnvironmentComponent