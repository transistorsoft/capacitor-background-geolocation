package com.transistorsoft.backgroundgeolocation.capacitor;

import org.greenrobot.eventbus.Subscribe;
import org.greenrobot.eventbus.ThreadMode;

import org.json.JSONObject;

import com.transistorsoft.locationmanager.adapter.BackgroundGeolocation;
import com.transistorsoft.locationmanager.event.ActivityChangeEvent;
import com.transistorsoft.locationmanager.event.ConnectivityChangeEvent;
import com.transistorsoft.locationmanager.event.GeofenceEvent;
import com.transistorsoft.locationmanager.event.HeadlessEvent;
import com.transistorsoft.locationmanager.event.HeartbeatEvent;
import com.transistorsoft.locationmanager.event.MotionChangeEvent;
import com.transistorsoft.locationmanager.event.LocationProviderChangeEvent;
import com.transistorsoft.locationmanager.http.HttpResponse;
import com.transistorsoft.locationmanager.location.TSLocation;
import com.transistorsoft.locationmanager.logger.TSLog;
import android.util.Log;

/**
 * BackgroundGeolocationHeadlessTask
 * This component allows you to receive events from the BackgroundGeolocation plugin in the native Android environment while your app has been *terminated*,
 * where the plugin is configured for stopOnTerminate: false.  In this context, only the plugin's service is running.  This component will receive all the same
 * events you'd listen to in the Javascript API.
 *
 * You might use this component to:
 * - fetch / post information to your server (eg: request new API key)
 * - execute BackgroundGeolocation API methods (eg: #getCurrentPosition, #setConfig, #addGeofence, #stop, etc -- you can execute ANY method of the Javascript API)
 */

public class BackgroundGeolocationHeadlessTask  {
    private static final String TAG = "TSLocationManager";

    @Subscribe(threadMode=ThreadMode.MAIN)
    public void onHeadlessTask(HeadlessEvent event) {
        // Get a reference to the BackgroundGeolocation Android API.
        BackgroundGeolocation bgGeo = BackgroundGeolocation.getInstance(event.getContext());

        String name = event.getName();
        Log.d(TAG, "\uD83D\uDC80 capacitor-background-geolocation event: " + event.getName());
        Log.d(TAG, "- event: " + event.getEvent());

        if (name.equals(BackgroundGeolocation.EVENT_TERMINATE)) {
            JSONObject state = event.getTerminateEvent();
        } else if (name.equals(BackgroundGeolocation.EVENT_LOCATION)) {
            TSLocation location = event.getLocationEvent();
        } else if (name.equals(BackgroundGeolocation.EVENT_MOTIONCHANGE)) {
            MotionChangeEvent motionChangeEvent = event.getMotionChangeEvent();
            TSLocation location = motionChangeEvent.getLocation();
        } else if (name.equals(BackgroundGeolocation.EVENT_HTTP)) {
            HttpResponse response = event.getHttpEvent();
        } else if (name.equals(BackgroundGeolocation.EVENT_PROVIDERCHANGE)) {
            LocationProviderChangeEvent providerChange = event.getProviderChangeEvent();
        } else if (name.equals(BackgroundGeolocation.EVENT_PROVIDERCHANGE)) {
            LocationProviderChangeEvent providerChange = event.getProviderChangeEvent();
        } else if (name.equals(BackgroundGeolocation.EVENT_ACTIVITYCHANGE)) {
            ActivityChangeEvent activityChange = event.getActivityChangeEvent();
        } else if (name.equals(BackgroundGeolocation.EVENT_SCHEDULE)) {
            JSONObject state = event.getScheduleEvent();
        } else if (name.equals(BackgroundGeolocation.EVENT_BOOT)) {
            JSONObject state = event.getBootEvent();
        } else if (name.equals(BackgroundGeolocation.EVENT_GEOFENCE)) {
            GeofenceEvent geofenceEvent = event.getGeofenceEvent();
        } else if (name.equals(BackgroundGeolocation.EVENT_HEARTBEAT)) {
            HeartbeatEvent heartbeatEvent = event.getHeartbeatEvent();
        } else if (name.equals(BackgroundGeolocation.EVENT_ENABLEDCHANGE)) {
            boolean enabled = event.getEnabledChangeEvent();
        } else if (name.equals(BackgroundGeolocation.EVENT_CONNECTIVITYCHANGE)) {
            ConnectivityChangeEvent connectivityChangeEvent = event.getConnectivityChangeEvent();
        } else if (name.equals(BackgroundGeolocation.EVENT_POWERSAVECHANGE)) {
            boolean powerSaveEnabled = event.getPowerSaveChangeEvent().isPowerSaveMode();
        } else {
            Log.d(TAG, "Unknown Headless Event: " + name);
        }
    }
}