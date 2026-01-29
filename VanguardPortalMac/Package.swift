// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "VanguardPortal",
    platforms: [
        .macOS(.v13)
    ],
    products: [
        .executable(name: "VanguardPortal", targets: ["VanguardPortal"])
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "VanguardPortal",
            dependencies: [],
            path: "VanguardPortal"
        )
    ]
)
