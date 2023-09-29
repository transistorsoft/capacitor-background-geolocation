/// Map geometry methods for calculating Geofence hit-markers on MapView
/// @author Chris Scott, Transistor Software
///

export const toRad = (n) => {
  return n * (Math.PI / 180);
}
export const toDeg = (n) => {
  return n * (180 / Math.PI);
}

/// Calculate bearing based upon the vector of two locations
/// @param origin {latitude, longitude}
/// @param destination {latitude, longitude}
/// @return number Bearing in compass degrees (0-360)...or is it 0-359?
export const getBearing = (origin:any, destination:any) => {
  const originLat       = toRad(origin.latitude);
  const originLong      = toRad(origin.longitude);
  const destinationLat  = toRad(destination.latitude);
  const destinationLong = toRad(destination.longitude);

  let dLong = destinationLong - originLong;

  const dPhi = Math.log(
  	Math.tan(destinationLat / 2.0 + Math.PI / 4.0) / Math.tan(originLat / 2.0 + Math.PI / 4.0)
  );

  if (Math.abs(dLong) > Math.PI){
    if (dLong > 0.0)
       dLong = -(2.0 * Math.PI - dLong);
    else
       dLong = (2.0 * Math.PI + dLong);
  }
  return (toDeg(Math.atan2(dLong, dPhi)) + 360.0) % 360.0;
}

/// Calculates a new {latitude, longitude} some distance away in space in some direction.
///
export const computeOffsetCoordinate = (coordinate:any, distance:number, heading:number) => {
  distance = distance / (6371*1000);
  heading = toRad(heading);

  const lat1 = toRad(coordinate.latitude);
  const lon1 = toRad(coordinate.longitude);
  const lat2 = Math.asin(
  	Math.sin(lat1) * Math.cos(distance) + Math.cos(lat1) * Math.sin(distance) * Math.cos(heading)
  );
  const lon2 = lon1 + Math.atan2(
  	Math.sin(heading) * Math.sin(distance) * Math.cos(lat1),
    Math.cos(distance) - Math.sin(lat1) * Math.sin(lat2)
  );

  if (isNaN(lat2) || isNaN(lon2)) return null;

  return {
    latitude: toDeg(lat2),
    longitude: toDeg(lon2)
  };
}