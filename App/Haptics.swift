import UIKit

@MainActor
final class Haptics {
    private let light = UIImpactFeedbackGenerator(style: .light)
    private let rigid = UIImpactFeedbackGenerator(style: .rigid)
    private let notification = UINotificationFeedbackGenerator()

    func prepare() {
        light.prepare()
        rigid.prepare()
        notification.prepare()
    }

    func laneSwitch() { light.impactOccurred(intensity: 0.6) }
    func gem() { rigid.impactOccurred(intensity: 0.8) }
    func crash() { notification.notificationOccurred(.error) }
    func newRecord() { notification.notificationOccurred(.success) }
}
