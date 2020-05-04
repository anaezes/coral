import React from 'react';
import ReactDOM from 'react-dom';
import App from './app/App';

import "cesium/Source/Widgets/widgets.css";

import './index.css';

//https://github.com/claus/react-dat-gui/issues/43
import 'react-dat-gui/dist/index.css';

import TopView from "./app/views/TopView";

let Cesium = require('cesium');

Cesium.buildModuleUrl.setBaseUrl('./cesium/');

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkOGVmYTBmMC1jMDJjLTQ5' +
    'MTQtYTQwZi1jNjVkOTcyYTQ0MjEiLCJpZCI6MjMxNTksInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1ODI4MTE0NjB9.' +
    '8bD2ihWXbQPEjqO6CN79XDZ-oTrY7h1S5o8uiT_tvuU';

ReactDOM.render(
    <div>
        <App />
    </div>,
    document.getElementById('root')
);
// eslint-disable-next-line