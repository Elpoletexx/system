import SwiftUI
import OrbitaCore

struct GameScreen: View {
    @StateObject private var model = GameModel()
    @Environment(\.scenePhase) private var scenePhase
    @State private var isTouching = false

    var body: some View {
        ZStack {
            LinearGradient(colors: [Palette.backgroundTop, Palette.backgroundBottom],
                           startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()

            GameCanvas(engine: model.engine, laneBlend: model.laneBlend, gemFlash: model.gemFlash)
                .ignoresSafeArea()
                .contentShape(Rectangle())
                // Fire on touch-down instead of touch-up: every millisecond counts.
                .gesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { _ in
                            guard !isTouching else { return }
                            isTouching = true
                            model.tap()
                        }
                        .onEnded { _ in isTouching = false }
                )
                .accessibilityElement()
                .accessibilityLabel("Zona de juego")
                .accessibilityHint("Toca para cambiar de órbita")
                .accessibilityAddTraits(.allowsDirectInteraction)

            overlay
                .animation(.easeOut(duration: 0.25), value: model.phase)
        }
        .preferredColorScheme(.dark)
        .statusBarHidden()
        .persistentSystemOverlays(.hidden)
        .onChange(of: scenePhase) { _, newPhase in
            model.setActive(newPhase == .active)
        }
    }

    @ViewBuilder
    private var overlay: some View {
        switch model.phase {
        case .ready:
            ReadyOverlay(best: model.best)
                .allowsHitTesting(false)
        case .playing:
            ScoreOverlay(score: model.engine.score, isPaused: model.isPaused)
                .allowsHitTesting(false)
        case .over:
            GameOverOverlay(score: model.engine.score,
                            best: model.best,
                            isNewRecord: model.isNewRecord,
                            onPlayAgain: { model.playAgain() })
                .transition(.opacity.combined(with: .scale(scale: 0.95)))
        }
    }
}

private struct ReadyOverlay: View {
    let best: Int

    var body: some View {
        VStack {
            VStack(spacing: 8) {
                Text("ÓRBITA")
                    .font(.system(size: 52, weight: .black, design: .rounded))
                    .tracking(6)
                    .foregroundStyle(Palette.ring)
                if best > 0 {
                    Text("Récord: \(best)")
                        .font(.headline)
                        .foregroundStyle(.white.opacity(0.7))
                }
            }
            .padding(.top, 60)

            Spacer()

            Text("Toca para cambiar de órbita.\nEsquiva lo rojo, atrapa lo dorado.")
                .multilineTextAlignment(.center)
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.6))
                .padding(.bottom, 12)

            Text("TOCA PARA EMPEZAR")
                .font(.system(.title3, design: .rounded, weight: .bold))
                .foregroundStyle(.white)
                .phaseAnimator([0.35, 1.0]) { view, opacity in
                    view.opacity(opacity)
                } animation: { _ in
                    .easeInOut(duration: 0.9)
                }
                .padding(.bottom, 60)
        }
        .padding(.horizontal, 24)
    }
}

private struct ScoreOverlay: View {
    let score: Int
    let isPaused: Bool

    var body: some View {
        ZStack {
            Text("\(score)")
                .font(.system(size: 64, weight: .heavy, design: .rounded))
                .monospacedDigit()
                .foregroundStyle(.white)
                .contentTransition(.numericText())
                .accessibilityLabel("Puntos: \(score)")

            if isPaused {
                VStack {
                    Spacer()
                    Text("PAUSA · TOCA PARA SEGUIR")
                        .font(.system(.headline, design: .rounded, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(.bottom, 80)
                }
            }
        }
    }
}

private struct GameOverOverlay: View {
    let score: Int
    let best: Int
    let isNewRecord: Bool
    let onPlayAgain: () -> Void

    var body: some View {
        ZStack {
            Color.black.opacity(0.55).ignoresSafeArea()

            VStack(spacing: 20) {
                Text(isNewRecord ? "¡NUEVO RÉCORD!" : "FIN DE LA ÓRBITA")
                    .font(.system(.title2, design: .rounded, weight: .black))
                    .foregroundStyle(isNewRecord ? Palette.gem : Palette.obstacle)

                Text("\(score)")
                    .font(.system(size: 80, weight: .heavy, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(.white)

                Text("Récord: \(best)")
                    .font(.headline)
                    .foregroundStyle(.white.opacity(0.7))

                Button(action: onPlayAgain) {
                    Label("Jugar de nuevo", systemImage: "arrow.clockwise")
                        .font(.system(.title3, design: .rounded, weight: .bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 6)
                }
                .buttonStyle(.borderedProminent)
                .tint(Palette.ring)
                .foregroundStyle(Palette.backgroundTop)

                ShareLink(item: "¡Hice \(score) puntos en Órbita! ¿Puedes superarme?") {
                    Label("Retar a un amigo", systemImage: "square.and.arrow.up")
                        .font(.headline)
                }
                .tint(.white)
            }
            .padding(32)
            .frame(maxWidth: 360)
        }
    }
}
