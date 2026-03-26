// swift-tools-version: 5.9
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
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0"),
        .package(url: "https://github.com/CocoaLumberjack/CocoaLumberjack.git", from: "3.8.5"),
        .package(url: "https://github.com/transistorsoft/native-background-geolocation.git", from: "4.0.10"),
        .package(url: "https://github.com/transistorsoft/transistor-background-fetch.git", from: "4.0.5")
    ],
    targets: [
        .target(
            name: "BackgroundGeolocationPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "BackgroundGeolocation", package: "native-background-geolocation"),
                .product(name: "TSBackgroundFetch", package: "transistor-background-fetch"),
                .product(name: "CocoaLumberjackSwift", package: "CocoaLumberjack")
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