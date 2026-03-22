/**
 * Dialog — singleton utility for user-facing feedback:
 * native dialogs (alert, confirm, prompt), toasts, and sounds.
 *
 * Uses @capacitor/dialog so dialogs render above the native map layer.
 */
'use strict';

import { Dialog } from '@capacitor/dialog';
import BackgroundGeolocation from '@transistorsoft/capacitor-background-geolocation';

// Sound IDs for BackgroundGeolocation#playSound
const SOUND_MAP: Record<string, Record<string, any>> = {
  ios: {
    LONG_PRESS_ACTIVATE: 1113,
    LONG_PRESS_CANCEL: 1075,
    ADD_GEOFENCE: 1114,
    BUTTON_CLICK: 1104,
    MESSAGE_SENT: 1303,
    ERROR: 1006,
    OPEN: 1502,
    CLOSE: 1503,
    FLOURISH: 1509,
    TEST_MODE_CLICK: 1130,
    TEST_MODE_SUCCESS: 1114,
  },
  android: {
    LONG_PRESS_ACTIVATE: 'DOT_START',
    LONG_PRESS_CANCEL: 'DOT_STOP',
    ADD_GEOFENCE: 'DOT_SUCCESS',
    BUTTON_CLICK: 'BUTTON_CLICK',
    MESSAGE_SENT: 'WHOO_SEND_SHARE',
    ERROR: 'ERROR',
    OPEN: 'OPEN',
    CLOSE: 'CLOSE',
    FLOURISH: 'MOTIONCHANGE_TRUE',
    TEST_MODE_CLICK: 'POP',
    TEST_MODE_SUCCESS: 'BEEP_ON',
  },
};

let instance: TSDialog | null = null;

export default class TSDialog {
  private platform = '';
  private _toast: ((message: string, duration: number) => void) | null = null;

  static getInstance(): TSDialog {
    if (!instance) {
      instance = new TSDialog();
    }
    return instance;
  }

  constructor() {
    BackgroundGeolocation.getDeviceInfo().then((info: any) => {
      this.platform = info.platform.toLowerCase();
    });
  }

  /** Inject an Ionic toast renderer from the host App. */
  setToast(fn: (message: string, duration: number) => void) {
    this._toast = fn;
  }

  // ── Dialogs (native, renders above the map) ─────────────────────────────

  async prompt(title: string, message: string | null, placeholder?: string): Promise<any> {
    const { value, cancelled } = await Dialog.prompt({
      title,
      message: message || '',
      inputPlaceholder: placeholder || '',
      okButtonTitle: 'Ok',
      cancelButtonTitle: 'Cancel',
    });
    if (cancelled) throw 'cancelled';
    return value;
  }

  async confirm(title: string, message: string): Promise<boolean> {
    const { value } = await Dialog.confirm({
      title,
      message,
      okButtonTitle: 'Ok',
      cancelButtonTitle: 'Cancel',
    });
    return value;
  }

  async yesNo(title: string, message: string): Promise<boolean> {
    const { value } = await Dialog.confirm({
      title,
      message,
      okButtonTitle: 'Yes',
      cancelButtonTitle: 'No',
    });
    return value;
  }

  async alert(title: string, message: string, buttons?: any[]) {
    if (buttons && buttons.length > 1) {
      const { value } = await Dialog.confirm({
        title,
        message: message || '',
        okButtonTitle: buttons[buttons.length - 1]?.text || 'Ok',
        cancelButtonTitle: buttons[0]?.text || 'Cancel',
      });
      const btn = value ? buttons[buttons.length - 1] : buttons[0];
      if (btn?.handler) btn.handler();
    } else {
      await Dialog.alert({ title, message: message || '' });
      if (buttons?.[0] && typeof buttons[0] === 'object' && buttons[0].handler) {
        buttons[0].handler();
      }
    }
  }

  // ── Toast ────────────────────────────────────────────────────────────────

  toast(message: string, duration = 3000) {
    if (this._toast) {
      this._toast(message, duration);
    } else {
      console.info('[Toast]', message);
    }
  }

  // ── Sounds ───────────────────────────────────────────────────────────────

  playSound(name: string | number) {
    let soundId: any = 0;
    if (typeof name === 'string') {
      soundId = SOUND_MAP[this.platform]?.[name] ?? 0;
    } else {
      soundId = name;
    }
    if (!soundId) {
      console.warn('[TSDialog] Invalid sound:', name);
      return;
    }
    BackgroundGeolocation.playSound(soundId);
  }
}
