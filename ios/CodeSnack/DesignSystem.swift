import SwiftUI

// MARK: - CodeSnack's iOS design language

enum SnackStyle {
    static let ink = Color(red: 0.075, green: 0.096, blue: 0.22)
    static let blue = Color(red: 0.22, green: 0.32, blue: 0.96)
    static let brightBlue = Color(red: 0.39, green: 0.45, blue: 1.0)
    static let lavender = Color(red: 0.90, green: 0.87, blue: 1.0)
    static let lavenderSoft = Color(red: 0.956, green: 0.944, blue: 1.0)
    static let lime = Color(red: 0.93, green: 0.97, blue: 0.76)
    static let cream = Color(red: 0.993, green: 0.982, blue: 0.976)
    static let muted = Color(red: 0.47, green: 0.49, blue: 0.58)
    static let divider = Color(red: 0.92, green: 0.91, blue: 0.94)
}

struct SnackCanvas: View {
    var body: some View {
        ZStack {
            SnackStyle.cream
            RadialGradient(colors: [SnackStyle.lavender.opacity(0.55), .clear], center: .topTrailing, startRadius: 8, endRadius: 360)
            RadialGradient(colors: [SnackStyle.lime.opacity(0.40), .clear], center: .bottomLeading, startRadius: 0, endRadius: 240)
        }
        .ignoresSafeArea()
    }
}

struct SnackCard<Content: View>: View {
    let padding: CGFloat
    let content: Content

    init(padding: CGFloat = 16, @ViewBuilder content: () -> Content) {
        self.padding = padding
        self.content = content()
    }

    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(.white.opacity(0.87), in: RoundedRectangle(cornerRadius: 23, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 23, style: .continuous).stroke(.white.opacity(0.92), lineWidth: 1))
            .shadow(color: SnackStyle.ink.opacity(0.055), radius: 16, y: 6)
    }
}

struct SnackSectionHeading: View {
    let title: String
    var accessory: String? = nil
    var onAccessory: (() -> Void)? = nil

    var body: some View {
        HStack {
            Text(title).font(.system(size: 19, weight: .bold)).foregroundStyle(SnackStyle.ink)
            Spacer()
            if let accessory, let onAccessory {
                Button(action: onAccessory) {
                    HStack(spacing: 4) {
                        Text(accessory)
                        Image(systemName: "chevron.right").font(.system(size: 10, weight: .bold))
                    }
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(SnackStyle.ink)
                }
                .buttonStyle(.plain)
            }
        }
    }
}

// iOS 26 renders actual system Liquid Glass; older systems use material fallback.
struct SnackGlassSurface: ViewModifier {
    var radius: CGFloat = 30
    func body(content: Content) -> some View {
        if #available(iOS 26.0, *) {
            content.glassEffect(.regular, in: RoundedRectangle(cornerRadius: radius, style: .continuous))
        } else {
            content
                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: radius, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: radius).stroke(.white.opacity(0.68), lineWidth: 1))
        }
    }
}

extension View {
    func snackGlass(radius: CGFloat = 30) -> some View {
        modifier(SnackGlassSurface(radius: radius))
    }
}

struct SnackPrimaryButton: View {
    let title: String
    var symbol: String = "arrow.right"
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: symbol)
                Text(title)
            }
            .font(.system(size: 15, weight: .bold))
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(LinearGradient(colors: [SnackStyle.brightBlue, SnackStyle.blue], startPoint: .topLeading, endPoint: .bottomTrailing), in: Capsule())
        }
        .buttonStyle(.plain)
    }
}

struct SnackLabel: View {
    let text: String
    var color: Color = SnackStyle.blue
    var body: some View {
        Text(text)
            .font(.system(size: 11, weight: .bold))
            .padding(.horizontal, 10).padding(.vertical, 5)
            .foregroundStyle(SnackStyle.ink)
            .background(color.opacity(0.12), in: Capsule())
    }
}

struct SnackBrandHeader: View {
    var subtitle: String
    var trailingSymbol: String = "person.crop.circle"
    var trailingAction: (() -> Void)? = nil

    var body: some View {
        HStack(spacing: 5) {
            Text("{").foregroundStyle(SnackStyle.blue)
            Text("CodeSnack").foregroundStyle(SnackStyle.ink)
            Text("}").foregroundStyle(SnackStyle.blue)
            if !subtitle.isEmpty {
                Text("|").fontWeight(.light).foregroundStyle(SnackStyle.muted.opacity(0.65)).padding(.horizontal, 4)
                Text(subtitle).font(.system(size: 13, weight: .bold)).foregroundStyle(SnackStyle.ink)
            }
            Spacer(minLength: 3)
            if let trailingAction {
                Button(action: trailingAction) {
                    Image(systemName: trailingSymbol)
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(SnackStyle.ink)
                        .frame(width: 37, height: 37)
                        .snackGlass(radius: 19)
                }.buttonStyle(.plain)
            }
        }
        .font(.system(size: 19, weight: .heavy, design: .rounded))
        .padding(.horizontal, 22)
        .padding(.top, 10)
        .padding(.bottom, 10)
    }
}
