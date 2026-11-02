import WidgetKit
import SwiftUI

/* Same data and rules as src/widget/data.ts in the app. */
private let appGroup = "group.app.selah.prayer"

struct WItem: Codable { let a: String; let v: String; let r: String }
struct WDesign: Codable {
  let content: String?
  let rotate: String?
  let font: String?
  let bg: String?
  let fg: String?
}
struct WData: Codable { let w: WDesign; let items: [WItem] }

private func loadData() -> WData? {
  guard let s = UserDefaults(suiteName: appGroup)?.string(forKey: "widget"),
        let raw = s.data(using: .utf8) else { return nil }
  return try? JSONDecoder().decode(WData.self, from: raw)
}

private func hoursPerSlot(_ rotate: String?) -> Double {
  switch rotate {
  case "1h": return 1
  case "am-pm": return 12
  case "1d": return 24
  default: return 3
  }
}

/* the day is cut into equal slots in local time; each slot shows the next item */
private func slotIndex(_ date: Date, _ rotate: String?) -> Int {
  let local = date.timeIntervalSince1970 + Double(TimeZone.current.secondsFromGMT(for: date))
  return Int(floor(local / 3600 / hoursPerSlot(rotate)))
}

private func slotStart(_ slot: Int, _ rotate: String?, _ ref: Date) -> Date {
  let utc = Double(slot) * hoursPerSlot(rotate) * 3600 - Double(TimeZone.current.secondsFromGMT(for: ref))
  return Date(timeIntervalSince1970: utc)
}

struct SelahEntry: TimelineEntry {
  let date: Date
  let item: WItem?
  let design: WDesign?
}

struct Provider: TimelineProvider {
  private let sample = WItem(a: "I am still, and I know that He is God.", v: "Be still, and know that I am God.", r: "Psalm 46:10")

  func placeholder(in context: Context) -> SelahEntry { SelahEntry(date: Date(), item: sample, design: nil) }

  func getSnapshot(in context: Context, completion: @escaping (SelahEntry) -> Void) {
    completion(entries(count: 1).first ?? placeholder(in: context))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<SelahEntry>) -> Void) {
    let list = entries(count: 12)
    completion(Timeline(entries: list.isEmpty ? [placeholder(in: context)] : list, policy: .atEnd))
  }

  private func entries(count: Int) -> [SelahEntry] {
    guard let d = loadData(), !d.items.isEmpty else { return [SelahEntry(date: Date(), item: nil, design: nil)] }
    let now = Date(), first = slotIndex(now, d.w.rotate), n = d.items.count
    return (0..<count).map { (i: Int) -> SelahEntry in
      let slot = first + i
      let idx = ((slot % n) + n) % n
      return SelahEntry(date: i == 0 ? now : slotStart(slot, d.w.rotate, now), item: d.items[idx], design: d.w)
    }
  }
}

extension Color {
  init(hex: String?, fallback: Color) {
    guard let h = hex, h.hasPrefix("#"), h.count == 7, let v = UInt32(h.dropFirst(), radix: 16) else { self = fallback; return }
    self = Color(red: Double((v >> 16) & 0xFF) / 255, green: Double((v >> 8) & 0xFF) / 255, blue: Double(v & 0xFF) / 255)
  }
}

struct SelahWidgetView: View {
  @Environment(\.widgetFamily) var family
  let entry: SelahEntry

  private var bg: Color { Color(hex: entry.design?.bg, fallback: Color(red: 0.71, green: 0.68, blue: 1.0)) }
  private var fg: Color { Color(hex: entry.design?.fg, fallback: Color(red: 0.12, green: 0.08, blue: 0.27)) }
  private var serif: Bool { entry.design?.font == "serif" }
  private var content: String { entry.design?.content ?? "both" }
  private var main: String {
    guard let it = entry.item else { return "Open Selah to see today’s word." }
    return content == "verse" ? "“\(it.v)”" : it.a
  }
  private var sub: String? {
    guard let it = entry.item, content == "both" else { return nil }
    return "“\(it.v)”"
  }

  var body: some View {
    switch family {
    case .accessoryInline:
      Text(entry.item?.a ?? "Selah")
        .containerBackground(for: .widget) { Color.clear }
    case .accessoryRectangular:
      VStack(alignment: .leading, spacing: 2) {
        Text(main).font(.headline).lineLimit(2).minimumScaleFactor(0.8)
        if let r = entry.item?.r { Text(r).font(.caption2) }
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .containerBackground(for: .widget) { Color.clear }
    default:
      VStack(alignment: .leading, spacing: 4) {
        Text("Selah").font(.system(size: 12, weight: .bold)).opacity(0.8)
        Spacer(minLength: 4)
        Text(main)
          .font(serif ? .system(size: family == .systemSmall ? 16 : 19, design: .serif) : .system(size: family == .systemSmall ? 15 : 18, weight: .bold))
          .lineLimit(family == .systemSmall ? 5 : family == .systemLarge ? 8 : 3)
          .minimumScaleFactor(0.75)
        if family != .systemSmall, let s = sub {
          Text(s).font(.system(size: 13)).lineLimit(family == .systemLarge ? 8 : 2).opacity(0.85)
        }
        if let r = entry.item?.r { Text(r).font(.system(size: 12, weight: .bold)).padding(.top, 2) }
      }
      .foregroundStyle(fg)
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
      .containerBackground(for: .widget) { bg }
    }
  }
}

struct SelahWidget: Widget {
  let kind = "SelahWidget"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: Provider()) { entry in
      SelahWidgetView(entry: entry).widgetURL(URL(string: "selah://"))
    }
    .configurationDisplayName("Selah")
    .description("A scripture affirmation that changes through the day.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryRectangular, .accessoryInline])
  }
}

@main
struct SelahWidgets: WidgetBundle {
  var body: some Widget { SelahWidget() }
}
