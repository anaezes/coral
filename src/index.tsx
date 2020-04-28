import React from 'react';
import ReactDOM from 'react-dom';
import App from './app/App';
import Water from './app/components/Water';

import "cesium/Source/Widgets/widgets.css";
import './index.css';

//https://github.com/claus/react-dat-gui/issues/43
import 'react-dat-gui/dist/index.css';
import WaterEffect from "./app/components/WaterEffect";

let Cesium = require('cesium');

Cesium.buildModuleUrl.setBaseUrl('./cesium/');

ReactDOM.render(
    <div>
        <App />
        <WaterEffect />,
    </div>,
    document.getElementById('root')
);
// eslint-disable-next-line