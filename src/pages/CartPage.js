import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckoutHeader, Photo, QtyStepper } from '../components/Common';
import { useStore } from '../context/CartContext';
import { formatPrice, lineKey } from '../utils';

export function SummaryRows({ totals, voucherCode }) {
    return (
        <>
            <div className="sum-row"><span>Tạm tính</span><span>{formatPrice(totals.subtotal)}</span></div>
            <div className="sum-row">
                <span>Phí giao hàng</span>
                <strong>{totals.shipping ? formatPrice(totals.shipping) : 'Miễn phí'}</strong>
            </div>
            <div className="sum-row">
                <span>Giảm giá{voucherCode && totals.discount > 0 ? ` (${voucherCode})` : ''}</span>
                <strong className="text-green">{totals.discount ? '-' + formatPrice(totals.discount) : '0đ'}</strong>
            </div>
        </>
    );
}

function CartPage() {
    const {
        items, count, totals, lineInfo, setLineQty, changeLineSize, removeLine, addProduct,
        products, categoryById, voucherCode, applyVoucher, kitchenNote, setKitchenNote, settings
    } = useStore();
    const [code, setCode] = useState(voucherCode);
    const [codeError, setCodeError] = useState('');
    const navigate = useNavigate();

    const submitCode = (e) => {
        e.preventDefault();
        setCodeError(applyVoucher(code));
    };

    const sideSlugs = ['mon-an-kem', 'do-uong', 'trang-mieng'];
    const extras = products
        .filter((p) => p.isAvailable && sideSlugs.includes(categoryById[p.categoryId]?.slug))
        .filter((p) => !items.some((i) => i.productId === p.id))
        .slice(0, 3);

    const missingForFreeShip = settings.freeShippingThreshold - totals.subtotal;

    return (
        <div className="page-flow">
            <CheckoutHeader step={1} />
            <main className="container-gr flow-main">
                <Link to="/" className="back-link">← Tiếp tục chọn món</Link>
                <h1 className="page-title">Giỏ hàng <small>({count} món)</small></h1>

                {items.length === 0 ? (
                    <div className="card empty-state">
                        <h3>Giỏ hàng đang trống</h3>
                        <p>Chọn vài món ngon rồi quay lại đây nhé.</p>
                        <Link to="/#thuc-don" className="btn btn-red">Xem thực đơn</Link>
                    </div>
                ) : (
                    <div className="flow-grid">
                        <div className="flow-left">
                            <div className="card cart-list">
                                {items.map((line) => {
                                    const key = lineKey(line);
                                    const { name, item, option, product } = lineInfo(line);
                                    return (
                                        <div className="cart-item" key={key}>
                                            <Photo item={item} className="cart-thumb" />
                                            <div className="cart-info">
                                                <h3>{name}</h3>
                                                {product?.sizes?.length > 1 ? (
                                                    <select
                                                        className="size-select"
                                                        aria-label="Chọn size"
                                                        value={line.size || ''}
                                                        onChange={(e) => changeLineSize(key, e.target.value)}
                                                    >
                                                        {product.sizes.map((s) => (
                                                            <option key={s.name} value={s.name}>
                                                                {s.name}{s.extraPrice ? ` (+${formatPrice(s.extraPrice)})` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : line.size && <span>{line.size}</span>}
                                                {option && <span>{option}</span>}
                                                <span>{formatPrice(line.unitPrice)} / phần</span>
                                            </div>
                                            <QtyStepper size="lg" value={line.quantity} onChange={(v) => setLineQty(key, v)} />
                                            <div className="cart-line-total">
                                                <strong>{formatPrice(line.unitPrice * line.quantity)}</strong>
                                                <button type="button" className="link-red" onClick={() => removeLine(key)}>Xóa</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="card card-pad">
                                <label className="field-title" htmlFor="kitchen-note">Ghi chú cho bếp</label>
                                <textarea
                                    id="kitchen-note"
                                    className="input"
                                    rows={3}
                                    placeholder="Ví dụ: burger không hành, gà ít cay"
                                    value={kitchenNote}
                                    onChange={(e) => setKitchenNote(e.target.value)}
                                />
                            </div>

                            {extras.length > 0 && (
                                <>
                                    <h2 className="sub-title">Gọi thêm món ăn kèm?</h2>
                                    <div className="extras-grid">
                                        {extras.map((p) => (
                                            <div className="card extra-card" key={p.id}>
                                                <h3>{p.name}</h3>
                                                <div className="extra-foot">
                                                    <span className="price">{formatPrice(p.salePrice ?? p.price)}</span>
                                                    <button type="button" className="btn btn-dark btn-sm" onClick={() => addProduct(p)}>Thêm</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <aside className="card summary">
                            <h2>Tóm tắt đơn</h2>
                            <form className="voucher-form" onSubmit={submitCode}>
                                <input className="input" placeholder="Mã giảm giá" value={code} onChange={(e) => setCode(e.target.value)} />
                                <button type="submit" className="btn btn-dark">Áp dụng</button>
                            </form>
                            {codeError && <p className="form-error">{codeError}</p>}
                            <SummaryRows totals={totals} voucherCode={voucherCode} />
                            {totals.shipping > 0 && missingForFreeShip > 0 && (
                                <p className="hint">Mua thêm {formatPrice(missingForFreeShip)} để được miễn phí giao hàng.</p>
                            )}
                            <div className="sum-total">
                                <span>Tổng cộng</span>
                                <strong>{formatPrice(totals.total)}</strong>
                            </div>
                            <button type="button" className="btn btn-red btn-block btn-lg" onClick={() => navigate('/checkout')}>
                                Tiến hành đặt hàng
                            </button>
                            <p className="summary-note">Thanh toán khi nhận hàng hoặc chuyển khoản</p>
                        </aside>
                    </div>
                )}
            </main>
        </div>
    );
}

export default CartPage;
