import Foundation

struct ProfileMockDataSource: Sendable {
    func load() -> UserProfile {
        UserProfile(
            greeting: "Reşat",
            subtitle: "",
            sections: [
                ProfileSection(
                    id: "today",
                    day: .today,
                    items: [
                        ProfileItem(
                            id: "selin",
                            session: Session(
                                customerName: "Selin Kaya",
                                service: "Kesim",
                                staffName: "Ayşe",
                                staffColorHex: "E25B45",
                                day: .today,
                                hour: 9,
                                minute: 0,
                                durationMinutes: 60,
                                note: "Kısa kesim, katman yok.",
                                status: .inProgress,
                                completedCount: 3,
                                totalCount: 8
                            )
                        ),
                        ProfileItem(
                            id: "burak",
                            session: Session(
                                customerName: "Burak Öz",
                                service: "Sakal",
                                staffName: "Mehmet",
                                staffColorHex: "3D7A6A",
                                day: .today,
                                hour: 10,
                                minute: 0,
                                durationMinutes: 30,
                                note: "Çizgi net olsun.",
                                status: .upcoming,
                                completedCount: 1,
                                totalCount: 4
                            )
                        ),
                        ProfileItem(
                            id: "irem",
                            session: Session(
                                customerName: "İrem Çelik",
                                service: "Manikür",
                                staffName: "Elif",
                                staffColorHex: "5B6BC7",
                                day: .today,
                                hour: 9,
                                minute: 30,
                                durationMinutes: 45,
                                note: "Jel yok, doğal görünüm.",
                                status: .inProgress,
                                completedCount: 5,
                                totalCount: 8
                            )
                        )
                    ],
                    showsCountBadge: true
                ),
                ProfileSection(
                    id: "tomorrow",
                    day: .tomorrow,
                    items: [
                        ProfileItem(
                            id: "deniz",
                            session: Session(
                                customerName: "Deniz Acar",
                                service: "Boya",
                                staffName: "Ayşe",
                                staffColorHex: "E25B45",
                                day: .tomorrow,
                                hour: 11,
                                minute: 0,
                                durationMinutes: 120,
                                note: "Kök boya. Önceki renk 6.1.",
                                status: .upcoming,
                                completedCount: 2,
                                totalCount: 8
                            )
                        )
                    ],
                    showsCountBadge: false
                )
            ]
        )
    }
}
