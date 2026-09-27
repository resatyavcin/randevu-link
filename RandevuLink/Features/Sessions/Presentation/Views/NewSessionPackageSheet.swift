import SwiftUI

struct NewSessionPackageSheet: View {
    @EnvironmentObject private var l10n: LocalizationManager
    @Environment(\.dismiss) private var dismiss

    var onSave: (NewSessionPackageInput) -> Void

    @State private var input = NewSessionPackageInput()
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    field(l10n(.sessionsFieldPhone)) {
                        TextField("5xxxxxxxxx", text: $input.customerPhone)
                            .keyboardType(.numberPad)
                    }
                    HStack(spacing: 10) {
                        field(l10n(.sessionsFieldFirstName)) {
                            TextField("", text: $input.customerFirstName)
                        }
                        field(l10n(.sessionsFieldLastName)) {
                            TextField("", text: $input.customerLastName)
                        }
                    }
                    field(l10n(.sessionsFieldName)) {
                        TextField(l10n(.sessionsFieldNamePlaceholder), text: $input.name)
                    }
                    field(l10n(.sessionsFieldService)) {
                        TextField(l10n(.sessionsFieldServiceHint), text: $input.serviceName)
                    }
                    HStack(spacing: 10) {
                        field(l10n(.sessionsFieldTotalSessions)) {
                            TextField("8", value: $input.totalSessions, format: .number)
                                .keyboardType(.numberPad)
                        }
                        field(l10n(.sessionsFieldTotalPrice)) {
                            TextField("0", value: $input.totalPriceTl, format: .number)
                                .keyboardType(.numberPad)
                        }
                    }
                    field(l10n(.sessionsFieldPeriod)) {
                        TextField(l10n(.sessionsFieldPeriodPlaceholder), text: $input.periodNote)
                    }

                    if let errorMessage {
                        Text(errorMessage)
                            .font(AppTypography.rowSource)
                            .foregroundStyle(Color.red.opacity(0.9))
                    }
                }
                .padding(AppSpacing.screenHorizontal)
                .padding(.bottom, 24)
            }
            .background(AppColors.background)
            .navigationTitle(l10n(.sessionsNew))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(l10n(.commonClose)) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(l10n(.sessionsSave)) { save() }
                        .fontWeight(.semibold)
                }
            }
        }
    }

    private func field<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(AppTypography.section)
                .foregroundStyle(AppColors.textSecondary)
            content()
                .padding(.horizontal, 14)
                .frame(height: 44)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(AppColors.cardBackground)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
    }

    private func save() {
        let phone = input.customerPhone.filter(\.isNumber)
        if phone.count != 10 || !phone.hasPrefix("5") {
            errorMessage = l10n(.sessionsErrorPhone)
            return
        }
        if input.customerFirstName.trimmingCharacters(in: .whitespaces).isEmpty
            || input.customerLastName.trimmingCharacters(in: .whitespaces).isEmpty {
            errorMessage = l10n(.sessionsErrorName)
            return
        }
        if input.name.trimmingCharacters(in: .whitespaces).isEmpty {
            errorMessage = l10n(.sessionsErrorPackageName)
            return
        }
        if input.totalSessions < 1 {
            errorMessage = l10n(.sessionsErrorSessions)
            return
        }
        if input.totalPriceTl < 0 {
            errorMessage = l10n(.sessionsErrorPrice)
            return
        }
        var cleaned = input
        cleaned.customerPhone = phone
        onSave(cleaned)
        dismiss()
    }
}
