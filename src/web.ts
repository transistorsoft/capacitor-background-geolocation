import { WebPlugin } from '@capacitor/core';

import type { BackgroundGeolocationPlugin } from './definitions';

export class BackgroundGeolocationWeb
  extends WebPlugin
  implements BackgroundGeolocationPlugin {
  async echo(options: { value: string }): Promise<{ value: string }> {
    console.log('ECHO', options);
    return options;
  }
}
