import Foundation
import UserNotifications

enum TimerNotifier {
    static func prepare() {
        UNUserNotificationCenter.current().delegate = ForegroundSilencer.shared
    }

    static func schedule(item: NoteItem) {
        guard let timer = item.timer, !timer.reminded, !item.isDone else {
            cancel(itemId: item.id)
            return
        }
        let remaining = timer.remaining()
        guard remaining > 0 else {
            cancel(itemId: item.id)
            return
        }
        Task { await requestAuthorization() }
        let content = UNMutableNotificationContent()
        content.title = item.text
        content.body = doneBody(for: item.text)
        content.sound = .default
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: max(1, remaining), repeats: false)
        let request = UNNotificationRequest(identifier: requestId(item.id), content: content, trigger: trigger)
        UNUserNotificationCenter.current().add(request)
    }

    static func cancel(itemId: String) {
        let id = requestId(itemId)
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [id])
        center.removeDeliveredNotifications(withIdentifiers: [id])
    }

    static func resync(groups: [NoteGroup]) {
        let items = groups.flatMap(\.items)
        for item in items {
            schedule(item: item)
        }
    }

    private static func requestAuthorization() async {
        _ = try? await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge])
    }

    private static func requestId(_ itemId: String) -> String {
        "timer.\(itemId)"
    }

    private static func doneBody(for text: String) -> String {
        let language = UserDefaults.standard.string(forKey: "settings.language") ?? "tr"
        let format = language == "en" ? "Time's up: %@" : "Süre doldu: %@"
        return String(format: format, text)
    }
}

private final class ForegroundSilencer: NSObject, UNUserNotificationCenterDelegate, @unchecked Sendable {
    static let shared = ForegroundSilencer()

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        []
    }
}
