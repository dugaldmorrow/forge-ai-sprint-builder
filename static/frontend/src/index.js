import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { view } from "@forge/bridge";

import '@atlaskit/css-reset';

view.theme.enable();

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root')
);
