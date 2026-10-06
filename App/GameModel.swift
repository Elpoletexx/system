import Foundation
import OrbitaCore

/// Bridges the pure `GameEngine` to SwiftUI: runs the frame loop, persists the
/// best score and turns game events into haptics.
@MainActor
final class GameModel: ObservableObject {
    private(set) var engine = GameEngine()
    private(set) var best: Int
    private(set) var isNewRecord = false
    private(set) var isPaused = false
    /// 0 = inner ring, 1 = outer ring. Eased toward the current lane for drawing.
    private(set) var laneBlend: Double = 1
    /// Ring glow after collecting a gem, decays from 1 to 0.
    private(set) var gemFlash: Double = 0

    private let driver = DisplayLinkDriver()
    private let haptics = Haptics()
    private let defaults: UserDefaults
    private static let bestKey = "bestScore"

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        best = defaults.integer(forKey: Self.bestKey)
        driver.onTick = { [weak self] dt in self?.step(dt) }
    }

    var phase: GamePhase { engine.phase }

    func tap() {
        if isPaused {
            isPaused = false
            driver.start()
            objectWillChange.send()
            return
        }
        handle(engine.tap())
        objectWillChange.send()
    }

    /// Starts a new run straight away, skipping the ready screen.
    func playAgain() {
        engine.reset()
        isNewRecord = false
        laneBlend = 1
        gemFlash = 0
        handle(engine.tap())
        objectWillChange.send()
    }

    func setActive(_ active: Bool) {
        guard !active, engine.phase == .playing, !isPaused else { return }
        isPaused = true
        driver.stop()
        objectWillChange.send()
    }

    private func step(_ dt: Double) {
        let events = engine.update(deltaTime: dt)
        let target = engine.lane == .outer ? 1.0 : 0.0
        laneBlend += (target - laneBlend) * min(1, dt * 20)
        gemFlash = max(0, gemFlash - dt * 3)
        handle(events)
        objectWillChange.send()
    }

    private func handle(_ events: [GameEvent]) {
        for event in events {
            switch event {
            case .started:
                haptics.prepare()
                driver.start()
            case .switchedLane:
                haptics.laneSwitch()
            case .collectedGem:
                gemFlash = 1
                haptics.gem()
            case .passedObstacle:
                break
            case .crashed:
                driver.stop()
                finishRun()
            }
        }
    }

    private func finishRun() {
        if engine.score > best {
            best = engine.score
            isNewRecord = true
            defaults.set(best, forKey: Self.bestKey)
            haptics.newRecord()
        } else {
            haptics.crash()
        }
    }
}
