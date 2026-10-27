export const formatPrice = (value) => (value || 0).toLocaleString('vi-VN') + 'đ';

export const formatTime = (date) =>
    new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

export const formatDate = (iso) => {
    const date = new Date(iso);
    const time = formatTime(date);
    if (date.toDateString() === new Date().toDateString()) return `Hôm nay, ${time}`;
    return `${date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}, ${time}`;
};

export const addMinutes = (iso, minutes) => new Date(new Date(iso).getTime() + minutes * 60000);

const tones = { burger: 'cream', 'ga-ran': 'pink', pizza: 'pink', 'mon-an-kem': 'cream', 'do-uong': 'mint', 'trang-mieng': 'mint' };

export const toneOf = (categorySlug) => tones[categorySlug] || 'cream';

export const paymentMethods = {
    cod: { name: 'Tiền mặt', hint: 'Trả cho shipper khi nhận', footnote: 'Bạn trả tiền mặt khi nhận hàng' },
    vnpay: { name: 'Chuyển khoản', hint: 'Quét mã QR ngân hàng', footnote: 'Mã QR sẽ hiện sau khi đặt hàng' },
    momo: { name: 'Ví điện tử', hint: 'Thanh toán qua ví MoMo', footnote: 'Bạn sẽ được chuyển sang ví để thanh toán' },
    card: { name: 'Thẻ', hint: 'Thẻ ngân hàng', footnote: 'Thanh toán bằng thẻ' }
};

export const CHECKOUT_PAYMENTS = ['cod', 'vnpay', 'momo'];

export const STEPS = [
    { statuses: ['pending', 'confirmed'], title: 'Đã nhận đơn' },
    { statuses: ['preparing'], title: 'Bếp đang chuẩn bị', detail: 'Món đang được chế biến' },
    { statuses: ['delivering'], title: 'Shipper đang giao', detail: 'Shipper đang trên đường tới' },
    { statuses: ['delivered'], title: 'Đã giao', detail: 'Chúc bạn ngon miệng' }
];

export const stageOf = (status) => STEPS.findIndex((s) => s.statuses.includes(status));

export const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'delivering'];

export const statusLabels = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    preparing: 'Đang chuẩn bị',
    delivering: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy'
};

export const lineKey = (line) =>
    line.type === 'combo'
        ? `combo-${line.comboId}`
        : `product-${line.productId}-${line.size || ''}-${(line.toppingIds || []).join('.')}`;

export const voucherError = (voucher, subtotal) => {
    if (!voucher) return 'Mã giảm giá không tồn tại.';
    const now = Date.now();
    if (!voucher.isActive || now < new Date(voucher.startDate) || now > new Date(voucher.endDate)) return 'Mã giảm giá đã hết hạn.';
    if (voucher.usedCount >= voucher.usageLimit) return 'Mã giảm giá đã hết lượt dùng.';
    if (subtotal < voucher.minOrderValue) return `Đơn tối thiểu ${formatPrice(voucher.minOrderValue)} để dùng mã này.`;
    return '';
};

export const voucherDiscount = (voucher, subtotal, shipping) => {
    if (!voucher || voucherError(voucher, subtotal)) return 0;
    if (voucher.discountType === 'percent') return Math.min(Math.round((subtotal * voucher.discountValue) / 100), voucher.maxDiscount || Infinity);
    if (voucher.discountType === 'fixed') return Math.min(voucher.discountValue, subtotal);
    if (voucher.discountType === 'shipping') return Math.min(shipping, voucher.maxDiscount || shipping);
    return 0;
};
