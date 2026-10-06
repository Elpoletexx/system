// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "OrbitaCore",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [
        .library(name: "OrbitaCore", targets: ["OrbitaCore"]),
    ],
    targets: [
        .target(name: "OrbitaCore"),
        .testTarget(name: "OrbitaCoreTests", dependencies: ["OrbitaCore"]),
    ]
)
