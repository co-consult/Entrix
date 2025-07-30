"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QRCodeStatus = exports.PaymentMethod = exports.SaleChannel = exports.SaleMode = void 0;
var SaleMode;
(function (SaleMode) {
    SaleMode["IDENTIFIED"] = "IDENTIFIED";
    SaleMode["ANONYMOUS"] = "ANONYMOUS";
})(SaleMode || (exports.SaleMode = SaleMode = {}));
var SaleChannel;
(function (SaleChannel) {
    SaleChannel["PHYSICAL"] = "PHYSICAL";
    SaleChannel["FRONTEND"] = "FRONTEND";
})(SaleChannel || (exports.SaleChannel = SaleChannel = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "CASH";
    PaymentMethod["CARD"] = "CARD";
    PaymentMethod["FLOUCI"] = "FLOUCI";
    PaymentMethod["BANK_TRANSFER"] = "BANK_TRANSFER";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var QRCodeStatus;
(function (QRCodeStatus) {
    QRCodeStatus["AVAILABLE"] = "AVAILABLE";
    QRCodeStatus["ASSIGNED"] = "ASSIGNED";
    QRCodeStatus["DISABLED"] = "DISABLED";
})(QRCodeStatus || (exports.QRCodeStatus = QRCodeStatus = {}));
//# sourceMappingURL=sale-types.js.map