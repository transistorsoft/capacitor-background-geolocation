package com.transistorsoft.backgroundgeolocation.capacitor;

import android.content.Context;
import android.util.Log;

import com.transistorsoft.tsbackgroundfetch.BackgroundFetch;
import com.transistorsoft.tsbackgroundfetch.BGTask;

public class BackgroundFetchHeadlessTask{
    public void onFetch(Context context,  BGTask task) {
        // Get a reference to the BackgroundFetch Android API.
        BackgroundFetch backgroundFetch = BackgroundFetch.getInstance(context);
        // Get the taskId.
        String taskId = task.getTaskId();
        // Log a message to adb logcat.
        Log.d(BackgroundFetch.TAG, "BackgroundFetchHeadlessTask onFetch -- CUSTOM IMPLEMENTATION: " + taskId);

        boolean isTimeout = task.getTimedOut();
        // Is this a timeout?
        if (isTimeout) {
          backgroundFetch.finish(taskId);
          return;
        }
        // Do your work here...
        //
        //
        // Signal finish just like the Javascript API.
        backgroundFetch.finish(taskId);
    }
}