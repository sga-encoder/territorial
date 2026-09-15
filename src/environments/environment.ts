import { AppEnvironment } from './app-environment';

export const environment: AppEnvironment = {
  production: true,
  // TODO(deploy): replace with the production backend URL when it exists.
  baseUrl: 'http://127.0.0.1:5000',
  groqApiKey: '',
  // Empty = use the bundled no-key dark basemap. Set a style URL to swap basemaps.
  mapStyleUrl: '',
  // TODO(CU-07): fill in with the real Firebase project keys.
  firebase: {
    apiKey: 'AIzaSyC8K8voyF9zKJPrKOfQBGRRP1SKPMK-15c',
    authDomain: 'territorial-9560d.firebaseapp.com',
    projectId: 'territorial-9560d',
    storageBucket: 'territorial-9560d.firebasestorage.app',
    messagingSenderId: '41737040962',
    appId: '1:41737040962:web:396e144675a44acaed69db',
  },
};
