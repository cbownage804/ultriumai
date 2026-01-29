// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "VanguardAgent",
    platforms: [
        .macOS(.v13)
    ],
    products: [
        .executable(name: "VanguardAgent", targets: ["VanguardAgent"])
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "VanguardAgent",
            dependencies: [],
            path: "VanguardAgent"
        )
    ]
)
