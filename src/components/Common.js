import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { API_URL } from '../api';
import { useStore } from '../context/CartContext';
import { formatPrice, toneOf } from '../utils';
import { BurgerIcon, CartIcon, ImageIcon } from './Icons';

const BRAND = 'Giòn Rụm';

export function Logo() {
    return (
        <Link to="/" className="logo">
            <span className="logo-mark"><BurgerIcon width={22} height={22} /></span>
            {BRAND}
        </Link>
    );
}

export function Photo({ item, label, className = '' }) {
    const [broken, setBroken] = useState(false);
    const tone = item?.tone || toneOf(item?.categorySlug);
    return (
        <div className={`photo tone-${tone} ${className}`}>
            {item?.image && !broken ? (
                <img src={item.image} alt={item.name} onError={() => setBroken(true)} />
            ) : (
                <div className="photo-placeholder">
                    <ImageIcon />
                    {label && <span>{label}</span>}
                </div>
            )}
        </div>
    );
}

export function QtyStepper({ value, onChange, size }) {
    return (
        <div className={`stepper ${size === 'lg' ? 'stepper-lg' : ''}`}>
            <button type="button" aria-label="Giảm" onClick={() => onChange(value - 1)}>–</button>
            <span>{value}</span>
            <button type="button" aria-label="Tăng" className="plus" onClick={() => onChange(value + 1)}>+</button>
        </div>
    );
}

export function StoreGate({ children }) {
    const { loading, error, reload } = useStore();
    if (error) {
        return (
            <div className="page-flow gate">
                <div className="card empty-state">
                    <h3>Chưa kết nối được dữ liệu</h3>
                    <p>{error}</p>
                    <p className="muted small">Server: {API_URL}</p>
                    <button type="button" className="btn btn-red" onClick={reload}>Thử lại</button>
                </div>
            </div>
        );
    }
    if (loading) return <div className="page-flow gate"><div className="spinner" aria-label="Đang tải" /></div>;
    return children;
}

export function SyncNotice() {
    const { syncError } = useStore();
    return syncError ? <div className="sync-notice">{syncError}</div> : null;
}

export function CartButton() {
    const { count } = useStore();
    return (
        <Link to="/cart" className="btn btn-red btn-cart">
            <CartIcon width={18} height={18} />
            Giỏ hàng
            {count > 0 && <span className="cart-count">{count}</span>}
        </Link>
    );
}

export function SiteHeader() {
    const { settings } = useStore();
    return (
        <>
            <div className="topbar">
                Miễn phí giao hàng cho đơn từ {formatPrice(settings.freeShippingThreshold)}
                <strong>Mở cửa {settings.openTime} – {settings.closeTime} mỗi ngày</strong>
            </div>
            <header className="site-header">
                <div className="container-gr header-inner">
                    <Logo />
                    <nav className="main-nav">
                        <a href="#thuc-don">Thực đơn</a>
                        <a href="#combo">Combo</a>
                        <a href="#cach-dat">Cách đặt</a>
                        <a href="#cua-hang">Cửa hàng</a>
                    </nav>
                    <div className="header-actions">
                        <a href={`tel:${settings.hotline.replace(/\s/g, '')}`} className="hotline">{settings.hotline}</a>
                        <CartButton />
                    </div>
                </div>
            </header>
            <SyncNotice />
        </>
    );
}

export function OrdersHeader() {
    return (
        <>
            <header className="site-header">
                <div className="container-gr header-inner">
                    <Logo />
                    <nav className="main-nav">
                        <Link to="/#thuc-don">Thực đơn</Link>
                        <NavLink to="/orders">Đơn hàng của tôi</NavLink>
                    </nav>
                    <div className="header-actions">
                        <CartButton />
                    </div>
                </div>
            </header>
            <SyncNotice />
        </>
    );
}

const steps = [
    { label: '1. Giỏ hàng', to: '/cart' },
    { label: '2. Thanh toán', to: '/checkout' },
    { label: '3. Theo dõi đơn' }
];

export function CheckoutHeader({ step }) {
    return (
        <>
            <header className="site-header">
                <div className="container-gr header-inner">
                    <Logo />
                    <nav className="stepper-nav">
                        {steps.map((s, i) => {
                            const active = i + 1 === step;
                            const canGo = s.to && i + 1 < step && step < 3;
                            return canGo ? (
                                <Link key={s.label} to={s.to} className="step">{s.label}</Link>
                            ) : (
                                <span key={s.label} className={`step ${active ? 'active' : ''}`}>{s.label}</span>
                            );
                        })}
                    </nav>
                    <Link to="/orders" className="header-link">Đơn hàng của tôi</Link>
                </div>
            </header>
            <SyncNotice />
        </>
    );
}

export function Footer() {
    const { settings } = useStore();
    return (
        <footer className="site-footer" id="cua-hang">
            <div className="container-gr footer-grid">
                <div>
                    <div className="footer-brand">{BRAND}</div>
                    <p>Gà rán và burger giao tận nơi.</p>
                </div>
                <div>
                    <h4>Cửa hàng</h4>
                    <p>{settings.storeName}</p>
                    <p>{settings.openTime} – {settings.closeTime}, cả tuần</p>
                </div>
                <div>
                    <h4>Liên hệ</h4>
                    <a href={`tel:${settings.hotline.replace(/\s/g, '')}`}>{settings.hotline}</a>
                </div>
                <div>
                    <h4>Chính sách</h4>
                    <a href="#cua-hang">Giao hàng &amp; đổi trả</a>
                    <a href="#cua-hang">Bảo mật thông tin</a>
                </div>
            </div>
            <div className="container-gr copyright">© 2026 {BRAND}</div>
        </footer>
    );
}
