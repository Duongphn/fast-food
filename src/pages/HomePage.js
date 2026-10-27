import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Footer, Photo, QtyStepper, SiteHeader } from '../components/Common';
import { CardIcon, ClockIcon, FlameIcon, ImageIcon } from '../components/Icons';
import { useStore } from '../context/CartContext';
import { formatPrice } from '../utils';

const features = [
    { icon: ClockIcon, title: 'Giao trong 30 phút', text: 'Trễ hơn, tặng nước miễn phí' },
    { icon: FlameIcon, title: 'Chiên khi có đơn', text: 'Không chiên sẵn để chờ' },
    { icon: CardIcon, title: 'Trả tiền mặt hoặc chuyển khoản', text: 'Thanh toán khi nhận hàng' }
];

const howTo = [
    { title: 'Chọn món', text: 'Thêm món lẻ hoặc combo vào giỏ. Có thể ghi chú ít cay, không hành.' },
    { title: 'Nhập địa chỉ', text: 'Điền số điện thoại và địa chỉ. Bếp gọi xác nhận trong vòng 2 phút.' },
    { title: 'Nhận hàng, trả tiền', text: 'Trả tiền mặt hoặc quét mã chuyển khoản khi shipper tới.' }
];

function ProductCard({ product }) {
    const { productQty, addProduct, setProductQty, categoryById } = useStore();
    const qty = productQty(product);
    const item = { ...product, categorySlug: categoryById[product.categoryId]?.slug };
    const badge = !product.isAvailable ? 'Hết hàng' : product.isFeatured ? 'Bán chạy' : product.salePrice ? 'Giảm giá' : '';
    return (
        <article className={`product-card ${product.isAvailable ? '' : 'is-disabled'}`}>
            <Photo item={item} label={`Ảnh: ${product.name}`} className="product-photo" />
            {badge && <span className="badge-dark product-badge">{badge}</span>}
            <div className="product-body">
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <div className="product-foot">
                    <span className="price-group">
                        <span className="price">{formatPrice(product.salePrice ?? product.price)}</span>
                        {product.salePrice && <del>{formatPrice(product.price)}</del>}
                    </span>
                    {!product.isAvailable ? (
                        <button type="button" className="btn btn-red btn-sm" disabled>Hết hàng</button>
                    ) : qty > 0 ? (
                        <QtyStepper value={qty} onChange={(v) => setProductQty(product, v)} />
                    ) : (
                        <button type="button" className="btn btn-red btn-sm" onClick={() => addProduct(product)}>Thêm</button>
                    )}
                </div>
            </div>
        </article>
    );
}

function AddressCheck() {
    const [address, setAddress] = useState('');
    const [result, setResult] = useState('');
    const check = (e) => {
        e.preventDefault();
        setResult(address.trim() ? 'Địa chỉ này nằm trong khu vực giao hàng.' : 'Bạn nhập địa chỉ trước nhé.');
    };
    return (
        <form className="address-check" onSubmit={check}>
            <div className="address-box">
                <input
                    placeholder="Nhập địa chỉ để kiểm tra khu vực giao"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                />
                <button type="submit" className="btn btn-dark btn-sm">Kiểm tra</button>
            </div>
            {result && <p className="address-result">{result}</p>}
        </form>
    );
}

function HomePage() {
    const { categories, products, combos, count, totals, clearCart, addCombo } = useStore();
    const [category, setCategory] = useState('');
    const { hash } = useLocation();

    useEffect(() => {
        if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    }, [hash]);

    const shown = category ? products.filter((p) => p.categoryId === category) : products;

    return (
        <div className="page-home">
            <SiteHeader />

            <section className="hero">
                <div className="container-gr hero-inner">
                    <div className="hero-copy">
                        <span className="badge-yellow">Giao trong 30 phút</span>
                        <h1>Gà giòn, burger nóng, tới cửa nhà bạn.</h1>
                        <p>Chiên khi có đơn, đóng hộp giữ nhiệt, shipper nhận ngay tại bếp. Chọn món bên dưới rồi thanh toán khi nhận hàng.</p>
                        <div className="hero-actions">
                            <a href="#thuc-don" className="btn btn-yellow btn-lg">Xem thực đơn</a>
                            <a href="#combo" className="btn btn-outline-light btn-lg">Combo tiết kiệm</a>
                        </div>
                        <AddressCheck />
                    </div>
                    <div className="hero-art">
                        <div className="hero-circle has-image">
                            <img
                                src="/images/hero.png"
                                alt="Burger, gà rán và khoai chiên Giòn Rụm"
                                className="hero-img"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement?.classList.remove('has-image');
                                }}
                            />
                            <div className="hero-circle-fallback">
                                <ImageIcon width={40} height={40} />
                                <strong>Ảnh hero</strong>
                                <span>Burger + gà rán + khoai, chụp từ trên xuống, nền trong</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="features">
                <div className="container-gr features-grid">
                    {features.map(({ icon: Icon, title, text }) => (
                        <div className="feature" key={title}>
                            <span className="feature-icon"><Icon /></span>
                            <div>
                                <strong>{title}</strong>
                                <span>{text}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="section" id="thuc-don">
                <div className="container-gr">
                    <div className="section-head">
                        <div>
                            <h2>Thực đơn</h2>
                            <p className="section-sub">Bấm “Thêm” để cho món vào giỏ.</p>
                        </div>
                        <div className="pills">
                            <button type="button" className={`pill ${!category ? 'active' : ''}`} onClick={() => setCategory('')}>Tất cả</button>
                            {categories.map((c) => (
                                <button
                                    type="button"
                                    key={c.id}
                                    className={`pill ${category === c.id ? 'active' : ''}`}
                                    onClick={() => setCategory(c.id)}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    {shown.length === 0 ? (
                        <p className="section-sub">Danh mục này chưa có món.</p>
                    ) : (
                        <div className="product-grid">
                            {shown.map((p) => <ProductCard key={p.id} product={p} />)}
                        </div>
                    )}
                </div>
            </section>

            <section className="combo-section" id="combo">
                <div className="container-gr">
                    <h2>Combo ăn chung</h2>
                    <p className="section-sub">Rẻ hơn gọi lẻ, đủ cho cả nhóm.</p>
                    <div className="combo-grid">
                        {combos.map((c) => (
                            <article className="combo-card" key={c.id}>
                                <div className="combo-top">
                                    <span className="combo-people">Combo</span>
                                    {c.originalPrice > c.price && (
                                        <span className="badge-dark">Tiết kiệm {formatPrice(c.originalPrice - c.price)}</span>
                                    )}
                                </div>
                                <h3>{c.name}</h3>
                                <p>{c.description}</p>
                                <div className="combo-foot">
                                    <span className="combo-price">{formatPrice(c.price)}</span>
                                    <button
                                        type="button"
                                        className="btn btn-dark btn-sm"
                                        disabled={!c.isAvailable}
                                        onClick={() => addCombo(c)}
                                    >
                                        {c.isAvailable ? 'Đặt combo' : 'Tạm hết'}
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section" id="cach-dat">
                <div className="container-gr">
                    <h2>Đặt món trong 3 bước</h2>
                    <div className="steps-grid">
                        {howTo.map((s, i) => (
                            <div className="how-step" key={s.title}>
                                <span className="how-num">{i + 1}</span>
                                <h3>{s.title}</h3>
                                <p>{s.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {count > 0 && (
                <div className="cart-bar">
                    <div className="container-gr cart-bar-inner">
                        <div>
                            <span>Giỏ hàng có {count} món</span>
                            <strong>{formatPrice(totals.subtotal)}</strong>
                        </div>
                        <div className="cart-bar-actions">
                            <button type="button" className="btn btn-ghost-light" onClick={clearCart}>Xóa giỏ</button>
                            <Link to="/cart" className="btn btn-yellow">Xem giỏ hàng</Link>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}

export default HomePage;
