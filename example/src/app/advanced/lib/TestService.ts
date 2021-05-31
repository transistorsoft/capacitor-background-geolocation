//import {Platform} from 'ionic-angular';

/**
* @class BGService This is a wrapper for interacting with the BackgroundGeolocation plugin
* througout the app.
*/
export class TestService {
  private getCurrentPositionTask: any;
  private getLocationsTask: any;

  constructor() {

  }

  private getPlugin() {
    return (<any>window).BackgroundGeolocation;
  }

  startSqliteTest(delay) {
    this.getLocationsTask = setInterval(() => {
      this.getPlugin().getLocations(function(rs, tid) {
        console.log('- getLocations: ', rs.length);
        this.getPlugin().finish(tid);
      });
    }, delay);

    this.getCurrentPositionTask = setInterval(() => {
      this.getPlugin().getCurrentPosition(function(location, tid) {
        console.log('- getCurrentPosition');
        this.getPlugin().finish(tid);
      });
    }, delay);
  }

  stopSqliteTest() {
    clearInterval(this.getLocationsTask);
    clearInterval(this.getCurrentPositionTask);
  }

  addGeofenceTest(length, prefix, success, failure) {
    prefix = prefix || 'default';
    this.getPlugin().getCurrentPosition((location, taskId) => {
      for (var n=0;n<length;n++) {
        this.getPlugin().addGeofence({
          notifyOnExit: true,
          notifyOnEntry: true,
          identifier: 'geofence_' + prefix + '_' + n,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          radius: 200
        }, success, failure);
      }
      this.getPlugin().finish(taskId);
    });
  }

  addGeofencesTest(length, prefix, success, failure) {
    prefix = prefix || 'default';
    var rs = [];
    this.getPlugin().getCurrentPosition((location, taskId) => {
      for (var n=0;n<length;n++) {
        rs.push({
          notifyOnExit: true,
          notifyOnEntry: true,
          identifier: 'geofence_' + prefix + '_' + n,
          latitude: 1,
          longitude: 1,
          radius: 200
        });
      }
      this.getPlugin().addGeofences(rs, success, failure);
      this.getPlugin().finish(taskId);
    });
  }

  removeGeofencesTest(success, failure) {
    this.addGeofencesTest(1, 'remove_test', () => {
      this.getPlugin().getGeofences((rs) => {
        console.info('- getGeofences: ', rs.length);

        this.getPlugin().removeGeofences((response) => {
          console.log('- Success: ', response);
          this.getPlugin().getGeofences((rs) => {
            console.log('- removeGeofences: ', rs.length);
          });
        }, (error) => {
          console.warn('- Error: ', error);
        });
      });
    }, (error) => {
      console.warn('Add geofence error');
    });
  }

  insertLocations(length, success, failure) {
    this.getPlugin().getCurrentPosition((l, t) => {
      for (var i=0;i<length;i++) {
        this.getPlugin().insertLocation({
          coords: {
            latitude: l.coords.latitude,
            longitude: l.coords.longitude
          },
          timestamp: l.timestamp,
          uuid: 'uuid-' + i
        }, success, failure);
      }
    });
  }

  startGeofenceTest() {
    var geofences = [{
      identifier: "Geofence 1",
      notifyOnEntry: true,
      notifyOnExit: true,
      radius: 200,
      latitude: 45.5248868,
      longitude:  -73.6424362
    }, {
      identifier: "Geofence 2",
      notifyOnEntry: true,
      notifyOnExit: true,
      radius: 200,
      latitude: 45.5225079,
      longitude:  -73.6341922
    }, {
      identifier: "Geofence 3",
      notifyOnEntry: true,
      notifyOnExit: true,
      radius: 200,
      latitude: 45.5207131,
      longitude:  -73.6279527
    }]

    var result = {
      total: 0,
      ENTER: 0,
      EXIT: 0
    };

    this.getPlugin().removeGeofences();
    this.getPlugin().addGeofences(geofences);
    this.getPlugin().on('geofence', (event, tid) => {
      if (!result[event.action]) {
        result[event.action] = 0;
      }
      result[event.action]++;
      result.total++;
      console.log('- Geofence test: ', result);

      if (result.total === (2*geofences.length)) {
        if (result.ENTER === 3 && result.EXIT == 3) {
          this.getPlugin().changePace(false);
          alert('Geofence test SUCCESS');
          console.info('Geofence test success: ', result);
        }
      }

    });
    this.getPlugin().stop();
    this.getPlugin().start(() => {
      this.getPlugin().changePace(true);
    });
  }

  /**
  * Auto-build a scheule based upon current time.
  *                ______________..._______________                      ___...
  * ______________|                                |____________________|
  * |<-- delay -->|<---------- duration ---------->|<---- interval ---->|<-- duration -->
  *
  * @param {Integer} count How many schedules to generate?
  * @param {Integer} delay How many minutes in future to start generating schedules
  * @param {Integer} duration How long is each trigger event
  * @param {Integer} interval How long between trigger events
  */
  generateSchedule(count, delay, duration, interval) {
    // Start 2min from now
    var now = new Date();
    var start = new Date(now.getTime() + delay*60000);

    var rs = [];
    for (var n=0,len=count;n<len;n++) {
      var end = new Date(start.getTime() + duration*60000);
      var schedule = '1-7 ' + start.getHours()+':'+start.getMinutes() + '-' + end.getHours()+':'+end.getMinutes();
      start = new Date(end.getTime() + interval*60000);
      rs.push(schedule);
    }
    return rs;
  }

  createGeofences(data, interval, params, callback) {
    //bgGeo.removeGeofences();

    interval = interval || 1;
    params = params || {notifyOnEntry: true};
    params.notifyOnEntry  = params.notifyOnEntry  || false;
    params.notifyOnExit   = params.notifyOnExit   || false;
    params.notifyOnDwell  = params.notifyOnDwell  || false;
    var geofences = [];
    var index = 1;
    for (var n=0,len=data.length;n<len;n++) {
      if (n % interval) { continue; }
      geofences.push({
        identifier: 'geofences_test_' + index++,
        latitude: data[n].lat,
        longitude: data[n].lng,
        radius: 200,
        extras: {geofence_extra_foo:"bar"},
        notifyOnExit: params.notifyOnExit,
        notifyOnEntry: params.notifyOnEntry,
        notifyOnDwell: params.notifyOnDwell
      });
    };
    this.getPlugin().addGeofences(geofences, (result) => {
      console.log('Geofences loaded');
      callback();
    }, (error) => {
      console.warn('Geofence load failure: ', error);
      callback();
    });
  }

  crudTest() {
    console.log("******************************");
    console.log("* Crud test");
    console.log("******************************");
    this.getPlugin().setConfig({autoSync: false});

    this.getPlugin().getCurrentPosition((location, taskId) => {
      this.getPlugin().getLocations((rs, tid) => {
        if (!rs.length) {
          console.warn("- getLocations FAIL: ", rs.length);
          return;
        }
        var uuid = rs[0].uuid;
        console.log("- uuid: ", uuid);

        this.getPlugin().getCount((count) => {
          console.log('- Count BEFORE: ', count);
        });
        var params = {
          coords: location.coords,
          extras: {foo: 'insertLocation without timestamp'}
        };
        this.getPlugin().insertLocation(params, () => {
          console.log('- INSERT location without timetamp');
        }, (error) => {
          console.log('- INSERT FAILED: ', error);
        });
        this.getPlugin().getLocation(uuid, (location) => {
          console.log('- getLocation SUCCESS: ', JSON.stringify(location, null, 2));
            location.extras = {"CRUD_TEST":"------------ CrudTest updateLocation ---------------"};
            this.getPlugin().updateLocation(location, () => {
              console.log('- Update location SUCCESS');
              this.getPlugin().getLocation(uuid, (l) => {
                console.log('- Get Location after UPDATE: ', JSON.stringify(l, null, 2));

                this.getPlugin().destroyLocation(uuid, () => {
                  console.log('- Destroy Location SUCCESS', uuid);
                  this.getPlugin().getCount((count) => {
                    console.log('- Count: ', count);
                  });
                  this.getPlugin().getLocation(uuid, () => {
                    console.warn('- Get Location should not SUCCEED!');
                  }, () => {
                    console.log('- GOOD: getLocation failed after destroy');
                  });
                }, (error) => {
                  console.warn('- Destroy Location FAILURE: ', uuid);
                });
              }, (error) => {
                console.warn('- Get Location FAILED: ', error);
              })
            }, (error) => {
              console.log('- Update location FAILURE: ', error);
            });
        }, (error) => {
          console.log('- Failed to find location; ', uuid);
        })
      });
    }, {
      persist: true
    });
  }
}