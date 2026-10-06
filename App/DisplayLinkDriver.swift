import QuartzCore

/// Calls `onTick` once per screen refresh with the elapsed time in seconds.
@MainActor
final class DisplayLinkDriver: NSObject {
    var onTick: ((Double) -> Void)?

    private var link: CADisplayLink?
    private var lastTimestamp: CFTimeInterval?

    func start() {
        guard link == nil else { return }
        lastTimestamp = nil
        let link = CADisplayLink(target: self, selector: #selector(tick(_:)))
        // 120 Hz on ProMotion devices (needs CADisableMinimumFrameDurationOnPhone).
        link.preferredFrameRateRange = CAFrameRateRange(minimum: 60, maximum: 120, preferred: 120)
        link.add(to: .main, forMode: .common)
        self.link = link
    }

    /// Must be called before release: CADisplayLink retains its target.
    func stop() {
        link?.invalidate()
        link = nil
    }

    @objc private func tick(_ link: CADisplayLink) {
        let previous = lastTimestamp
        lastTimestamp = link.timestamp
        guard let previous else { return }
        onTick?(link.timestamp - previous)
    }
}
