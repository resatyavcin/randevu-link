import SwiftUI

struct RegisterView: View {
    @EnvironmentObject private var l10n: LocalizationManager
    @ObservedObject var viewModel: RegisterViewModel

    @State private var showWalkIn = false
    @State private var collectingAppointment: PendingRegisterItem?

    var body: some View {
        ZStack {
            AppColors.background
                .ignoresSafeArea()

            VStack(alignment: .leading, spacing: 20) {
                header

                ScrollView {
                    VStack(alignment: .leading, spacing: AppSpacing.sectionGap) {
                        summarySection
                        periodAndTabs
                        listSection
                    }
                    .padding(.bottom, AppSpacing.bottomBarInset)
                }
            }
            .padding(.horizontal, AppSpacing.screenHorizontal)
            .padding(.top, AppSpacing.greetingTop)
        }
        .onAppear { viewModel.load() }
        .sheet(isPresented: $showWalkIn) {
            WalkInExtraSheet(
                services: viewModel.services,
                staffNames: viewModel.staffNames
            ) { first, last, phone, serviceIds, method, staff, note in
                viewModel.createWalkIn(
                    firstName: first,
                    lastName: last,
                    phone: phone,
                    serviceIds: serviceIds,
                    method: method,
                    staffName: staff,
                    note: note
                )
            }
            .environmentObject(l10n)
            .presentationDetents([.large])
            .presentationDragIndicator(.visible)
        }
        .sheet(item: $collectingAppointment) { item in
            CollectPendingSheet(
                title: l10n(.registerCollectAppointment),
                customerName: item.customerName,
                subtitle: item.subtitle,
                defaultAmount: item.amountHintTl ?? 0,
                staffNames: viewModel.staffNames
            ) { amount, method, _ in
                viewModel.collectPendingAppointment(id: item.id, amountTl: amount, method: method)
            }
            .environmentObject(l10n)
            .presentationDetents([.medium])
            .presentationDragIndicator(.visible)
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
                    .padding(.bottom, AppSpacing.bottomBarInset)
                    .onAppear {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 1.6) {
                            viewModel.toastMessage = nil
                        }
                    }
            }
        }
    }

    private var header: some View {
        HStack(alignment: .center) {
            Text(l10n(.registerTitle))
                .font(.system(size: 28, weight: .bold))
                .foregroundStyle(AppColors.textPrimary)

            Spacer(minLength: 12)

            Button {
                showWalkIn = true
            } label: {
                Image(systemName: "plus")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(AppColors.icon)
                    .frame(width: 40, height: 40)
                    .background(AppColors.controlBackground)
                    .clipShape(Circle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(l10n(.registerWalkIn))
        }
    }

    private var summarySection: some View {
        let summary = viewModel.summary
        return VStack(spacing: AppSpacing.rowGap) {
            summaryRow(
                l10n(.registerStatTotal),
                amount: summary?.totalPaidTl ?? 0
            )
            summaryRow(
                l10n(.registerStatCash),
                amount: summary?.cashTl ?? 0
            )
            summaryRow(
                l10n(.registerStatCard),
                amount: summary?.cardTl ?? 0
            )
        }
        .clipShape(RoundedRectangle(cornerRadius: AppSpacing.cardRadius, style: .continuous))
    }

    private func summaryRow(_ label: String, amount: Int) -> some View {
        HStack {
            Text(label)
                .font(AppTypography.rowTitle)
                .foregroundStyle(AppColors.textSecondary)
            Spacer()
            Text(MoneyFormat.string(amount))
                .font(AppTypography.rowTitle)
                .foregroundStyle(amount > 0 ? AppColors.positive : AppColors.textPrimary)
        }
        .padding(.horizontal, AppSpacing.rowHorizontal)
        .padding(.vertical, AppSpacing.rowVertical)
        .background(AppColors.cardBackground)
    }

    private var periodAndTabs: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                periodChip(.today, l10n(.registerPeriodToday))
                periodChip(.days30, l10n(.registerPeriod30))
                periodChip(.days90, l10n(.registerPeriod90))
            }

            HStack(spacing: 0) {
                tabChip(.paid, l10n(.registerTabPaid))
                tabChip(.pending, "\(l10n(.registerTabPending)) (\(viewModel.pendingCount))")
            }
            .padding(4)
            .background(AppColors.controlBackground)
            .clipShape(Capsule())
        }
    }

    private func periodChip(_ period: RegisterPeriod, _ title: String) -> some View {
        Button {
            viewModel.period = period
        } label: {
            Text(title)
                .font(AppTypography.section)
                .foregroundStyle(viewModel.period == period ? AppColors.textPrimary : AppColors.textSecondary)
                .padding(.horizontal, 12)
                .frame(height: 32)
                .background(viewModel.period == period ? AppColors.controlSelected : Color.clear)
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }

    private func tabChip(_ tab: RegisterTab, _ title: String) -> some View {
        Button {
            viewModel.tab = tab
        } label: {
            Text(title)
                .font(AppTypography.section)
                .foregroundStyle(viewModel.tab == tab ? AppColors.textPrimary : AppColors.textSecondary)
                .frame(maxWidth: .infinity)
                .frame(height: 36)
                .background(viewModel.tab == tab ? AppColors.controlSelected : Color.clear)
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }

    private var listSection: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sectionToCard) {
            if viewModel.tab == .paid {
                if viewModel.filteredPayments.isEmpty {
                    empty(l10n(.registerEmptyPaid))
                } else {
                    VStack(spacing: AppSpacing.rowGap) {
                        ForEach(viewModel.filteredPayments) { row in
                            ProfileRowCard(
                                title: row.customerName,
                                source: "\(row.sessionName ?? row.serviceName ?? "—") · \(MoneyFormat.string(row.paidAmountTl))"
                            )
                            .background(AppColors.cardBackground)
                        }
                    }
                    .clipShape(RoundedRectangle(cornerRadius: AppSpacing.cardRadius, style: .continuous))
                }
            } else if viewModel.pending.isEmpty {
                empty(l10n(.registerEmptyPending))
            } else {
                VStack(spacing: AppSpacing.rowGap) {
                    ForEach(viewModel.pending) { item in
                        Button {
                            collectingAppointment = item
                        } label: {
                            ProfileRowCard(
                                title: item.customerName,
                                source: item.subtitle
                            )
                            .background(AppColors.cardBackground)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                    }
                }
                .clipShape(RoundedRectangle(cornerRadius: AppSpacing.cardRadius, style: .continuous))
            }
        }
    }

    private func empty(_ text: String) -> some View {
        Text(text)
            .font(AppTypography.subtitle)
            .foregroundStyle(AppColors.textSecondary)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.vertical, 12)
    }
}
