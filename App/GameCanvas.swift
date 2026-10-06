import SwiftUI
import OrbitaCore

/// Draws the rings, items and player. Angle 0 is 12 o'clock and grows clockwise.
struct GameCanvas: View {
    let engine: GameEngine
    let laneBlend: Double
    let gemFlash: Double

    var body: some View {
        Canvas { context, size in
            let layout = Layout(size: size)

            for radius in layout.radii {
                let rect = CGRect(x: layout.center.x - radius, y: layout.center.y - radius,
                                  width: radius * 2, height: radius * 2)
                context.stroke(Path(ellipseIn: rect),
                               with: .color(Palette.ring.opacity(0.3 + 0.5 * gemFlash)),
                               lineWidth: 2 + 2 * gemFlash)
            }

            for item in engine.items {
                let radius = layout.radii[item.lane.rawValue]
                switch item.kind {
                case .obstacle:
                    let path = layout.arc(radius: radius,
                                          from: item.angle - item.halfWidth,
                                          to: item.angle + item.halfWidth)
                    context.stroke(path,
                                   with: .color(Palette.obstacle.opacity(item.passed ? 0.3 : 1)),
                                   style: StrokeStyle(lineWidth: layout.side * 0.04, lineCap: .round))
                case .gem:
                    let point = layout.point(radius: radius, angle: item.angle)
                    context.fill(layout.diamond(at: point, size: layout.side * 0.024),
                                 with: .color(Palette.gem.opacity(item.passed ? 0.3 : 1)))
                }
            }

            let playerRadius = layout.radii[0] + (layout.radii[1] - layout.radii[0]) * laneBlend
            let dot = layout.side * 0.026

            for step in 1...8 {
                let point = layout.point(radius: playerRadius, angle: engine.playerAngle - Double(step) * 0.035)
                let fade = 1 - Double(step) / 9
                context.fill(layout.circle(at: point, radius: dot * fade),
                             with: .color(Palette.ring.opacity(0.35 * fade)))
            }

            let player = layout.point(radius: playerRadius, angle: engine.playerAngle)
            var glow = context
            glow.addFilter(.blur(radius: layout.side * 0.02))
            glow.fill(layout.circle(at: player, radius: dot * 1.6), with: .color(Palette.ring.opacity(0.8)))
            context.fill(layout.circle(at: player, radius: dot), with: .color(Palette.player))
        }
        .accessibilityHidden(true)
    }
}

private struct Layout {
    let center: CGPoint
    let side: CGFloat
    /// Indexed by `Lane.rawValue`: inner, outer.
    let radii: [CGFloat]

    init(size: CGSize) {
        side = min(size.width, size.height)
        center = CGPoint(x: size.width / 2, y: size.height / 2)
        radii = [side * 0.27, side * 0.40]
    }

    func point(radius: CGFloat, angle: Double) -> CGPoint {
        let screenAngle = angle - .pi / 2
        return CGPoint(x: center.x + radius * CGFloat(cos(screenAngle)),
                       y: center.y + radius * CGFloat(sin(screenAngle)))
    }

    /// Built from points rather than `addArc` so direction never depends on
    /// SwiftUI's flipped-coordinate clockwise convention.
    func arc(radius: CGFloat, from start: Double, to end: Double) -> Path {
        var path = Path()
        let segments = 16
        for index in 0...segments {
            let angle = start + (end - start) * Double(index) / Double(segments)
            let p = point(radius: radius, angle: angle)
            if index == 0 { path.move(to: p) } else { path.addLine(to: p) }
        }
        return path
    }

    func circle(at point: CGPoint, radius: CGFloat) -> Path {
        Path(ellipseIn: CGRect(x: point.x - radius, y: point.y - radius, width: radius * 2, height: radius * 2))
    }

    func diamond(at point: CGPoint, size: CGFloat) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: point.x, y: point.y - size))
        path.addLine(to: CGPoint(x: point.x + size, y: point.y))
        path.addLine(to: CGPoint(x: point.x, y: point.y + size))
        path.addLine(to: CGPoint(x: point.x - size, y: point.y))
        path.closeSubpath()
        return path
    }
}
