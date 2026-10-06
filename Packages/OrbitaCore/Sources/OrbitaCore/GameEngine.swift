import Foundation

public enum Lane: Int {
    case inner = 0
    case outer = 1

    public var toggled: Lane { self == .inner ? .outer : .inner }
}

public enum ItemKind {
    case obstacle
    case gem
}

/// Something sitting on one of the rings. Angles are absolute (never wrapped),
/// so an item is "ahead" of the player when its angle is larger.
public struct Item: Identifiable, Equatable {
    public let id: Int
    public let kind: ItemKind
    public let lane: Lane
    public let angle: Double
    public let halfWidth: Double
    public internal(set) var passed: Bool = false
}

public enum GamePhase: Equatable {
    case ready
    case playing
    case over
}

public enum GameEvent: Equatable {
    case started
    case switchedLane
    case passedObstacle
    case collectedGem
    case crashed
}

public struct GameConfig {
    /// Angular speed in radians per second at the start of a run.
    public var baseSpeed: Double = 1.7
    public var speedGainPerSecond: Double = 0.025
    public var maxSpeed: Double = 4.2
    public var playerHalfWidth: Double = 0.07
    public var obstacleHalfWidthRange: ClosedRange<Double> = 0.10...0.20
    public var gemHalfWidth: Double = 0.05
    /// Gap between consecutive items. Each spawn uses one lane only and the
    /// minimum gap exceeds any item width, so a free lane always exists.
    public var gapRange: ClosedRange<Double> = 0.55...0.95
    /// Seconds the player always gets to switch lanes between two items.
    public var minSwitchTime: Double = 0.22
    public var gemChance: Double = 0.22
    public var lookAhead: Double = .pi * 1.35
    public var keepBehind: Double = .pi * 0.4
    public var gemPoints: Int = 3
    public var obstaclePoints: Int = 1
    /// Free angle in front of the player when a run starts.
    public var safeStart: Double = .pi * 0.6

    public init() {}
}

/// Pure, UI-independent game simulation.
public struct GameEngine {
    public let config: GameConfig
    public private(set) var phase: GamePhase = .ready
    public private(set) var lane: Lane = .outer
    public private(set) var playerAngle: Double = 0
    public private(set) var speed: Double
    public private(set) var elapsed: Double = 0
    public private(set) var score: Int = 0
    public private(set) var gems: Int = 0
    public private(set) var items: [Item] = []

    private var rng: SeededGenerator
    private var nextSpawnAngle: Double = 0
    private var nextID = 0

    public init(config: GameConfig = GameConfig(), seed: UInt64 = UInt64.random(in: .min ... .max)) {
        self.config = config
        self.speed = config.baseSpeed
        self.rng = SeededGenerator(seed: seed)
        reset()
    }

    /// Back to the ready state with a fresh, pre-filled board.
    public mutating func reset() {
        phase = .ready
        lane = .outer
        playerAngle = 0
        speed = config.baseSpeed
        elapsed = 0
        score = 0
        gems = 0
        items = []
        nextSpawnAngle = config.safeStart
        spawnItems()
    }

    /// A tap starts the run, switches lane while playing, and is ignored once over.
    @discardableResult
    public mutating func tap() -> [GameEvent] {
        switch phase {
        case .ready:
            phase = .playing
            return [.started]
        case .playing:
            lane = lane.toggled
            var events: [GameEvent] = [.switchedLane]
            events += resolveCollisions()
            return events
        case .over:
            return []
        }
    }

    @discardableResult
    public mutating func update(deltaTime: Double) -> [GameEvent] {
        guard phase == .playing, deltaTime > 0 else { return [] }
        // Clamp so a hitch (or a resume) can't tunnel the player through obstacles.
        let dt = min(deltaTime, 1.0 / 30.0)
        elapsed += dt
        speed = min(config.maxSpeed, config.baseSpeed + config.speedGainPerSecond * elapsed)
        playerAngle += speed * dt

        let events = resolveCollisions()
        guard phase == .playing else { return events }

        items.removeAll { $0.angle + $0.halfWidth < playerAngle - config.keepBehind }
        spawnItems()
        return events
    }

    private mutating func resolveCollisions() -> [GameEvent] {
        var events: [GameEvent] = []
        var collected: [Int] = []

        for index in items.indices where !items[index].passed {
            let item = items[index]
            let reach = item.halfWidth + config.playerHalfWidth
            let delta = item.angle - playerAngle

            if abs(delta) < reach, item.lane == lane {
                switch item.kind {
                case .obstacle:
                    phase = .over
                    events.append(.crashed)
                    return events
                case .gem:
                    collected.append(item.id)
                    score += config.gemPoints
                    gems += 1
                    events.append(.collectedGem)
                }
            } else if delta < -reach {
                items[index].passed = true
                if item.kind == .obstacle {
                    score += config.obstaclePoints
                    events.append(.passedObstacle)
                }
            }
        }

        if !collected.isEmpty {
            items.removeAll { collected.contains($0.id) }
        }
        return events
    }

    private mutating func spawnItems() {
        while nextSpawnAngle < playerAngle + config.lookAhead {
            let isGem = Double.random(in: 0..<1, using: &rng) < config.gemChance
            let lane: Lane = Bool.random(using: &rng) ? .inner : .outer
            let halfWidth = isGem
                ? config.gemHalfWidth
                : Double.random(in: config.obstacleHalfWidthRange, using: &rng)

            items.append(Item(
                id: nextID,
                kind: isGem ? .gem : .obstacle,
                lane: lane,
                angle: nextSpawnAngle + halfWidth,
                halfWidth: halfWidth
            ))
            nextID += 1
            // Widen gaps as the run speeds up so a lane switch stays humanly possible.
            let scaled = Double.random(in: config.gapRange, using: &rng) * (0.5 + 0.5 * speed / config.baseSpeed)
            let minGap = speed * config.minSwitchTime + config.playerHalfWidth * 2
            nextSpawnAngle += halfWidth * 2 + max(scaled, minGap)
        }
    }
}
