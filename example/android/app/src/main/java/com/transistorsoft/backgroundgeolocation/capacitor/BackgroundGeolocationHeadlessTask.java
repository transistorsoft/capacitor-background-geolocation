package com.transistorsoft.backgroundgeolocation.capacitor;

import android.util.Log;

import com.transistorsoft.locationmanager.adapter.BackgroundGeolocation;
import com.transistorsoft.locationmanager.event.HeadlessEvent;

import org.greenrobot.eventbus.Subscribe;

public class BackgroundGeolocationHeadlessTask {
  @Subscribe
  public void onHeadlessEvent(HeadlessEvent event) {
    Log.d(BackgroundGeolocation.TAG, "\uD83D\uDC80  event: " + event.getName());
    Log.d(BackgroundGeolocation.TAG,  "*************** Event: " + event.getEvent());

  }
}
