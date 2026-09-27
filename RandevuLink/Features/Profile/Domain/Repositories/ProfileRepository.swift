import Foundation

protocol ProfileRepository: Sendable {
    func fetchProfile() -> UserProfile
}
