import React, { Component } from 'react';
const Cesium = require('cesium');
const THREE = require('three');

class App extends Component {
    private CesiumContainer: any;
    private mount: any;
    
   componentDidMount() {
    // eslint-disable-next-line
    var CesiumViewer = new Cesium.Viewer(this.CesiumContainer);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    //document.body.appendChild( renderer.domElement );
    var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    var cube = new THREE.Mesh( geometry, material );
    scene.add( cube );
    camera.position.z = 5;
    var animate = function () {
      requestAnimationFrame( animate );
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render( scene, camera );
    };
    animate();
    this.mount.appendChild(renderer.domElement);
}

 render() {
        return (
           <div>
                <div id="CesiumContainer" ref={ element => this.CesiumContainer = element }/>
                <div
                  id="ThreeContainer"
                  style={{ width: "80vw", height: "40vw" }}
                  ref={mount => {
                    this.mount = mount;
                  }}
                />
           </div>
        );
    }
}
    

export default App;
