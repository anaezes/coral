
const Cesium = require('cesium');

class TemperatureComponent {
   /* async getTemperature() {
        let url = `https://faculdadedeengenhariadoporto_santos:5xHPl1YW0gsUb@api.meteomatics.com/2020-05-09T12:00:00Z/t_2m:C/90,-180_-90,180:600x400/png`;

        return fetch(url).then( r => r.blob() ) // consume as a Blob
            .then( blob => {
                const url = URL.createObjectURL( blob );
                const img = document.getElementById( 'img' );
                // @ts-ignore
                img.src = url;
                // in case you don't need the blob anymore
                // @ts-ignore
                img.onload = e => URL.revokeObjectURL( url );
                return img;
            }).catch(err => {
                console.error('fetch failed', err);
                return err;
            });
    }

    getMaterial(){

        //https://faculdadedeengenhariadoporto_santos:5xHPl1YW0gsUb@api.meteomatics.com/2020-05-09T12:00:00Z/t_2m:C/90,-180_-90,180:600x400/png

        let params = 'waveHeight';

        return this.getTemperature().then(
            img => {
                return  new Cesium.Material({
                    fabric: {
                        uniforms: {
                            image: img.src,
                            heightField: "../images/world-bump.png",
                        },
                        materials: {
                            bumpMap: {
                                type: "BumpMap",
                                uniforms: {
                                    image: "../images/world-bump.png",
                                },
                            },
                        },
                        source:
                            "czm_material czm_getMaterial(czm_materialInput materialInput) { \n" +
                            "    czm_material material = czm_getDefaultMaterial(materialInput); \n" +
                            "    vec4 color; \n" +
                            "    float heightValue = texture2D(heightField, materialInput.st).r; \n" +
                            "    color.rgb = mix(vec3(0.2, 0.2, 0.6), vec3(0.2, 0.5, 0.5), heightValue); \n" +
                            "    color.a = (1.0 - texture2D(image, materialInput.st).r) * 0.7; \n" +
                            "    color = czm_gammaCorrect(color); \n" +
                            "    material.diffuse = color.rgb; \n" +
                            "    material.alpha = color.a; \n" +
                            "    material.normal = bumpMap.normal; \n" +
                            "    material.specular = step(0.1, heightValue); \n" + // Specular mountain tops
                            "    material.shininess = 2.0; \n" + // Sharpen highlight
                            "    return material; \n" +
                            "} \n",
                    },
                });
        });
}


    update(viewer) {

        viewer.terrainProvider = Cesium.createWorldTerrain({
            requestWaterMask: true,
        });

        var layers = viewer.imageryLayers;

        layers.addImageryProvider(
            new Cesium.SingleTileImageryProvider({
                url: "../images/waves.png",
                rectangle: Cesium.Rectangle.fromDegrees(
            -180.0,
            -90.0,
            180.0,
            90.0),
            })
        );

*/


     /*   // Cut a rectangle out of the base layer
        var layers = viewer.imageryLayers;
        var imageryBaseLayer = layers.get(0);

        let rectangle = new Cesium.Primitive({
                geometryInstances: new Cesium.GeometryInstance({
                    geometry: new Cesium.RectangleGeometry({
                        rectangle: Cesium.Rectangle.fromDegrees(
                            -180.0,
                            -90.0,
                            180.0,
                            90.0
                        ),
                        vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
                    }),
                }),
                appearance: new Cesium.EllipsoidSurfaceAppearance({
                    aboveGround: true,
                    material: Cesium.Material.WaterType
                })
            });

        rectangle.appearance.material = Cesium.Material.WaterType;




        // Fit a SingleTileImageryProvider inside the cutout on the lowest layer
        layers.addImageryProvider(
            new Cesium.SingleTileImageryProvider({
                url: "../images/waves.png",
                rectangle: rectangle
            })
        );

*/

      /*  var globe = viewer.scene.globe;
        globe.imageryLayers.removeAll();

        globe.imageryLayers.add(
            new Cesium({
                url: "../images/waves.png",
                rectangle: Cesium.Rectangle.fromDegrees(
                    -180.0,
                    -90.0,
                    180.0,
                    90.0
                ),
            }),
        );
*/





 /*       //TODO: associate this to area
        let rectangle = viewer.scene.primitives.add(
            new Cesium.Primitive({
                geometryInstances: new Cesium.GeometryInstance({
                    geometry: new Cesium.RectangleGeometry({
                        rectangle: Cesium.Rectangle.fromDegrees(
                            -180.0,
                            -90.0,
                            180.0,
                            90.0
                        ),
                        vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
                    }),
                }),
                appearance: new Cesium.EllipsoidSurfaceAppearance({
                    aboveGround: true,
                })
            })
        );

        rectangle.appearance.material = Cesium.Material.WaterType;

        console.log("colocou rectangulo !!!")
    }*/
}
export default TemperatureComponent