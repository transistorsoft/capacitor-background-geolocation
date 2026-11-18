// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "TransistorsoftCapacitorBackgroundGeolocation",
    platforms: [.iOS(.v15)],   // (WO-194) TSLocationManager 4.9.0 and TSBackgroundFetch 4.2 are iOS 15
    products: [
        .library(
            name: "TransistorsoftCapacitorBackgroundGeolocation",
            targets: ["BackgroundGeolocationPlugin"]
        )
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0"),
        // (WO-194) TSLocationManager 4.9.0 requires TSBackgroundFetch 4.2.1 or any later 4.x, at iOS 15; this
        // floor keeps the direct fetch requirement from disagreeing with it.
        .package(url: "https://github.com/transistorsoft/native-background-geolocation.git", .upToNextMinor(from: "4.9.0")),
        .package(url: "https://github.com/transistorsoft/transistor-background-fetch.git", from: "4.2.1")
    ],
    targets: [
        .target(
            name: "BackgroundGeolocationPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "BackgroundGeolocation", package: "native-background-geolocation"),
                .product(name: "TSBackgroundFetch", package: "transistor-background-fetch")
            ],
            path: "ios/Sources/BackgroundGeolocationPlugin",
            resources: [
                .process("PrivacyInfo.xcprivacy")
            ],
            linkerSettings: [
                .linkedLibrary("z"),
                .linkedLibrary("sqlite3")
            ]
        )
    ]
)
