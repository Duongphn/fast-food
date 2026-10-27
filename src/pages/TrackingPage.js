import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';
import { CheckoutHeader } from '../components/Common';
import { PinIcon, UserIcon } from '../components/Icons';
import { useStore } from '../context/CartContext';
import { STEPS, addMinutes, formatPrice, formatTime, paymentMethods, stageOf } from '../utils';

const headlines = {
    pending: { title: 'Đang chờ xác nhận', text: 'Cửa hàng sẽ gọi xác nhận trong vòng 2 phút, bạn để ý điện thoại nhé.' },
    confirmed: { title: 'Đơn đã được nhận', text: 'Cửa hàng đã xác nhận, bếp sắp bắt đầu làm món.' },
    preparing: { title: 'Bếp đang chuẩn bị', text: 'Món của bạn đang được chiên nóng.' },
    delivering: { title: 'Đơn đang trên đường tới', text: 'Bạn để ý điện thoại, shipper sẽ gọi khi tới nơi.' },
    delivered: { title: 'Đơn đã giao xong', text: 'Cảm ơn bạn đã đặt món ở Giòn Rụm.' },
    cancelled: { title: 'Đơn đã bị hủy', text: 'Bạn có thể đặt lại đơn này bất cứ lúc nào.' }
};

const stepTime = (order, step) => order.statusHistory?.find((h) => step.statuses.includes(h.status))?.at;

function TrackingPage() {
    const { id } = useParams();
    const { settings } = useStore();
    const [order, setOrder] = useState(null);
    const [shipper, setShipper] = useState(null);
    const [error, setError] = useState('');
    const [cancelling, setCancelling] = useState(false);

    const fetchOrder = useCallback(
        () =>
            api.get(`/orders/${id}`)
                .then(({ data }) => {
                    setOrder(data);
                    setError('');
                })
                .catch((err) => setError(err.response?.status === 404 ? 'notfound' : 'network')),
        [id]
    );

    useEffect(() => {
        fetchOrder();
        const timer = setInterval(fetchOrder, 10000);
        return () => clearInterval(timer);
    }, [fetchOrder]);

    const shipperId = order?.shipperId;
    useEffect(() => {
        if (!shipperId) {
            setShipper(null);
            return;
        }
        api.get(`/users/${shipperId}`).then(({ data }) => setShipper(data)).catch(() => setShipper(null));
    }, [shipperId]);

    const cancelOrder = async () => {
        setCancelling(true);
        const now = new Date().toISOString();
        try {
            const { data } = await api.patch(`/orders/${order.id}`, {
                status: 'cancelled',
                statusHistory: [...(order.statusHistory || []), { status: 'cancelled', at: now }],
                updatedAt: now
            });
            setOrder(data);
        } finally {
            setCancelling(false);
        }
    };

    if (error === 'notfound' || (!order && error)) {
        return (
            <div className="page-flow">
                <CheckoutHeader step={3} />
                <main className="container-gr flow-main">
                    <div className="card empty-state">
                        <h3>{error === 'notfound' ? 'Không tìm thấy đơn hàng này' : 'Không tải được đơn hàng'}</h3>
                        <Link to="/orders" className="btn btn-red">Xem đơn hàng của tôi</Link>
                    </div>
                </main>
            </div>
        );
    }

    if (!order) return <div className="page-flow gate"><div className="spinner" aria-label="Đang tải" /></div>;

    const stage = stageOf(order.status);
    const cancelled = order.status === 'cancelled';
    const headline = headlines[order.status] || headlines.pending;
    const deliveredAt = stepTime(order, STEPS[3]);
    const eta = order.deliveryTime && order.deliveryTime !== 'now'
        ? order.deliveryTime.split(' – ')[1]
        : formatTime(addMinutes(order.createdAt, 30));

    return (
        <div className="page-flow">
            <CheckoutHeader step={3} />
            <main className="container-gr flow-main">
                <section className={`track-banner ${cancelled ? 'is-cancelled' : ''}`}>
                    <div>
                        <span className="badge-yellow">Mã đơn #{order.orderCode}</span>
                        <h1>{headline.title}</h1>
                        <p>{headline.text}</p>
                    </div>
                    {!cancelled && (
                        <div className="eta-box">
                            <span>{deliveredAt ? 'Đã giao lúc' : 'Dự kiến tới lúc'}</span>
                            <strong>{deliveredAt ? formatTime(deliveredAt) : eta}</strong>
                        </div>
                    )}
                </section>

                <div className="track-grid">
                    <div className="flow-left">
                        <div className="card timeline">
                            {STEPS.map((s, i) => {
                                const at = stepTime(order, s);
                                const state = cancelled
                                    ? (at ? 'done' : 'todo')
                                    : i < stage || (i === stage && i === STEPS.length - 1) ? 'done' : i === stage ? 'current' : 'todo';
                                const detail = i === 0
                                    ? (order.status === 'pending' ? 'Đang chờ cửa hàng xác nhận' : 'Cửa hàng đã xác nhận đơn')
                                    : s.detail;
                                return (
                                    <div className={`tl-step ${state}`} key={s.title}>
                                        <span className="tl-dot">{state === 'done' ? '✓' : i + 1}</span>
                                        <div>
                                            <strong>{s.title}</strong>
                                            <span>{state === 'todo' ? 'Chưa tới bước này' : `${at ? formatTime(at) + ' · ' : ''}${detail}`}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="map-box">
                            <PinIcon width={30} height={30} />
                            <strong>Bản đồ vị trí shipper</strong>
                            <span>Hiện khi đơn chuyển sang bước “Đang giao”</span>
                        </div>
                    </div>

                    <aside className="flow-right">
                        <div className="card card-pad">
                            <h2 className="card-title">Shipper</h2>
                            <div className="shipper">
                                <span className="shipper-avatar"><UserIcon /></span>
                                <div>
                                    <strong>{shipper ? shipper.fullName : 'Đang tìm shipper'}</strong>
                                    <span>{shipper ? `SĐT ${shipper.phone}` : 'Sẽ có khi bếp làm xong món'}</span>
                                </div>
                            </div>
                            {shipper && <a href={`tel:${shipper.phone}`} className="btn btn-dark btn-block">Gọi shipper</a>}
                            <a href={`tel:${settings.hotline.replace(/\s/g, '')}`} className="btn btn-outline btn-block">Gọi cửa hàng</a>
                        </div>

                        <div className="card card-pad">
                            <h2 className="card-title">Chi tiết đơn</h2>
                            {order.items.map((item, i) => (
                                <div className="sum-row" key={i}>
                                    <span>{item.quantity} × {item.name}{item.size && item.type === 'product' ? ` (${item.size})` : ''}</span>
                                    <strong>{formatPrice(item.subtotal)}</strong>
                                </div>
                            ))}
                            {order.shippingFee > 0 && (
                                <div className="sum-row"><span>Phí giao hàng</span><strong>{formatPrice(order.shippingFee)}</strong></div>
                            )}
                            {order.discount > 0 && (
                                <div className="sum-row">
                                    <span>Giảm giá{order.voucherCode ? ` (${order.voucherCode})` : ''}</span>
                                    <strong className="text-green">-{formatPrice(order.discount)}</strong>
                                </div>
                            )}
                            <div className="sum-row sum-row-total">
                                <strong>Tổng · {paymentMethods[order.paymentMethod]?.name || order.paymentMethod}</strong>
                                <strong className="text-red">{formatPrice(order.totalAmount)}</strong>
                            </div>
                            <p className="muted">Giao tới: {order.shippingAddress?.fullAddress}</p>
                            {order.status === 'pending' ? (
                                <button type="button" className="btn btn-outline btn-block cancel-btn" disabled={cancelling} onClick={cancelOrder}>
                                    {cancelling ? 'Đang hủy...' : 'Hủy đơn'}
                                </button>
                            ) : !cancelled && order.status !== 'delivered' && (
                                <p className="muted small">Bếp đã nhận đơn nên không hủy được nữa. Cần đổi gì, bạn gọi cửa hàng nhé.</p>
                            )}
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}

export default TrackingPage;
