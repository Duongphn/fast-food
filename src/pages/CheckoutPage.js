import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import api, { CURRENT_USER_ID } from '../api';
import { CheckoutHeader } from '../components/Common';
import { useStore } from '../context/CartContext';
import { CHECKOUT_PAYMENTS, formatPrice, lineKey, paymentMethods } from '../utils';
import { SummaryRows } from './CartPage';

const deliveryOptions = {
    now: { name: 'Giao ngay', hint: 'Khoảng 25–35 phút' },
    later: { name: 'Hẹn giờ giao', hint: 'Chọn khung giờ trong hôm nay' }
};

const timeSlots = ['11:00 – 11:30', '12:00 – 12:30', '18:00 – 18:30', '19:00 – 19:30', '20:00 – 20:30'];

const paymentOptions = Object.fromEntries(CHECKOUT_PAYMENTS.map((key) => [key, paymentMethods[key]]));

function OptionCards({ options, value, onChange }) {
    return (
        <div className={`option-grid cols-${Object.keys(options).length}`}>
            {Object.entries(options).map(([key, opt]) => (
                <button
                    type="button"
                    key={key}
                    className={`option-card ${value === key ? 'active' : ''}`}
                    onClick={() => onChange(key)}
                >
                    <strong>{opt.name}</strong>
                    <span>{opt.hint}</span>
                </button>
            ))}
        </div>
    );
}

function Field({ label, error, children }) {
    return (
        <label className="field">
            <span className="field-label">{label}</span>
            {children}
            {error && <span className="form-error">{error}</span>}
        </label>
    );
}

function CheckoutPage() {
    const { items, totals, voucherCode, lineInfo, placeOrder } = useStore();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', phone: '', street: '', ward: '', city: '', shipperNote: '' });
    const [delivery, setDelivery] = useState('now');
    const [slot, setSlot] = useState(timeSlots[0]);
    const [payment, setPayment] = useState('cod');
    const [agreed, setAgreed] = useState(true);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        api.get('/addresses', { params: { userId: CURRENT_USER_ID } })
            .then(({ data }) => {
                const address = data.find((a) => a.isDefault) || data[0];
                if (!address) return;
                setForm((prev) => ({
                    ...prev,
                    name: prev.name || address.receiverName,
                    phone: prev.phone || address.phone,
                    street: prev.street || address.street,
                    ward: prev.ward || [address.ward, address.district].filter(Boolean).join(', '),
                    city: prev.city || address.city
                }));
            })
            .catch(() => {});
    }, []);

    if (items.length === 0 && !submitting) return <Navigate to="/cart" replace />;

    const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        const next = {};
        if (!form.name.trim()) next.name = 'Vui lòng nhập họ tên';
        if (!/^0\d{9}$/.test(form.phone.replace(/\s/g, ''))) next.phone = 'Số điện thoại gồm 10 số, bắt đầu bằng 0';
        if (!form.street.trim()) next.street = 'Vui lòng nhập địa chỉ';
        if (!form.ward.trim()) next.ward = 'Bắt buộc';
        if (!form.city.trim()) next.city = 'Bắt buộc';
        if (!agreed) next.agreed = 'Bạn cần đồng ý với chính sách';
        setErrors(next);
        if (Object.keys(next).length) return;

        setSubmitting(true);
        setSubmitError('');
        try {
            const order = await placeOrder({
                receiverName: form.name.trim(),
                phone: form.phone.replace(/\s/g, ''),
                fullAddress: [form.street, form.ward, form.city].map((s) => s.trim()).join(', '),
                shipperNote: form.shipperNote.trim(),
                deliveryTime: delivery === 'now' ? 'now' : slot,
                paymentMethod: payment
            });
            navigate(`/tracking/${order.id}`);
        } catch {
            setSubmitting(false);
            setSubmitError('Đặt hàng không thành công, vui lòng thử lại.');
        }
    };

    return (
        <div className="page-flow">
            <CheckoutHeader step={2} />
            <main className="container-gr flow-main">
                <Link to="/cart" className="back-link">← Quay lại giỏ hàng</Link>
                <h1 className="page-title">Thông tin đặt hàng</h1>

                <form className="flow-grid" onSubmit={submit} noValidate>
                    <div className="flow-left">
                        <fieldset className="card form-card">
                            <legend>Người nhận</legend>
                            <div className="form-row">
                                <Field label="Họ và tên" error={errors.name}>
                                    <input className="input" placeholder="Nguyễn Văn A" value={form.name} onChange={set('name')} />
                                </Field>
                                <Field label="Số điện thoại" error={errors.phone}>
                                    <input className="input" type="tel" placeholder="09xx xxx xxx" value={form.phone} onChange={set('phone')} />
                                </Field>
                            </div>
                        </fieldset>

                        <fieldset className="card form-card">
                            <legend>Địa chỉ giao hàng</legend>
                            <Field label="Số nhà, tên đường" error={errors.street}>
                                <input className="input" placeholder="Ví dụ: 12 Nguyễn Huệ" value={form.street} onChange={set('street')} />
                            </Field>
                            <div className="form-row">
                                <Field label="Phường / Xã" error={errors.ward}>
                                    <input className="input" value={form.ward} onChange={set('ward')} />
                                </Field>
                                <Field label="Tỉnh / Thành phố" error={errors.city}>
                                    <input className="input" value={form.city} onChange={set('city')} />
                                </Field>
                            </div>
                            <Field label="Ghi chú cho shipper">
                                <input className="input" placeholder="Ví dụ: gọi trước khi tới, gửi bảo vệ" value={form.shipperNote} onChange={set('shipperNote')} />
                            </Field>
                        </fieldset>

                        <fieldset className="card form-card">
                            <legend>Thời gian giao</legend>
                            <OptionCards options={deliveryOptions} value={delivery} onChange={setDelivery} />
                            {delivery === 'later' && (
                                <select className="input slot-select" value={slot} onChange={(e) => setSlot(e.target.value)}>
                                    {timeSlots.map((t) => <option key={t}>{t}</option>)}
                                </select>
                            )}
                        </fieldset>

                        <fieldset className="card form-card">
                            <legend>Thanh toán</legend>
                            <OptionCards options={paymentOptions} value={payment} onChange={setPayment} />
                        </fieldset>
                    </div>

                    <aside className="card summary">
                        <div className="summary-head">
                            <h2>Đơn của bạn</h2>
                            <Link to="/cart" className="link-red underline">Sửa</Link>
                        </div>
                        <div className="order-lines">
                            {items.map((line) => (
                                <div className="sum-row" key={lineKey(line)}>
                                    <span>
                                        {line.quantity} × {lineInfo(line).name}
                                        {line.size && line.type === 'product' ? ` (${line.size})` : ''}
                                    </span>
                                    <span>{formatPrice(line.unitPrice * line.quantity)}</span>
                                </div>
                            ))}
                        </div>
                        <SummaryRows totals={totals} voucherCode={voucherCode} />
                        <div className="sum-total">
                            <span>Tổng cộng</span>
                            <strong>{formatPrice(totals.total)}</strong>
                        </div>
                        <label className="agree">
                            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                            <span>Tôi đồng ý với <a href="/#cua-hang" className="link-red underline">chính sách giao hàng và đổi trả</a></span>
                        </label>
                        {errors.agreed && <p className="form-error">{errors.agreed}</p>}
                        {submitError && <p className="form-error">{submitError}</p>}
                        <button type="submit" className="btn btn-red btn-block btn-lg" disabled={submitting}>
                            {submitting ? 'Đang gửi đơn...' : `Đặt hàng · ${formatPrice(totals.total)}`}
                        </button>
                        <p className="summary-note">{paymentMethods[payment].footnote}</p>
                    </aside>
                </form>
            </main>
        </div>
    );
}

export default CheckoutPage;
