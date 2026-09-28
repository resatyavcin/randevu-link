import Foundation
import SwiftData

enum NotesStore {
    static let appGroup = "group.com.resatyavcin.app"
    static let cloudContainerId = "iCloud.com.resatyavcin.app"

    static let shared: ModelContainer = {
        let schema = Schema([NoteGroupEntity.self, NoteItemEntity.self])
        let url = storeURL()
        let iCloudAvailable = FileManager.default.ubiquityIdentityToken != nil

        let configuration: ModelConfiguration
        if iCloudAvailable {
            configuration = ModelConfiguration(
                schema: schema,
                url: url,
                cloudKitDatabase: .private(cloudContainerId)
            )
        } else {
            configuration = ModelConfiguration(
                schema: schema,
                url: url,
                cloudKitDatabase: .none
            )
        }

        do {
            return try ModelContainer(for: schema, configurations: [configuration])
        } catch {
            let fallback = ModelConfiguration(schema: schema, url: url, cloudKitDatabase: .none)
            do {
                return try ModelContainer(for: schema, configurations: [fallback])
            } catch {
                fatalError("SwiftData store açılamadı: \(error)")
            }
        }
    }()

    private static func storeURL() -> URL {
        let base = FileManager.default
            .containerURL(forSecurityApplicationGroupIdentifier: appGroup)
            ?? FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        return base.appendingPathComponent("Notes.store")
    }
}
