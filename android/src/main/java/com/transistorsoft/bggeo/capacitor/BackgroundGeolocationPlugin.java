package com.transistorsoft.bggeo.capacitor;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.common.GoogleApiAvailability;
import com.transistorsoft.locationmanager.adapter.BackgroundGeolocation;
import com.transistorsoft.locationmanager.adapter.TSConfig;
import com.transistorsoft.locationmanager.adapter.callback.TSActivityChangeCallback;
import com.transistorsoft.locationmanager.adapter.callback.TSBackgroundTaskCallback;
import com.transistorsoft.locationmanager.adapter.callback.TSCallback;
import com.transistorsoft.locationmanager.adapter.callback.TSConnectivityChangeCallback;
import com.transistorsoft.locationmanager.adapter.callback.TSEmailLogCallback;
import com.transistorsoft.locationmanager.adapter.callback.TSEnabledChangeCallback;
import com.transistorsoft.locationmanager.adapter.callback.TSGeofenceCallback;
import com.transistorsoft.locationmanager.adapter.callback.TSGeofenceExistsCallback;
import com.transistorsoft.locationmanager.adapter.callback.TSGeofencesChangeCallback;
import com.transistorsoft.locationmanager.adapter.callback.TSGetCountCallback;
import com.transistorsoft.locationmanager.adapter.callback.TSGetGeofenceCallback;
import com.transistorsoft.locationmanager.adapter.callback.TSGetGeofencesCallback;
import com.transistorsoft.locationmanager.adapter.callback.TSGetLocationsCallback;
import com.transistorsoft.locationmanager.adapter.callback.TSGetLogCallback;
import com.transistorsoft.locationmanager.adapter.callback.TSHeartbeatCallback;
import com.transistorsoft.locationmanager.adapter.callback.TSHttpResponseCallback;
import com.transistorsoft.locationmanager.adapter.callback.TSInsertLocationCallback;
import com.transistorsoft.locationmanager.adapter.callback.TSLocationCallback;
import com.transistorsoft.locationmanager.adapter.callback.TSLocationProviderChangeCallback;
import com.transistorsoft.locationmanager.adapter.callback.TSNotificationActionCallback;
import com.transistorsoft.locationmanager.adapter.callback.TSPlayServicesConnectErrorCallback;
import com.transistorsoft.locationmanager.adapter.callback.TSPowerSaveChangeCallback;
import com.transistorsoft.locationmanager.adapter.callback.TSRequestPermissionCallback;
import com.transistorsoft.locationmanager.adapter.callback.TSScheduleCallback;
import com.transistorsoft.locationmanager.adapter.callback.TSSyncCallback;
import com.transistorsoft.locationmanager.config.TSAuthorization;
import com.transistorsoft.locationmanager.config.TransistorAuthorizationToken;
import com.transistorsoft.locationmanager.data.LocationModel;
import com.transistorsoft.locationmanager.data.SQLQuery;
import com.transistorsoft.locationmanager.device.DeviceInfo;
import com.transistorsoft.locationmanager.device.DeviceSettingsRequest;
import com.transistorsoft.locationmanager.event.ActivityChangeEvent;
import com.transistorsoft.locationmanager.event.ConnectivityChangeEvent;
import com.transistorsoft.locationmanager.event.GeofenceEvent;
import com.transistorsoft.locationmanager.event.GeofencesChangeEvent;
import com.transistorsoft.locationmanager.event.HeartbeatEvent;
import com.transistorsoft.locationmanager.event.LocationProviderChangeEvent;
import com.transistorsoft.locationmanager.event.TerminateEvent;
import com.transistorsoft.locationmanager.geofence.TSGeofence;
import com.transistorsoft.locationmanager.http.HttpResponse;
import com.transistorsoft.locationmanager.location.TSCurrentPositionRequest;
import com.transistorsoft.locationmanager.location.TSLocation;
import com.transistorsoft.locationmanager.location.TSWatchPositionRequest;
import com.transistorsoft.locationmanager.logger.TSLog;
import com.transistorsoft.locationmanager.scheduler.ScheduleEvent;
import com.transistorsoft.locationmanager.scheduler.TSScheduleManager;
import com.transistorsoft.locationmanager.util.Sensors;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "BackgroundGeolocation")
public class BackgroundGeolocationPlugin extends Plugin {

    private boolean mReady;

    private static final String BACKGROUND_GEOLOCATION_HEADLESS_CLASSNAME = "BackgroundGeolocationHeadlessTask";

    private static final String EVENT_WATCHPOSITION = "watchposition";

    @Override
    public void load() {
        super.load();

        TSLog.logger.debug("");

        TSConfig config = TSConfig.getInstance(getContext());
        config.useCLLocationAccuracy(true);
        config.updateWithBuilder()
                .setHeadlessJobService(getHeadlessJobService())
                .commit();

        BackgroundGeolocation bgGeo = BackgroundGeolocation.getInstance(getContext());
        Activity activity = getActivity();
        if (activity != null) {
            bgGeo.setActivity(activity);
        }
        registerEventListeners();
    }

    private void handlePlayServicesConnectError(Integer errorCode) {
        Activity activity = getActivity();
        GoogleApiAvailability.getInstance().getErrorDialog(activity, errorCode, 1001).show();
    }

    @PluginMethod()
    public void registerPlugin(PluginCall call) {
        JSObject result = new JSObject();
        call.resolve(result);
    }

    @PluginMethod()
    public void ready(PluginCall call) throws JSONException {
        JSObject params = call.getObject("options");

        final TSConfig config = TSConfig.getInstance(getContext());

        boolean reset = true;
        if (params.has("reset")) {
            reset = params.getBoolean("reset");
        }

        if (mReady) {
            if (reset) {
                TSLog.logger.warn(TSLog.warn("#ready already called.  Redirecting to #setConfig"));
                setConfig(call);
            } else {
                TSLog.logger.warn(TSLog.warn("#ready already called.  Ignored"));
                call.resolve(JSObject.fromJSONObject(config.toJson()));
            }
            return;
        }
        mReady = true;

        BackgroundGeolocation adapter = BackgroundGeolocation.getInstance(getContext());

        if (config.isFirstBoot()) {
            config.updateWithJSONObject(setHeadlessJobService(params));
        } else {
            if (reset) {
                config.reset();
                config.updateWithJSONObject(setHeadlessJobService(params));
            } else if (params.has(TSAuthorization.NAME)) {
                JSONObject options = params.getJSONObject(TSAuthorization.NAME);
                config.updateWithBuilder()
                        .setAuthorization(new TSAuthorization(options, false))
                        .commit();
            }
        }
        adapter.ready(new TSCallback() {
            @Override public void onSuccess() {
                try {
                    call.resolve(JSObject.fromJSONObject(config.toJson()));
                } catch (JSONException e) {
                    call.reject(e.getMessage());
                }
            }
            @Override public void onFailure(String error) {
                call.reject(error);
            }
        });
    }

    @PluginMethod()
    public void reset(PluginCall call) {
        JSObject params = call.getObject("options");
        TSConfig config = TSConfig.getInstance(getContext());
        config.reset();
        config.updateWithJSONObject(setHeadlessJobService(params));
        try {
            call.resolve(JSObject.fromJSONObject(config.toJson()));
        } catch (JSONException e) {
            call.reject(e.getMessage());
        }
    }

    @PluginMethod()
    public void setConfig(PluginCall call) throws JSONException {
        TSConfig config = TSConfig.getInstance(getContext());
        JSObject params = call.getObject("options");
        config.updateWithJSONObject(params);
        call.resolve(JSObject.fromJSONObject(config.toJson()));
    }

    @PluginMethod()
    public void getState(PluginCall call) {
        try {
            TSConfig config = TSConfig.getInstance(getContext());
            call.resolve(JSObject.fromJSONObject(config.toJson()));
        } catch (JSONException e) {
            call.reject(e.getMessage());
        }
    }

    @PluginMethod()
    public void start(final PluginCall call) {
        final TSConfig config = TSConfig.getInstance(getContext());
        getAdapter().start(new TSCallback() {
            @Override public void onSuccess() {
                try {
                    call.resolve(JSObject.fromJSONObject(config.toJson()));
                } catch (JSONException e) {
                    call.reject(e.getMessage());
                }
            }
            @Override public void onFailure(String error) {
                call.reject(error);
            }
        });
    }

    @PluginMethod()
    public void startSchedule(PluginCall call) {
        if (getAdapter().startSchedule()) {
            TSConfig config = TSConfig.getInstance(getContext());
            try {
                call.resolve(JSObject.fromJSONObject(config.toJson()));
            } catch (JSONException e) {
                call.reject(e.getMessage());
            }
        } else {
            call.reject("Failed to start schedule.  Did you configure a #schedule?");
        }
    }

    @PluginMethod()
    public void stopSchedule(PluginCall call) {
        getAdapter().stopSchedule();
        call.resolve();
    }

    private class StartGeofencesCallback implements TSCallback {
        private PluginCall mCallback;
        public StartGeofencesCallback(PluginCall call) {
            mCallback = call;
        }
        @Override public void onSuccess() {
            try {
                mCallback.resolve(JSObject.fromJSONObject(TSConfig.getInstance(getContext()).toJson()));
            } catch (JSONException e) {
                mCallback.reject(e.getMessage());
            }
        }
        @Override public void onFailure(String error) {
            mCallback.reject(error);
        }
    }

    @PluginMethod()
    public void startGeofences(final PluginCall call) {
        getAdapter().startGeofences(new StartGeofencesCallback(call));
    }

    @PluginMethod()
    public void stop(PluginCall call) {
        getAdapter().stop(new StopCallback(call));
    }

    private class StopCallback implements TSCallback {
        private PluginCall mCallback;
        public StopCallback(PluginCall call) {
            mCallback = call;
        }
        @Override public void onSuccess() {
            try {
                mCallback.resolve(JSObject.fromJSONObject(TSConfig.getInstance(getContext()).toJson()));
            } catch (JSONException e) {
                mCallback.reject(e.getMessage());
            }
        }
        @Override public void onFailure(String error) {
            mCallback.reject(error);
        }
    }

    @PluginMethod()
    public void changePace(final PluginCall call) {
        boolean isMoving = call.getBoolean("isMoving", false);
        getAdapter().changePace(isMoving, new TSCallback() {
            @Override public void onSuccess() {
                call.resolve();
            }
            @Override public void onFailure(String error) { call.reject(error); }
        });
    }

    @PluginMethod()
    public void getProviderState(PluginCall call) {
        try {
            call.resolve(JSObject.fromJSONObject(getAdapter().getProviderState().toJson()));
        } catch (JSONException e) {
            call.reject(e.getMessage());
        }
    }

    @PluginMethod()
    public void requestPermission(final PluginCall call) {
        getAdapter().requestPermission(new TSRequestPermissionCallback() {
            @Override public void onSuccess(int status) {
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("status", status);
                call.resolve(result);
            }
            @Override public void onFailure(int status) {
                JSObject result = new JSObject();
                result.put("success", false);
                result.put("status", status);
                call.resolve(result);
            }
        });
    }

    @PluginMethod()
    public void requestTemporaryFullAccuracy(final PluginCall call) {
        String purpose = call.getString("purpose");
        getAdapter().requestTemporaryFullAccuracy(purpose, new TSRequestPermissionCallback() {
            @Override public void onSuccess(int accuracyAuthorization) {
                JSObject result = new JSObject();
                result.put("accuracyAuthorization", accuracyAuthorization);
                call.resolve(result);
            }
            @Override public void onFailure(int accuracyAuthorization) {
                JSObject result = new JSObject();
                result.put("accuracyAuthorization", accuracyAuthorization);
                call.resolve(result);
            }
        });
    }

    @PluginMethod()
    public void sync(final PluginCall call) {
        getAdapter().sync(new TSSyncCallback() {
            @Override public void onSuccess(List<LocationModel> records) {
                JSArray data = new JSArray();
                for (LocationModel location : records) {
                    data.put(location.json);
                }
                JSObject params = new JSObject();
                params.put("locations", data);
                call.resolve(params);
            }
            @Override public void onFailure(String error) {
                call.reject(error);
            }
        });
    }

    @PluginMethod()
    public void getCurrentPosition(final PluginCall call) {
        JSObject options = call.getObject("options");
        TSCurrentPositionRequest.Builder builder = new TSCurrentPositionRequest.Builder(getContext());

        builder.setCallback(new TSLocationCallback() {
            @Override public void onLocation(TSLocation location) {
                try {
                    call.resolve(JSObject.fromJSONObject(location.toJson()));
                } catch (JSONException e) {
                    call.reject(e.getMessage());
                }
            }
            @Override public void onError(Integer error) { call.reject(error.toString()); }
        });

        try {
            if (options.has("samples")) {
                builder.setSamples(options.getInt("samples"));
            }
            if (options.has("extras")) {
                builder.setExtras(options.getJSONObject("extras"));
            }
            if (options.has("persist")) {
                builder.setPersist(options.getBoolean("persist"));
            }
            if (options.has("timeout")) {
                builder.setTimeout(options.getInt("timeout"));
            }
            if (options.has("maximumAge")) {
                builder.setMaximumAge(options.getLong("maximumAge"));
            }
            if (options.has("desiredAccuracy")) {
                builder.setDesiredAccuracy(options.getInt("desiredAccuracy"));
            }

            getAdapter().getCurrentPosition(builder.build());
        } catch (JSONException e) {
            e.printStackTrace();
            call.reject(e.getMessage());
        }
    }

    @PluginMethod()
    public void watchPosition(final PluginCall call) {
        JSObject options = call.getObject("options");

        TSWatchPositionRequest.Builder builder = new TSWatchPositionRequest.Builder(getContext());

        builder.setCallback(new TSLocationCallback() {
            @Override public void onLocation(TSLocation tsLocation) {
                try {
                    if (!hasListeners(EVENT_WATCHPOSITION)) {
                        getAdapter().stopWatchPosition(new TSCallback() {
                            @Override public void onSuccess() { }
                            @Override public void onFailure(String s) { }
                        });
                        return;
                    }
                    notifyListeners(EVENT_WATCHPOSITION, JSObject.fromJSONObject(tsLocation.toJson()));
                } catch (JSONException e) {
                    /// This will probably never fire, but...
                    e.printStackTrace();
                    JSObject result = new JSObject();
                    JSObject error = new JSObject();
                    error.put("code", -1);
                    result.put("error", error);
                    notifyListeners(EVENT_WATCHPOSITION, error);
                }
            }
            @Override public void onError(Integer code) {
                JSObject result = new JSObject();
                JSObject error = new JSObject();
                error.put("code", code);
                result.put("error", error);
                notifyListeners(EVENT_WATCHPOSITION, result);
            }
        });

        try {
            if (options.has("interval")) {
                builder.setInterval((long) options.getInt("interval"));
            }
            if (options.has("extras")) {
                builder.setExtras(options.getJSONObject("extras"));
            }
            if (options.has("persist")) {
                builder.setPersist(options.getBoolean("persist"));
            }
            if (options.has("desiredAccuracy")) {
                builder.setDesiredAccuracy(options.getInt("desiredAccuracy"));
            }
            getAdapter().watchPosition(builder.build());
            call.resolve();
        } catch (JSONException e) {
            e.printStackTrace();
            call.reject(e.getMessage());
        }
    }

    @PluginMethod()
    public void stopWatchPosition(final PluginCall call) {
        getAdapter().stopWatchPosition(new TSCallback() {
            @Override public void onSuccess() { call.resolve(); }
            @Override public void onFailure(String error) {
                call.reject(error);
            }
        });
    }

    /// Geofencing
    @PluginMethod()
    public void addGeofence(final PluginCall call) {
        JSObject config = call.getObject("options");
        try {
            getAdapter().addGeofence(buildGeofence(config), new TSCallback() {
                @Override public void onSuccess() { call.resolve(); }
                @Override public void onFailure(String error) { call.reject(error); }
            });
        } catch(JSONException | TSGeofence.Exception e) {
            call.reject(e.getMessage());
        }
    }

    @PluginMethod()
    public void addGeofences(final PluginCall call) {
        JSArray data = call.getArray("options");
        List<TSGeofence> geofences = new ArrayList<TSGeofence>();
        for (int i = 0; i < data.length(); i++) {
            try {
                geofences.add(buildGeofence(data.getJSONObject(i)));
            } catch (JSONException | TSGeofence.Exception e) {
                call.reject(e.getMessage());
                return;
            }
        }
        getAdapter().addGeofences(geofences, new TSCallback() {
            @Override public void onSuccess() {
                call.resolve();
            }
            @Override public void onFailure(String error) {
                call.reject(error);
            }
        });
    }

    private TSGeofence buildGeofence(JSONObject config) throws JSONException, TSGeofence.Exception {
        TSGeofence.Builder builder = new TSGeofence.Builder();
        if (config.has("identifier"))       { builder.setIdentifier(config.getString("identifier")); }
        if (config.has("latitude"))         { builder.setLatitude(config.getDouble("latitude")); }
        if (config.has("longitude"))        { builder.setLongitude(config.getDouble("longitude")); }
        if (config.has("radius"))           { builder.setRadius((float) config.getDouble("radius")); }
        if (config.has("notifyOnEntry"))    { builder.setNotifyOnEntry(config.getBoolean("notifyOnEntry")); }
        if (config.has("notifyOnExit"))     { builder.setNotifyOnExit(config.getBoolean("notifyOnExit")); }
        if (config.has("notifyOnDwell"))    { builder.setNotifyOnDwell(config.getBoolean("notifyOnDwell")); }
        if (config.has("loiteringDelay"))   { builder.setLoiteringDelay(config.getInt("loiteringDelay")); }
        if (config.has("extras"))           { builder.setExtras(config.getJSONObject("extras")); }
        return builder.build();
    }

    @PluginMethod()
    public void getGeofences(final PluginCall call) {
        getAdapter().getGeofences(new TSGetGeofencesCallback() {
            @Override public void onSuccess(List<TSGeofence> geofences) {
                JSArray data = new JSArray();
                for (TSGeofence geofence : geofences) {
                    data.put(geofence.toJson());
                }
                JSObject result = new JSObject();
                result.put("geofences", data);
                call.resolve(result);
            }
            @Override public void onFailure(String error) {
                call.reject(error);
            }
        });
    }

    @PluginMethod()
    public void getGeofence(final PluginCall call) {
        String identifier = call.getString("identifier");
        getAdapter().getGeofence(identifier, new TSGetGeofenceCallback() {
            @Override public void onSuccess(TSGeofence geofence) {
                try {
                    call.resolve(JSObject.fromJSONObject(geofence.toJson()));
                } catch(JSONException e) {
                    e.printStackTrace();
                    call.reject(e.getMessage());
                }
            }
            @Override public void onFailure(String error) {
                call.reject(error);
            }
        });
    }

    @PluginMethod()
    public void geofenceExists(final PluginCall call) {
        String identifier = call.getString("identifier");
        getAdapter().geofenceExists(identifier, new TSGeofenceExistsCallback() {
            @Override public void onResult(boolean exists) {
                JSObject result = new JSObject();
                result.put("exists", exists);
                call.resolve(result);
            }
        });
    }

    @PluginMethod()
    public void removeGeofence(final PluginCall call) {
        String identifier = call.getString("identifier");
        getAdapter().removeGeofence(identifier, new TSCallback() {
            @Override public void onSuccess() {
                call.resolve();
            }
            @Override public void onFailure(String error) {
                call.reject(error);
            }
        });
    }

    @PluginMethod()
    public void removeGeofences(final PluginCall call) {
        final JSArray identifiers = call.getArray("identifiers");
        List<String> rs = new ArrayList<String>();
        try {
            for (int i = 0; i < identifiers.length(); i++) {
                rs.add(identifiers.getString(i));
            }
            getAdapter().removeGeofences(rs, new TSCallback() {
                @Override public void onSuccess() {
                    call.resolve();
                }
                @Override public void onFailure(String error) {
                    call.reject(error);
                }
            });
        } catch (JSONException e) {
            call.reject(e.getMessage());
            e.printStackTrace();
        }
    }

    @PluginMethod()
    public void getOdometer(PluginCall call) {
        JSObject result = new JSObject();
        result.put("odometer", getAdapter().getOdometer());
        call.resolve(result);
    }

    @PluginMethod()
    public void setOdometer(final PluginCall call) {
        Float value = call.getFloat("odometer");
        getAdapter().setOdometer(value, new TSLocationCallback() {
            @Override public void onLocation(TSLocation location) {
                try {
                    call.resolve(JSObject.fromJSONObject(location.toJson()));
                } catch (JSONException e) {
                    e.printStackTrace();
                    call.reject(e.getMessage());
                }
            }
            @Override public void onError(Integer error) {
                call.reject(error.toString());
            }
        });
    }

    /// Locations Database

    @PluginMethod()
    public void getLocations(final PluginCall call) {
        getAdapter().getLocations(new TSGetLocationsCallback() {
            @Override public void onSuccess(List<LocationModel> locations) {
                JSArray data = new JSArray();
                for (LocationModel location : locations) {
                    data.put(location.json);
                }
                JSObject params = new JSObject();
                params.put("locations", data);
                call.resolve(params);
            }
            @Override public void onFailure(Integer error) {
                call.reject(error.toString());
            }
        });
    }

    @PluginMethod()
    public void getCount(final PluginCall call) {
        getAdapter().getCount(new TSGetCountCallback() {
            @Override public void onSuccess(Integer count) {
                JSObject params = new JSObject();
                params.put("count", count);
                call.resolve(params);
            }
            @Override public void onFailure(String error) {
                call.reject(error);
            }
        });
    }

    @PluginMethod()
    public void insertLocation(final PluginCall call) {
        JSObject params = call.getObject("options");

        getAdapter().insertLocation(params, new TSInsertLocationCallback() {
            @Override public void onSuccess(String uuid) {
                JSObject result = new JSObject();
                result.put("uuid", uuid);
                call.resolve(result);
            }
            @Override public void onFailure(String error) {
                call.reject(error);
            }
        });
    }

    @PluginMethod()
    public void destroyLocations(final PluginCall call) {
        getAdapter().destroyLocations(new TSCallback() {
            @Override public void onSuccess() {
                call.resolve();
            }
            @Override public void onFailure(String error) {
                call.reject(error);
            }
        });
    }

    @PluginMethod()
    public void destroyLocation(final PluginCall call) {
        String uuid = call.getString("uuid");
        getAdapter().destroyLocation(uuid, new TSCallback() {
            @Override public void onSuccess() {
                call.resolve();
            }
            @Override public void onFailure(String error) {
                call.reject(error);
            }
        });
    }

    /// Background tasks.
    @PluginMethod()
    public void startBackgroundTask(final PluginCall call) {
        getAdapter().startBackgroundTask(new TSBackgroundTaskCallback() {
            @Override public void onStart(int taskId) {
                JSObject result = new JSObject();
                result.put("taskId", taskId);
                call.resolve(result);
            }
        });
    }

    @PluginMethod()
    public void stopBackgroundTask(PluginCall call) {
        int taskId = call.getInt("taskId");
        getAdapter().stopBackgroundTask(taskId);
        call.resolve();
    }

    /// Logging

    @PluginMethod()
    public void getLog(final PluginCall call) {
        JSONObject params = call.getObject("options");
        try {
            TSLog.getLog(parseSQLQuery(params), new TSGetLogCallback() {
                @Override
                public void onSuccess(String log) {
                    JSObject result = new JSObject();
                    result.put("log", log);
                    call.resolve(result);
                }

                @Override
                public void onFailure(String error) {
                    call.reject(error);
                }
            });
        } catch (JSONException e) {
            e.printStackTrace();
            call.reject(e.getMessage());
        }
    }

    @PluginMethod()
    public void destroyLog(final PluginCall call) {
        TSLog.destroyLog(new TSCallback() {
            @Override public void onSuccess() {
                call.resolve();
            }
            @Override public void onFailure(String error) {
                call.reject(error);
            }
        });
    }

    @PluginMethod()
    public void emailLog(final PluginCall call) {
        String email = call.getString("email");
        JSONObject query = call.getObject("query");

        try {
            TSLog.emailLog(getActivity(), email, parseSQLQuery(query), new TSEmailLogCallback() {
                @Override
                public void onSuccess() {
                    call.resolve();
                }

                @Override
                public void onFailure(String error) {
                    call.reject(error);
                }
            });
        } catch (JSONException e) {
            e.printStackTrace();
            call.reject(e.getMessage());
        }
    }

    @PluginMethod()
    public void uploadLog(final PluginCall call) {
        String url = call.getString("url");
        JSONObject query = call.getObject("query");
        try {
            TSLog.uploadLog(getContext().getApplicationContext(), url, parseSQLQuery(query), new TSCallback() {
                @Override
                public void onSuccess() {
                    call.resolve();
                }

                @Override
                public void onFailure(String error) {
                    call.reject(error);
                }
            });
        } catch (JSONException e) {
            e.printStackTrace();
            call.reject(e.getMessage());
        }
    }

    private SQLQuery parseSQLQuery(JSONObject params) throws JSONException {
        SQLQuery query = SQLQuery.create();
        if (params.has(SQLQuery.FIELD_START)) {
            query.setStart(params.getLong(SQLQuery.FIELD_START));
        }
        if (params.has(SQLQuery.FIELD_END)) {
            query.setEnd(params.getLong(SQLQuery.FIELD_END));
        }
        if (params.has(SQLQuery.FIELD_ORDER)) {
            query.setOrder(params.getInt(SQLQuery.FIELD_ORDER));
        }
        if (params.has(SQLQuery.FIELD_LIMIT )) {
            query.setLimit(params.getInt(SQLQuery.FIELD_LIMIT));
        }
        return query;
    }

    @PluginMethod()
    public void log(PluginCall call) {
        String level = call.getString("level");
        String message = call.getString("message");
        TSLog.log(level, message);
        call.resolve();
    }

    /// Device Settings

    @PluginMethod()
    public void getSensors(PluginCall call) {
        JSObject result = new JSObject();
        Sensors sensors = Sensors.getInstance(getContext());

        result.put("platform", "android");
        result.put("accelerometer", sensors.hasAccelerometer());
        result.put("magnetometer", sensors.hasMagnetometer());
        result.put("gyroscope", sensors.hasGyroscope());
        result.put("significant_motion", sensors.hasSignificantMotion());
        call.resolve(result);
    }

    @PluginMethod()
    public void getDeviceInfo(PluginCall call) {
        JSONObject result = DeviceInfo.getInstance(getContext()).toJson();
        try {
            call.resolve(JSObject.fromJSONObject(result));
        } catch (JSONException e) {
            e.printStackTrace();
            call.reject(e.getMessage());
        }
    }

    @PluginMethod()
    public void isPowerSaveMode(PluginCall call) {
        JSObject result = new JSObject();
        result.put("isPowerSaveMode", getAdapter().isPowerSaveMode());
        call.resolve(result);
    }

    @PluginMethod()
    public void isIgnoringBatteryOptimizations(PluginCall call) {
        JSObject result = new JSObject();
        result.put("isIgnoringBatteryOptimizations", getAdapter().isIgnoringBatteryOptimizations());
        call.resolve(result);
    }

    @PluginMethod()
    public void requestSettings(PluginCall call) {
        String action = call.getString("action");
        DeviceSettingsRequest request = getAdapter().requestSettings(action);
        if (request != null) {
            try {
                call.resolve(JSObject.fromJSONObject(request.toJson()));
            } catch (JSONException e) {
                e.printStackTrace();
                call.reject(e.getMessage());
            }
        } else {
            call.reject("Failed to find " + action + " screen for device " + Build.MANUFACTURER + " " + Build.MODEL + "@" + Build.VERSION.RELEASE);
        }
    }

    @PluginMethod()
    public void showSettings(PluginCall call) {
        String action = call.getString("action");
        boolean didShow = getAdapter().showSettings(action);
        if (didShow) {
            call.resolve();
        } else {
            call.reject("Failed to find " + action + " screen for device " + Build.MANUFACTURER + " " + Build.MODEL + "@" + Build.VERSION.RELEASE);
        }
    }

    @PluginMethod()
    public void playSound(PluginCall call) {
        String soundId = call.getString("soundId");
        getAdapter().startTone(soundId);
        call.resolve();
    }

    /// TransistorAuthorizationToken
    ///
    @PluginMethod()
    public void getTransistorToken(final PluginCall call) {
        String orgname = call.getString("org");
        String username = call.getString("username");
        String url = call.getString("url");

        Context context = getContext();
        TransistorAuthorizationToken.findOrCreate(context, orgname, username, url, new TransistorAuthorizationToken.Callback() {
            @Override public void onSuccess(TransistorAuthorizationToken token) {
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("token", token.toJson());
                call.resolve(result);
            }
            @Override public void onFailure(String error) {
                JSObject result = new JSObject();
                result.put("success", false);
                result.put("status", error);
                result.put("message", error);
                call.resolve(result);
            }
        });
    }

    @PluginMethod()
    public void destroyTransistorToken(PluginCall call) {
        String url = call.getString("url");
        Context context = getContext();
        TransistorAuthorizationToken.destroyTokenForUrl(context, url, new TSCallback() {
            @Override public void onSuccess() {
                call.resolve();
            }
            @Override public void onFailure(String error) {
                call.reject(error);
            }
        });
    }

    @PluginMethod()
    public void removeAllEventListeners(PluginCall call) {
        removeAllListeners(call);
        TSLog.logger.debug("");
        call.resolve();
    }
    private BackgroundGeolocation getAdapter() {
        return BackgroundGeolocation.getInstance(getContext());
    }

    private JSONObject setHeadlessJobService(JSObject params) {
        params.put("headlessJobService", getHeadlessJobService());
        return params;
    }

    private String getHeadlessJobService() {
        return getActivity().getClass().getPackage().getName() + "." + BACKGROUND_GEOLOCATION_HEADLESS_CLASSNAME;
    }

    protected void handleOnPause() {

    }
    protected void handleOnStop() {
        Context context = getContext().getApplicationContext();
        TSConfig config = TSConfig.getInstance(context);
        if (config.getEnabled()) {
            TSScheduleManager.getInstance(context).oneShot(TerminateEvent.ACTION, 10000);
        }
    }

    protected void handleOnResume() {
        TSScheduleManager.getInstance(getContext()).cancelOneShot(TerminateEvent.ACTION);
    }

    protected void handleOnDestroy() {
        BackgroundGeolocation.getInstance(getContext()).onActivityDestroy();
    }

    private void registerEventListeners() {
        BackgroundGeolocation bgGeo = getAdapter();
        // Events
        bgGeo.onPlayServicesConnectError((new TSPlayServicesConnectErrorCallback() {
            @Override
            public void onPlayServicesConnectError(int errorCode) {
                handlePlayServicesConnectError(errorCode);
            }
        }));

        bgGeo.onLocation(new TSLocationCallback() {
            @Override
            public void onLocation(TSLocation tsLocation) {
                handleEvent(BackgroundGeolocation.EVENT_LOCATION, tsLocation.toJson());
            }

            @Override
            public void onError(Integer code) {
                if (!hasListeners(BackgroundGeolocation.EVENT_LOCATION)) return;
                JSObject result = new JSObject();
                result.put("error", code);
                notifyListeners(BackgroundGeolocation.EVENT_LOCATION, result);
            }
        });

        bgGeo.onMotionChange(new TSLocationCallback() {
            @Override public void onLocation(TSLocation location) {
                if (!hasListeners(BackgroundGeolocation.EVENT_MOTIONCHANGE)) return;
                JSObject params = new JSObject();
                params.put("isMoving", location.getIsMoving());
                params.put("location", location.toJson());
                notifyListeners(BackgroundGeolocation.EVENT_MOTIONCHANGE, params);
            }
            @Override public void onError(Integer integer) {
                if (!hasListeners(BackgroundGeolocation.EVENT_MOTIONCHANGE)) return;
                TSLog.logger.debug("onMotionChange error: " + integer);
            }
        });

        bgGeo.onActivityChange(new TSActivityChangeCallback() {
            @Override
            public void onActivityChange(ActivityChangeEvent event) {
                handleEvent(BackgroundGeolocation.EVENT_ACTIVITYCHANGE, event.toJson());
            }
        });

        bgGeo.onConnectivityChange(new TSConnectivityChangeCallback() {
            @Override
            public void onConnectivityChange(ConnectivityChangeEvent event) {
                if (!hasListeners(BackgroundGeolocation.EVENT_CONNECTIVITYCHANGE)) return;
                JSObject params = new JSObject();
                params.put("connected", event.hasConnection());
                notifyListeners(BackgroundGeolocation.EVENT_CONNECTIVITYCHANGE, params);
            }
        });

        bgGeo.onEnabledChange(new TSEnabledChangeCallback() {
            @Override
            public void onEnabledChange(boolean enabled) {
                if (!hasListeners(BackgroundGeolocation.EVENT_ENABLEDCHANGE)) return;
                JSObject params = new JSObject();
                params.put("value", enabled);
                notifyListeners(BackgroundGeolocation.EVENT_ENABLEDCHANGE, params);
            }
        });

        bgGeo.onGeofence(new TSGeofenceCallback() {
            @Override
            public void onGeofence(GeofenceEvent event) {
                handleEvent(BackgroundGeolocation.EVENT_GEOFENCE, event.toJson());
            }
        });

        bgGeo.onGeofencesChange(new TSGeofencesChangeCallback() {
            @Override
            public void onGeofencesChange(GeofencesChangeEvent event) {
                handleEvent(BackgroundGeolocation.EVENT_GEOFENCESCHANGE, event.toJson());
            }
        });

        bgGeo.onHeartbeat(new TSHeartbeatCallback() {
            @Override
            public void onHeartbeat(HeartbeatEvent event) {
                handleEvent(BackgroundGeolocation.EVENT_HEARTBEAT, event.toJson());
            }
        });

        bgGeo.onHttp(new TSHttpResponseCallback() {
            @Override
            public void onHttpResponse(HttpResponse event) {
                handleEvent(BackgroundGeolocation.EVENT_HTTP, event.toJson());
            }
        });

        bgGeo.onLocationProviderChange(new TSLocationProviderChangeCallback() {
            @Override
            public void onLocationProviderChange(LocationProviderChangeEvent event) {
                handleEvent(BackgroundGeolocation.EVENT_PROVIDERCHANGE, event.toJson());
            }
        });

        bgGeo.onNotificationAction(new TSNotificationActionCallback() {
            @Override
            public void onClick(String button) {
                if (!hasListeners(BackgroundGeolocation.EVENT_NOTIFICATIONACTION)) return;
                JSObject params = new JSObject();
                params.put("value", button);
                notifyListeners(BackgroundGeolocation.EVENT_NOTIFICATIONACTION, params);
            }
        });

        bgGeo.onPowerSaveChange(new TSPowerSaveChangeCallback() {
            @Override
            public void onPowerSaveChange(Boolean enabled) {
                if (!hasListeners(BackgroundGeolocation.EVENT_POWERSAVECHANGE)) return;
                JSObject params = new JSObject();
                params.put("value", enabled);
                notifyListeners(BackgroundGeolocation.EVENT_POWERSAVECHANGE, params);
            }
        });


        bgGeo.onSchedule(new TSScheduleCallback() {
            @Override
            public void onSchedule(ScheduleEvent event) {
                handleEvent(BackgroundGeolocation.EVENT_SCHEDULE, event.getState());
            }
        });
    }



    private void handleEvent(String name, JSONObject event) {
        if (!hasListeners(name)) return;
        try {
            JSObject params = JSObject.fromJSONObject(event);
            notifyListeners(name, params);
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }
}
