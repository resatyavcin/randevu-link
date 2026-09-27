import SwiftUI

struct WalkInExtraSheet: View {
    @EnvironmentObject private var l10n: LocalizationManager
    @Environment(\.dismiss) private var dismiss

    let services: [RegisterCatalogService]
    let staffNames: [String]
    var onCollect: (
        _ firstName: String,
        _ lastName: String,
        _ phone: String,
        _ serviceIds: [String],
        _ method: PaymentMethod,
        _ staffName: String,
        _ note: String?
    ) -> Void

    @State private var firstName = ""
    @State private var lastName = ""
    @State private var phone = ""
    @State private var selectedIds: Set<String> = []
    @State private var method: PaymentMethod = .cash
    @State private var staffName = ""
    @State private var note = ""
    @State private var error: String?

    private var total: Int {
        services.filter { selectedIds.contains($0.id) }.reduce(0) { $0 + $1.priceTl }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    HStack(spacing: 10) {
                        field(l10n(.sessionsFieldFirstName)) { TextField("", text: $firstName) }
                        field(l10n(.sessionsFieldLastName)) { TextField("", text: $lastName) }
                    }
                    field(l10n(.sessionsFieldPhone)) {
                        TextField("5xxxxxxxxx", text: $phone)
                            .keyboardType(.numberPad)
                    }

                    Text(l10n(.registerServices))
                        .font(AppTypography.section)
                        .foregroundStyle(AppColors.textSecondary)

                    ForEach(services) { service in
                        Button {
                            if selectedIds.contains(service.id) {
                                selectedIds.remove(service.id)
                            } else {
                                selectedIds.insert(service.id)
                            }
                        } label: {
                            HStack {
                                Text(service.name)
                                    .font(AppTypography.rowTitle)
                                    .foregroundStyle(AppColors.textPrimary)
                                Spacer()
                                Text(MoneyFormat.string(service.priceTl))
                                    .font(AppTypography.rowSource)
                                    .foregroundStyle(AppColors.textSecondary)
                                Image(systemName: selectedIds.contains(service.id) ? "checkmark.circle.fill" : "circle")
                                    .foregroundStyle(AppColors.accent)
                            }
                            .padding(14)
                            .background(AppColors.cardBackground)
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        }
                        .buttonStyle(.plain)
                    }

                    Text("\(l10n(.registerAmount)) \(MoneyFormat.string(total))")
                        .font(AppTypography.rowTitle)
                        .foregroundStyle(AppColors.textPrimary)

                    HStack(spacing: 8) {
                        methodButton(.cash, l10n(.registerMethodCash))
                        methodButton(.card, l10n(.registerMethodCard))
                    }

                    Picker(l10n(.sessionStaff), selection: $staffName) {
                        ForEach(staffNames, id: \.self) { name in
                            Text(name).tag(name)
                        }
                    }
                    .pickerStyle(.menu)
                    .padding(.horizontal, 14)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .frame(height: 44)
                    .background(AppColors.cardBackground)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                    field(l10n(.sessionNote)) { TextField("", text: $note) }

                    if let error {
                        Text(error)
                            .font(AppTypography.rowSource)
                            .foregroundStyle(Color.red.opacity(0.9))
                    }
                }
                .padding(AppSpacing.screenHorizontal)
            }
            .background(AppColors.background)
            .navigationTitle(l10n(.registerWalkIn))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(l10n(.commonClose)) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(l10n(.registerCollect)) { collect() }
                        .fontWeight(.semibold)
                }
            }
            .onAppear { staffName = staffNames.first ?? "" }
        }
    }

    private func methodButton(_ value: PaymentMethod, _ title: String) -> some View {
        Button { method = value } label: {
            Text(title)
                .font(AppTypography.section)
                .foregroundStyle(method == value ? AppColors.background : AppColors.textPrimary)
                .frame(maxWidth: .infinity)
                .frame(height: 40)
                .background(method == value ? AppColors.accent : AppColors.cardBackground)
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
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

    private func collect() {
        let phoneDigits = phone.filter(\.isNumber)
        if firstName.trimmingCharacters(in: .whitespaces).isEmpty
            || lastName.trimmingCharacters(in: .whitespaces).isEmpty {
            error = l10n(.sessionsErrorName)
            return
        }
        if phoneDigits.count != 10 {
            error = l10n(.sessionsErrorPhone)
            return
        }
        if selectedIds.isEmpty {
            error = l10n(.registerErrorServices)
            return
        }
        onCollect(
            firstName.trimmingCharacters(in: .whitespaces),
            lastName.trimmingCharacters(in: .whitespaces),
            phoneDigits,
            Array(selectedIds),
            method,
            staffName,
            note.isEmpty ? nil : note
        )
        dismiss()
    }
}

struct CollectPendingSheet: View {
    @EnvironmentObject private var l10n: LocalizationManager
    @Environment(\.dismiss) private var dismiss

    let title: String
    let customerName: String
    let subtitle: String
    let defaultAmount: Int
    let staffNames: [String]
    var onCollect: (_ amountTl: Int, _ method: PaymentMethod, _ staffName: String) -> Void

    @State private var amountText = ""
    @State private var method: PaymentMethod = .cash
    @State private var staffName = ""
    @State private var error: String?

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 14) {
                Text(customerName)
                    .font(AppTypography.rowTitle)
                    .foregroundStyle(AppColors.textPrimary)
                Text(subtitle)
                    .font(AppTypography.rowSource)
                    .foregroundStyle(AppColors.textSecondary)

                TextField(l10n(.registerAmount), text: $amountText)
                    .keyboardType(.numberPad)
                    .padding(.horizontal, 14)
                    .frame(height: 44)
                    .background(AppColors.cardBackground)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                HStack(spacing: 8) {
                    methodButton(.cash, l10n(.registerMethodCash))
                    methodButton(.card, l10n(.registerMethodCard))
                }

                Picker(l10n(.sessionStaff), selection: $staffName) {
                    ForEach(staffNames, id: \.self) { name in
                        Text(name).tag(name)
                    }
                }
                .pickerStyle(.menu)
                .padding(.horizontal, 14)
                .frame(maxWidth: .infinity, alignment: .leading)
                .frame(height: 44)
                .background(AppColors.cardBackground)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                if let error {
                    Text(error)
                        .font(AppTypography.rowSource)
                        .foregroundStyle(Color.red.opacity(0.9))
                }

                Spacer()
            }
            .padding(AppSpacing.screenHorizontal)
            .background(AppColors.background)
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(l10n(.commonClose)) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(l10n(.registerCollect)) { collect() }
                        .fontWeight(.semibold)
                }
            }
            .onAppear {
                amountText = defaultAmount > 0 ? String(defaultAmount) : ""
                staffName = staffNames.first ?? ""
            }
        }
    }

    private func methodButton(_ value: PaymentMethod, _ title: String) -> some View {
        Button { method = value } label: {
            Text(title)
                .font(AppTypography.section)
                .foregroundStyle(method == value ? AppColors.background : AppColors.textPrimary)
                .frame(maxWidth: .infinity)
                .frame(height: 40)
                .background(method == value ? AppColors.accent : AppColors.cardBackground)
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }

    private func collect() {
        guard let amount = Int(amountText), amount >= 0 else {
            error = l10n(.registerErrorAmount)
            return
        }
        onCollect(amount, method, staffName)
        dismiss()
    }
}
