import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

import { Preferences } from '@capacitor/preferences';


const container = document.getElementById('root');
const root = createRoot(container!);

import ReactDOM from 'react-dom';

import {ENV} from "./config/ENV";

Preferences.get({key: 'page'}).then((result) => {
  let page = '/home';
  
  if (result.value) {
    page = result.value;
  }
  
  ReactDOM.render(
    <React.StrictMode>
      <App page={page} />
    </React.StrictMode>,
    document.getElementById('root')
  );
});
