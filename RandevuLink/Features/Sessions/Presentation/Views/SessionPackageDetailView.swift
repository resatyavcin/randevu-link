import SwiftUI
import UIKit

struct SessionPackageDetailView: View {
    @EnvironmentObject private var l10n: LocalizationManager
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var viewModel: SessionPackageDetailViewModel

    @State private var showComplete = false
    @State private var showCancelConfirm = false

    var body: some View {
        ZStack {
            AppColors.background
                .ignoresSafeArea()

            VStack(alignment: .leading, spacing: 0) {
                header

                ScrollView {
                    VStack(alignment: .leading, spacing: AppSpacing.sectionGap) {
                        hero
                        detailGroup
                        if let note = viewModel.package.periodNote, !note.isEmpty {
                            noteCard(note)
                        }
                    }
                    .padding(.horizontal, AppSpacing.screenHorizontal)
                    .padding(.top, 8)
                    .padding(.bottom, 32)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        }
        .safeAreaInset(edge: .bottom, spacing: 0) {
            if viewModel.package.status != .cancelled {
                actionBar
            }
        }
        .sheet(isPresented: $showComplete) {
            CompleteSessionSheet(
                visits: viewModel.package.pendingVisits,
                nextBalanceTl: viewModel.package.creditBalanceTl - viewModel.package.unitPriceTl,
                unitPriceTl: viewModel.package.unitPriceTl
            ) { visitId, staffName in
                viewModel.complete(visitId: visitId, staffName: staffName)
            }
            .environmentObject(l10n)
            .presentationDetents([.medium, .large])
            .presentationDragIndicator(.visible)
        }
        .confirmationDialog(
            l10n(.sessionsCancelConfirmTitle),
            isPresented: $showCancelConfirm,
            titleVisibility: .visible
        ) {
            Button(l10n(.sessionsCancelAction), role: .destructive) {
                viewModel.cancelPackage()
            }
            Button(l10n(.commonClose), role: .cancel) {}
        } message: {
            Text(l10n(.sessionsCancelConfirmMessage))
        }
        .overlay(alignment: .bottom) {
            if let message = viewModel.toastMessage {
                Text(message)
                    .font(AppTypography.section)
                    .foregroundStyle(AppColors.background)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(AppColors.accent)
                    .clipShape(Capsule())
                    .padding(.bottom, 90)
                    .onAppear {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 1.6) {
                            viewModel.toastMessage = nil
                        }
                    }
            }
        }
        .animation(.easeInOut(duration: 0.2), value: viewModel.toastMessage)
    }

    private var header: some View {
        HStack {
            Button {
                dismiss()
            } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(AppColors.icon)
                    .frame(width: 34, height: 34)
                    .background(AppColors.controlBackground)
                    .clipShape(Circle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(l10n(.commonBack))

            Spacer(minLength: 0)

            Text(l10n(.sessionTitle))
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(AppColors.textPrimary)

            Spacer(minLength: 0)

            Menu {
                Button(l10n(.sessionsCopyPhone)) {
                    UIPasteboard.general.string = viewModel.package.phoneDisplay
                    viewModel.toastMessage = l10n(.sessionsCopied)
                }
                if viewModel.package.status != .cancelled {
                    Button(l10n(.sessionsCancelAction), role: .destructive) {
                        showCancelConfirm = true
                    }
                }
            } label: {
                Image(systemName: "ellipsis")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(AppColors.icon)
                    .frame(width: 34, height: 34)
                    .background(AppColors.controlBackground)
                    .clipShape(Circle())
            }
        }
        .padding(.horizontal, AppSpacing.screenHorizontal)
        .padding(.top, 8)
        .padding(.bottom, 12)
    }

    private var actionBar: some View {
        HStack(spacing: 10) {
            pillButton(
                title: viewModel.package.feeQueued
                    ? l10n(.sessionsQueued)
                    : l10n(.sessionsSendToRegister),
                systemImage: viewModel.package.feeQueued ? "checkmark" : "banknote",
                prominent: false,
                enabled: viewModel.canQueueFee
            ) {
                viewModel.queueFee()
            }

            pillButton(
                title: l10n(.sessionCompletedStatus),
                systemImage: "checkmark",
                prominent: true,
                enabled: viewModel.canComplete
            ) {
                showComplete = true
            }
        }
        .padding(.horizontal, 18)
        .padding(.top, 8)
        .padding(.bottom, 8)
        .background(AppColors.background)
    }

    private func pillButton(
        title: String,
        systemImage: String,
        prominent: Bool,
        enabled: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: systemImage)
                    .font(.system(size: 12, weight: .bold))
                Text(title)
                    .font(AppTypography.listen)
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
            }
            .foregroundStyle(prominent ? AppColors.background : AppColors.textPrimary)
            .padding(.horizontal, 14)
            .frame(maxWidth: .infinity)
            .frame(height: AppSpacing.controlSize)
            .background(prominent ? AppColors.accent : AppColors.controlBackground)
            .clipShape(Capsule())
            .opacity(enabled ? 1 : 0.45)
        }
        .buttonStyle(.plain)
        .disabled(!enabled)
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: 6) {
            progressHeader

            Text(viewModel.package.name)
                .font(.system(size: 34, weight: .bold))
                .foregroundStyle(AppColors.textPrimary)
                .padding(.top, 12)

            Text(viewModel.package.customerName)
                .font(.system(size: 22, weight: .semibold))
                .foregroundStyle(AppColors.textPrimary)

            Text(viewModel.package.serviceName ?? viewModel.package.phoneDisplay)
                .font(AppTypography.subtitle)
                .foregroundStyle(AppColors.textSecondary)
        }
    }

    private var progressHeader: some View {
        let package = viewModel.package
        return VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .center, spacing: 12) {
                Text(statusTitle)
                    .font(AppTypography.section)
                    .foregroundStyle(statusForeground)
                    .padding(.horizontal, 12)
                    .frame(height: 30)
                    .background(statusBackground)
                    .clipShape(Capsule())

                Spacer(minLength: 8)

                VStack(alignment: .trailing, spacing: 0) {
                    HStack(alignment: .firstTextBaseline, spacing: 2) {
                        Text("\(package.completedCount)")
                            .font(.system(size: 22, weight: .bold))
                            .foregroundStyle(AppColors.textPrimary)
                        Text("/ \(package.totalSessions)")
                            .font(AppTypography.subtitle)
                            .foregroundStyle(AppColors.textSecondary)
                    }

                    Text(l10n(.sessionCompletedLabel))
                        .font(AppTypography.rowSource)
                        .foregroundStyle(AppColors.textSecondary)
                }
            }

            progressTrack
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(statusTitle), \(package.completedCount) / \(package.totalSessions)")
    }

    private var progressTrack: some View {
        let package = viewModel.package
        return HStack(spacing: 4) {
            ForEach(0..<package.totalSessions, id: \.self) { index in
                Capsule()
                    .fill(trackColor(at: index))
                    .frame(maxWidth: .infinity)
                    .frame(height: 6)
            }
        }
    }

    private var statusTitle: String {
        switch viewModel.package.status {
        case .active:
            viewModel.package.completedCount > 0
                ? l10n(.sessionInProgress)
                : l10n(.sessionUpcoming)
        case .completed:
            l10n(.sessionCompletedStatus)
        case .cancelled:
            l10n(.sessionsStatusCancelled)
        }
    }

    private var statusForeground: Color {
        viewModel.package.status == .active && viewModel.package.completedCount > 0
            ? AppColors.background
            : AppColors.textPrimary
    }

    private var statusBackground: Color {
        viewModel.package.status == .active && viewModel.package.completedCount > 0
            ? AppColors.accent
            : AppColors.controlBackground
    }

    private func trackColor(at index: Int) -> Color {
        let package = viewModel.package
        if index < package.completedCount {
            return AppColors.accent
        }
        if package.status == .active, index == package.completedCount {
            return AppColors.accent.opacity(0.35)
        }
        return AppColors.controlBackground
    }

    private var detailGroup: some View {
        let package = viewModel.package
        return VStack(spacing: AppSpacing.rowGap) {
            detailRow(l10n(.sessionsFieldPhone), value: package.phoneDisplay)
            detailRow(l10n(.sessionsTotalPrice), value: MoneyFormat.string(package.totalPriceTl))
            detailRow(l10n(.sessionsPaid), value: MoneyFormat.string(package.paidTotalTl))
            detailRow(l10n(.sessionsUnitPrice), value: MoneyFormat.string(package.unitPriceTl))
            detailRow(
                l10n(.sessionsBalance),
                value: MoneyFormat.string(
                    package.creditBalanceTl == 0 ? package.remainingTl : package.creditBalanceTl
                )
            )
            if let service = package.serviceName {
                detailRow(l10n(.sessionService), value: service)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: AppSpacing.cardRadius, style: .continuous))
    }

    private func noteCard(_ note: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(l10n(.sessionsFieldPeriod))
                .font(AppTypography.section)
                .foregroundStyle(AppColors.textSecondary)

            Text(note)
                .font(AppTypography.rowTitle)
                .foregroundStyle(AppColors.textPrimary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, AppSpacing.rowHorizontal)
        .padding(.vertical, AppSpacing.rowVertical)
        .background(AppColors.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: AppSpacing.cardRadius, style: .continuous))
    }

    private func detailRow(_ label: String, value: String) -> some View {
        HStack(spacing: 12) {
            Text(label)
                .font(AppTypography.rowTitle)
                .foregroundStyle(AppColors.textSecondary)

            Spacer(minLength: 8)

            Text(value)
                .font(AppTypography.rowTitle)
                .foregroundStyle(AppColors.textPrimary)
                .multilineTextAlignment(.trailing)
        }
        .padding(.horizontal, AppSpacing.rowHorizontal)
        .padding(.vertical, AppSpacing.rowVertical)
        .background(AppColors.cardBackground)
    }
}

struct CompleteSessionSheet: View {
    @EnvironmentObject private var l10n: LocalizationManager
    @Environment(\.dismiss) private var dismiss

    let visits: [PackageVisit]
    let nextBalanceTl: Int
    let unitPriceTl: Int
    var onConfirm: (_ visitId: String?, _ staffName: String) -> Void

    @State private var selectedVisitId: String?
    @State private var staffName = "Ayşe"
    private let staffOptions = ["Ayşe", "Mehmet", "Elif", "Can", "Zeynep"]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Text(l10n(.sessionsCompleteHint))
                        .font(AppTypography.subtitle)
                        .foregroundStyle(AppColors.textSecondary)

                    if nextBalanceTl < 0 {
                        Text(String(format: l10n(.sessionsCompleteDebtWarning), MoneyFormat.string(nextBalanceTl)))
                            .font(AppTypography.rowSource)
                            .foregroundStyle(AppColors.textSecondary)
                    }

                    Text(l10n(.sessionsCompleteVisit))
                        .font(AppTypography.section)
                        .foregroundStyle(AppColors.textSecondary)

                    Button {
                        selectedVisitId = nil
                    } label: {
                        visitLabel(
                            title: l10n(.sessionsCompleteNoVisit),
                            subtitle: String(format: l10n(.sessionsUnitHint), MoneyFormat.string(unitPriceTl)),
                            selected: selectedVisitId == nil
                        )
                    }
                    .buttonStyle(.plain)

                    ForEach(visits) { visit in
                        Button {
                            selectedVisitId = visit.id
                            if let name = visit.staffName {
                                staffName = name
                            }
                        } label: {
                            visitLabel(
                                title: visit.dateLabel,
                                subtitle: [visit.serviceName, visit.staffName]
                                    .compactMap { $0 }
                                    .joined(separator: " · "),
                                selected: selectedVisitId == visit.id
                            )
                        }
                        .buttonStyle(.plain)
                    }

                    Text(l10n(.sessionStaff))
                        .font(AppTypography.section)
                        .foregroundStyle(AppColors.textSecondary)

                    Picker(l10n(.sessionStaff), selection: $staffName) {
                        ForEach(staffOptions, id: \.self) { name in
                            Text(name).tag(name)
                        }
                    }
                    .pickerStyle(.menu)
                    .padding(.horizontal, AppSpacing.rowHorizontal)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .frame(height: 44)
                    .background(AppColors.cardBackground)
                    .clipShape(RoundedRectangle(cornerRadius: AppSpacing.cardRadius, style: .continuous))
                }
                .padding(AppSpacing.screenHorizontal)
            }
            .background(AppColors.background)
            .navigationTitle(l10n(.sessionCompletedStatus))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(l10n(.commonClose)) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(l10n(.sessionsConfirm)) {
                        onConfirm(selectedVisitId, staffName)
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
            .onAppear {
                selectedVisitId = visits.first?.id
                if let name = visits.first?.staffName {
                    staffName = name
                }
            }
        }
    }

    private func visitLabel(title: String, subtitle: String, selected: Bool) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(AppTypography.rowTitle)
                    .foregroundStyle(AppColors.textPrimary)
                Text(subtitle)
                    .font(AppTypography.rowSource)
                    .foregroundStyle(AppColors.textSecondary)
            }
            Spacer()
            if selected {
                Image(systemName: "checkmark")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(AppColors.accent)
            }
        }
        .padding(.horizontal, AppSpacing.rowHorizontal)
        .padding(.vertical, AppSpacing.rowVertical)
        .background(AppColors.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: AppSpacing.cardRadius, style: .continuous))
    }
}
