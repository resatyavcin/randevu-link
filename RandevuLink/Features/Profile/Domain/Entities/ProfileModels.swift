import Foundation

enum SessionDay: String, Equatable, Sendable {
    case today
    case tomorrow
}

enum SessionStatus: String, Equatable, Sendable {
    case inProgress
    case upcoming
    case completed
}

struct Session: Equatable, Sendable {
    let customerName: String
    let service: String
    let staffName: String
    let staffColorHex: String
    let day: SessionDay
    let hour: Int
    let minute: Int
    let durationMinutes: Int
    let note: String
    let status: SessionStatus
    let completedCount: Int
    let totalCount: Int

    var timeLabel: String {
        String(format: "%02d:%02d", hour, minute)
    }
}

struct ProfileItem: Identifiable, Equatable, Sendable {
    let id: String
    let session: Session
}

struct ProfileSection: Identifiable, Equatable, Sendable {
    let id: String
    let day: SessionDay
    let items: [ProfileItem]
    let showsCountBadge: Bool

    var count: Int { items.count }
}

struct UserProfile: Equatable, Sendable {
    let greeting: String
    let subtitle: String
    let sections: [ProfileSection]
}
