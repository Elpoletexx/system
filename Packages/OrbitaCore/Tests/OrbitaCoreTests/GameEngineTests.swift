import XCTest
@testable import OrbitaCore

final class GameEngineTests: XCTestCase {
    private let frame = 1.0 / 60.0

    func testTapStartsRunFromReady() {
        var engine = GameEngine(seed: 1)
        XCTAssertEqual(engine.phase, .ready)
        XCTAssertEqual(engine.tap(), [.started])
        XCTAssertEqual(engine.phase, .playing)
        XCTAssertEqual(engine.lane, .outer, "starting a run must not switch lanes")
    }

    func testUpdateDoesNothingBeforeStart() {
        var engine = GameEngine(seed: 1)
        engine.update(deltaTime: 1)
        XCTAssertEqual(engine.playerAngle, 0)
    }

    func testStartAreaIsClear() {
        let engine = GameEngine(seed: 42)
        XCTAssertFalse(engine.items.isEmpty)
        for item in engine.items {
            XCTAssertGreaterThanOrEqual(item.angle - item.halfWidth, engine.config.safeStart - 1e-9)
        }
    }

    func testConsecutiveItemsLeaveRoomToSwitch() {
        var engine = GameEngine(seed: 7)
        engine.tap()
        var seen: [Int: Item] = [:]
        for _ in 0..<(60 * 90) where engine.phase == .playing {
            for item in engine.items { seen[item.id] = item }
            dodge(&engine)
            engine.update(deltaTime: frame)
        }
        XCTAssertGreaterThan(seen.count, 100)
        let ordered = seen.values.sorted { $0.id < $1.id }
        for (a, b) in zip(ordered, ordered.dropFirst()) where b.id == a.id + 1 {
            let gap = (b.angle - b.halfWidth) - (a.angle + a.halfWidth)
            XCTAssertGreaterThan(gap, engine.config.playerHalfWidth * 2)
        }
    }

    func testCrashEndsRun() {
        var engine = GameEngine(seed: 3)
        engine.tap()
        var events: [GameEvent] = []
        for _ in 0..<(60 * 60) where engine.phase == .playing {
            events += engine.update(deltaTime: frame)
        }
        XCTAssertEqual(engine.phase, .over, "a player who never taps must eventually crash")
        XCTAssertEqual(events.last, .crashed)

        let angle = engine.playerAngle
        engine.update(deltaTime: frame)
        XCTAssertEqual(engine.playerAngle, angle)
        XCTAssertEqual(engine.tap(), [])
    }

    func testDodgingBotSurvivesAndScores() {
        var engine = GameEngine(seed: 99)
        engine.tap()
        let duration = 120.0
        var time = 0.0
        while time < duration {
            dodge(&engine)
            engine.update(deltaTime: frame)
            XCTAssertEqual(engine.phase, .playing, "fair spawning must always leave an escape lane (t=\(time))")
            if engine.phase != .playing { return }
            time += frame
        }
        XCTAssertGreaterThan(engine.score, 50)
        XCTAssertEqual(engine.speed, engine.config.maxSpeed, accuracy: 1e-9)
    }

    func testGemsAddPoints() {
        var config = GameConfig()
        config.gemChance = 1
        var engine = GameEngine(config: config, seed: 5)
        engine.tap()
        for _ in 0..<(60 * 20) {
            engine.update(deltaTime: frame)
        }
        XCTAssertEqual(engine.phase, .playing, "a board of only gems can't be lost")
        XCTAssertGreaterThan(engine.gems, 0)
        XCTAssertEqual(engine.score, engine.gems * config.gemPoints)
    }

    func testSameSeedIsDeterministic() {
        let a = GameEngine(seed: 1234)
        let b = GameEngine(seed: 1234)
        XCTAssertEqual(a.items, b.items)
    }

    func testResetRestoresInitialState() {
        var engine = GameEngine(seed: 8)
        engine.tap()
        for _ in 0..<120 { engine.update(deltaTime: frame) }
        engine.reset()
        XCTAssertEqual(engine.phase, .ready)
        XCTAssertEqual(engine.score, 0)
        XCTAssertEqual(engine.playerAngle, 0)
        XCTAssertEqual(engine.speed, engine.config.baseSpeed)
    }

    /// Simple bot: move off the lane of the nearest obstacle that isn't behind us yet.
    private func dodge(_ engine: inout GameEngine) {
        let next = engine.items
            .filter { $0.kind == .obstacle && $0.angle + $0.halfWidth + engine.config.playerHalfWidth > engine.playerAngle }
            .min { $0.angle < $1.angle }
        if let next, next.lane == engine.lane {
            engine.tap()
        }
    }
}
