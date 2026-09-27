import SwiftUI

struct SessionsListView: View {
    @EnvironmentObject private var l10n: LocalizationManager
    @ObservedObject var viewModel: SessionsListViewModel
    @State private var selectedPackage: SessionPackage?
    @State private var showNewSheet = false

    var body: some View {
        ZStack {
            AppColors.background
                .ignoresSafeArea()

            VStack(alignment: .leading, spacing: 20) {
                header

                ScrollView {
                    VStack(alignment: .leading, spacing: AppSpacing.sectionGap) {
                        if viewModel.packages.isEmpty {
                            Text(l10n(.sessionsEmpty))
                                .font(AppTypography.subtitle)
                                .foregroundStyle(AppColors.textSecondary)
                                .frame(maxWidth: .infinity)
                                .padding(.top, 40)
                        } else {
                            ForEach(sections, id: \.title) { section in
                                sectionBlock(section)
                            }
                        }
                    }
                    .padding(.bottom, AppSpacing.bottomBarInset)
                }
            }
            .padding(.horizontal, AppSpacing.screenHorizontal)
            .padding(.top, AppSpacing.greetingTop)
        }
        .onAppear { viewModel.load() }
        .sheet(isPresented: $showNewSheet) {
            NewSessionPackageSheet { input in
                viewModel.add(input)
            }
            .environmentObject(l10n)
            .presentationDetents([.large])
            .presentationDragIndicator(.visible)
        }
        .fullScreenCover(item: $selectedPackage) { package in
            SessionPackageDetailView(
                viewModel: SessionPackageDetailViewModel(package: package)
            )
            .environmentObject(l10n)
        }
    }

    private var header: some View {
        HStack(alignment: .center) {
            Text(l10n(.sessionsTitle))
                .font(.system(size: 28, weight: .bold))
                .foregroundStyle(AppColors.textPrimary)

            Spacer(minLength: 12)

            Button {
                showNewSheet = true
            } label: {
                Image(systemName: "plus")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(AppColors.icon)
                    .frame(width: 40, height: 40)
                    .background(AppColors.controlBackground)
                    .clipShape(Circle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(l10n(.sessionsNew))
        }
    }

    private struct Section: Equatable {
        let title: String
        let items: [SessionPackage]
        let showsBadge: Bool
    }

    private var sections: [Section] {
        let active = sortedWithDebtFirst(viewModel.packages.filter { $0.status == .active })
        let completed = viewModel.packages.filter { $0.status == .completed }
        let cancelled = viewModel.packages.filter { $0.status == .cancelled }
        var result: [Section] = []
        if !active.isEmpty {
            result.append(Section(title: l10n(.sessionsStatusActive), items: active, showsBadge: true))
        }
        if !completed.isEmpty {
            result.append(Section(title: l10n(.sessionsStatusCompleted), items: completed, showsBadge: false))
        }
        if !cancelled.isEmpty {
            result.append(Section(title: l10n(.sessionsStatusCancelled), items: cancelled, showsBadge: false))
        }
        return result
    }

    private func sortedWithDebtFirst(_ packages: [SessionPackage]) -> [SessionPackage] {
        packages.sorted { lhs, rhs in
            let leftDebt = lhs.creditBalanceTl < 0
            let rightDebt = rhs.creditBalanceTl < 0
            if leftDebt != rightDebt { return leftDebt && !rightDebt }
            return lhs.customerName.localizedCaseInsensitiveCompare(rhs.customerName) == .orderedAscending
        }
    }

    private func sectionBlock(_ section: Section) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.sectionToCard) {
            SectionHeaderView(
                title: section.title,
                count: section.items.count,
                showsBadge: section.showsBadge
            )

            VStack(spacing: AppSpacing.rowGap) {
                ForEach(section.items) { package in
                    Button {
                        selectedPackage = package
                    } label: {
                        sessionRow(package)
                    }
                    .buttonStyle(.plain)
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: AppSpacing.cardRadius, style: .continuous))
        }
    }

    private func sessionRow(_ package: SessionPackage) -> some View {
        let inDebt = package.creditBalanceTl < 0
        return HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                Text(package.customerName)
                    .font(AppTypography.rowTitle)
                    .foregroundStyle(AppColors.textPrimary)
                    .multilineTextAlignment(.leading)

                Text("\(package.name) · \(package.completedCount)/\(package.totalSessions)")
                    .font(AppTypography.rowSource)
                    .foregroundStyle(AppColors.textSecondary)
            }

            Spacer(minLength: 8)

            if inDebt {
                Text(l10n(.sessionsDebt))
                    .font(AppTypography.badge)
                    .foregroundStyle(AppColors.textPrimary)
                    .padding(.horizontal, 10)
                    .frame(height: 26)
                    .background(AppColors.controlBackground)
                    .clipShape(Capsule())
            }

            Image(systemName: "chevron.right")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(AppColors.textSecondary.opacity(0.7))
        }
        .padding(.horizontal, AppSpacing.rowHorizontal)
        .padding(.vertical, AppSpacing.rowVertical)
        .background(inDebt ? AppColors.controlBackground : AppColors.cardBackground)
        .contentShape(Rectangle())
        .accessibilityLabel(
            inDebt
                ? "\(package.customerName), \(l10n(.sessionsDebt))"
                : package.customerName
        )
    }
}
