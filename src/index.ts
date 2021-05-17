import { registerPlugin } from '@capacitor/core';

import type { BackgroundGeolocationPlugin } from './definitions';

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>(
  'BackgroundGeolocation',
  {
    web: () => import('./web').then(m => new m.BackgroundGeolocationWeb()),
  },
);

export * from './definitions';
export { BackgroundGeolocation };
