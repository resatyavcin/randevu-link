import Foundation

enum MoneyFormat {
    private static let formatter: NumberFormatter = {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "TRY"
        formatter.currencySymbol = "₺"
        formatter.locale = Locale(identifier: "tr_TR")
        formatter.maximumFractionDigits = 0
        formatter.minimumFractionDigits = 0
        return formatter
    }()

    static func string(_ amountTl: Int) -> String {
        formatter.string(from: NSNumber(value: amountTl)) ?? "₺\(amountTl)"
    }
}
