import CoreData
import Foundation
import SwiftData

enum NotesStore {
    static let appGroup = "group.com.resatyavcin.app"
    static let cloudContainerId = "iCloud.com.resatyavcin.app"

    nonisolated(unsafe) private static var cloudObserver: NSObjectProtocol?

    static let shared: ModelContainer = {
        let schema = Schema([
            NoteGroupEntity.self,
            NoteItemEntity.self,
            AppPreferenceEntity.self
        ])
        let url = storeURL()
        let iCloudAvailable = FileManager.default.ubiquityIdentityToken != nil
        print("[CloudKit] yerel dosya: \(url.path)")
        print("[CloudKit] iCloud hesabı: \(iCloudAvailable ? "var" : "yok")")

        let configuration: ModelConfiguration
        if iCloudAvailable {
            print("[CloudKit] private veritabanı deneniyor: \(cloudContainerId)")
            startCloudLogging()
            configuration = ModelConfiguration(
                schema: schema,
                url: url,
                cloudKitDatabase: .private(cloudContainerId)
            )
        } else {
            print("[CloudKit] yalnızca yerel kayıt")
            configuration = ModelConfiguration(
                schema: schema,
                url: url,
                cloudKitDatabase: .none
            )
        }

        do {
            let container = try ModelContainer(for: schema, configurations: [configuration])
            print("[CloudKit] depo açıldı, bulut: \(iCloudAvailable ? "açık" : "kapalı")")
            return container
        } catch {
            print("[CloudKit] bulut deposu açılamadı, yerele düşüldü: \(error)")
            let fallback = ModelConfiguration(schema: schema, url: url, cloudKitDatabase: .none)
            do {
                return try ModelContainer(for: schema, configurations: [fallback])
            } catch {
                fatalError("SwiftData store açılamadı: \(error)")
            }
        }
    }()

    private static func startCloudLogging() {
        guard cloudObserver == nil else { return }
        cloudObserver = NotificationCenter.default.addObserver(
            forName: NSPersistentCloudKitContainer.eventChangedNotification,
            object: nil,
            queue: nil
        ) { note in
            guard let event = note.userInfo?[NSPersistentCloudKitContainer.eventNotificationUserInfoKey]
                as? NSPersistentCloudKitContainer.Event else { return }
            let kind = cloudEventName(event.type)
            if event.endDate == nil {
                print("[CloudKit] \(kind) başladı")
            } else if event.succeeded {
                print("[CloudKit] \(kind) tamam")
            } else {
                let detail = event.error.map { String(describing: $0) } ?? "ayrıntı yok"
                print("[CloudKit] \(kind) hata: \(detail)")
            }
        }
    }

    private static func cloudEventName(_ type: NSPersistentCloudKitContainer.EventType) -> String {
        switch type {
        case .setup: "setup"
        case .import: "import"
        case .export: "export"
        @unknown default: "unknown"
        }
    }

    private static func storeURL() -> URL {
        let base = FileManager.default
            .containerURL(forSecurityApplicationGroupIdentifier: appGroup)
            ?? FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        return base.appendingPathComponent("Notes.store")
    }
}
