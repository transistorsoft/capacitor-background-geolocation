/// Consume process.env vars defined in /.env, .env.local, etc.
/// See https://create-react-app.dev/docs/adding-custom-environment-variables
///
export const ENV = {
	/// This url to demo server (default http://tracker.transistorsoft.com) is provided as
	/// the upload url to BackgroundGeolocation.ready()
	/// Also used for fetching Auth tokens from the demo server.
	TRACKER_HOST: process.env.REACT_APP_TRACKER_HOST,

	/// Google now requires a creditcard to get an API key and usage is metered.
	/// Get your own API key here:  https://developers.google.com/maps/documentation/javascript/get-api-key
	GOOGLE_MAPS_API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
}
