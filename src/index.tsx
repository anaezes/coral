import React from 'react';
import ReactDOM from 'react-dom';
import App from './app/App';

import "cesium/Source/Widgets/widgets.css";
import './index.css';

let Cesium = require('cesium');

Cesium.buildModuleUrl.setBaseUrl('./cesium/');

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
// eslint-disable-next-line