import React from 'react';
//import {Renderer} from "react-three";
import * as THREE from "three";
//import Shader from "./Shader"

let renderer = new THREE.WebGLRenderer({ alpha: true });

class Water extends React.Component {

    state = {
        time: 1.0,
        width: window.innerWidth,
        height: window.innerHeight
    };

    private frameId: any;
    private container: any;
    renderer: any;

    constructor(props) {
        super(props);

        var camera = new THREE.Camera();
        camera.position.z = 1;
        var scene = new THREE.Scene();

        //renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(renderer.domElement);

        var animate = function() {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };

        this.animate();
    }

    animate = () => {
        this.setState({
            time: this.state.time + 0.05
        })

        this.frameId = requestAnimationFrame(this.animate)
    }

    componentDidMount() {
        this.animate()

        window.addEventListener( 'resize', this.onWindowResize.bind(this), false )
    }

    componentWillUnmount() {
        cancelAnimationFrame(this.frameId)
        window.removeEventListener('resize', this.onWindowResize)
    }

    onWindowResize() {
        this.setState({
            width: window.innerWidth,
            height: window.innerHeight
        })
    }

    render() {
        var cameraprops = {position:{z: 1}};

        return <div>

        </div>
    }
}

//<Shader time={this.state.time} width={this.state.width} height={this.state.height} />

var time = 1.0;

function shaderstart() { // eslint-disable-line no-unused-vars
    var renderelement = document.getElementById("ThreeContainer");
    //renderer.render(<Water />, renderelement);
    //Renderer.render(<Water />, renderelement);
}

window.onload = shaderstart;

export default Water;