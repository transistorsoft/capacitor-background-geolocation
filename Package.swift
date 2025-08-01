// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.
// "@transistorsoft/capacitor-background-fetch": "file:../../capacitor-background-fetch"

import PackageDescription

let package = Package(
    name: "TransistorsoftCapacitorBackgroundGeolocation",
    platforms: [.iOS(.v14)],
    products: [
        .library(
            name: "TransistorsoftCapacitorBackgroundGeolocation",
            targets: ["BackgroundGeolocationPlugin"]
        )
    ],
    dependencies: [
         .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "7.0.0"),
         .package(url: "https://github.com/CocoaLumberjack/CocoaLumberjack.git", from: "3.8.5")
    ],
    targets: [
        .target(
            name: "BackgroundGeolocationPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                "CocoaLumberjack",
                "TSLocationManager"
            ],
            path: "ios/Sources/BackgroundGeolocationPlugin",
            resources: [
                .process("PrivacyInfo.xcprivacy")
            ],
            linkerSettings: [
                .linkedLibrary("z"),
                .linkedLibrary("sqlite3"),
                .linkedLibrary("stdc++")
            ]
        ),
        .binaryTarget(
            name: "TSLocationManager",
            path: "ios/Frameworks/TSLocationManager.xcframework"
        )
    ]
)

