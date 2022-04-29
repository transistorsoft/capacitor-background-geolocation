package com.transistorsoft.backgroundgeolocation.capacitor;

import android.util.Log;

import com.transistorsoft.locationmanager.adapter.BackgroundGeolocation;
import com.transistorsoft.locationmanager.adapter.callback.TSBeforeInsertBlock;
import com.transistorsoft.locationmanager.location.TSLocation;

import org.json.JSONObject;

public class Application extends android.app.Application {
    @Override
    public void onCreate() {
        super.onCreate();

        /**
         * Undocumented feature:  This is a native hook for each location recorded by background-geolocation.
         * Return null to cancel the SQLite insert (and corresponding HTTP request)
         *
        BackgroundGeolocation.getInstance(this).setBeforeInsertBlock(new TSBeforeInsertBlock() {
            @Override
            public JSONObject onBeforeInsert(TSLocation tsLocation) {
                boolean doInsert = true;
                //
                // Your logic here
                //
                return (doInsert) ? tsLocation.toJson() : null;
            }
        });
        */
    }
}
