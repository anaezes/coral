import React, { Component } from 'react';

import Viewer from "cesium/Source/Widgets/Viewer/Viewer";


class CesiumRender extends Component {
    componentDidMount() {
        this.viewer = new Viewer(this.CesiumContainer);
    }

    render() {
        return (
            <div>
                <div id="CesiumContainer" ref={ element => this.CesiumContainer = element }/>
            </div>
        );
    }
}

export default CesiumRender;
