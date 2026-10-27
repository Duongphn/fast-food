import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { CURRENT_USER_ID } from '../api';
import { OrdersHeader } from '../components/Common';
import { useStore } from '../context/CartContext';
import { ACTIVE_STATUSES, formatDate, formatPrice, statusLabels } from '../utils';

const filters = [
    { id: 'all', name: 'Tất cả' },
    { id: 'active', name: 'Đang giao' },
    { id: 'delivered', name: 'Đã giao' },
    { id: 'cancelled', name: 'Đã hủy' }
];

const groupOf = (status) => (ACTIVE_STATUSES.includes(status) ? 'active' : status);

function OrdersPage() {
    const { addLines, makeLine, productById, comboById } = useStore();
    const [orders, setOrders] = useState(null);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [filter, setFilter] = useState('all');
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/orders', { params: { userId: CURRENT_USER_ID, _sort: 'createdAt', _order: 'desc' } })
            .then(({ data }) => setOrders(data))
            .catch(() => setError('Không tải được danh sách đơn hàng.'));
    }, []);

    const reorder = (order) => {
        const lines = order.items
            .filter((item) =>
                item.type === 'combo' ? comboById[item.comboId]?.isAvailable : productById[item.productId]?.isAvailable
            )
            .map((item) =>
                makeLine(
                    item.type === 'combo'
                        ? { type: 'combo', comboId: item.comboId }
                        : { type: 'product', productId: item.productId, size: item.size, toppingIds: (item.toppings || []).map((t) => t.toppingId) },
                    item.quantity
                )
            );
        if (lines.length === 0) {
            setNotice('Các món trong đơn này hiện đã ngừng bán.');
            return;
        }
        addLines(lines);
        navigate('/cart');
    };

    const shown = (orders || []).filter((o) => filter === 'all' || groupOf(o.status) === filter);

    return (
        <div className="page-flow">
            <OrdersHeader />
            <main className="container-gr container-narrow flow-main">
                <div className="orders-head">
                    <h1 className="page-title">Đơn hàng của tôi</h1>
                    <div className="pills">
                        {filters.map((f) => (
                            <button
                                type="button"
                                key={f.id}
                                className={`pill ${filter === f.id ? 'active' : ''}`}
                                onClick={() => setFilter(f.id)}
                            >
                                {f.name}
                            </button>
                        ))}
                    </div>
                </div>

                {notice && <p className="form-error notice">{notice}</p>}
                {error && <div className="card empty-state"><p>{error}</p></div>}
                {!orders && !error && <div className="spinner" aria-label="Đang tải" />}
                {orders && shown.length === 0 && <div className="card empty-state"><p>Chưa có đơn nào ở mục này.</p></div>}

                {shown.map((order) => {
                    const group = groupOf(order.status);
                    return (
                        <article className="card order-card" key={order.id}>
                            <div className="order-top">
                                <div>
                                    <strong className="order-code">#{order.orderCode}</strong>
                                    <span className="order-date">{formatDate(order.createdAt)}</span>
                                </div>
                                <span className={`status status-${group}`}>{statusLabels[order.status] || order.status}</span>
                            </div>
                            <p className="order-items">
                                {order.items.map((i) => `${i.quantity} × ${i.name}`).join(', ')}
                            </p>
                            <div className="order-foot">
                                <span className="order-total">Tổng: <strong>{formatPrice(order.totalAmount)}</strong></span>
                                <div className="order-actions">
                                    <Link to={`/tracking/${order.id}`} className="btn btn-outline">
                                        {group === 'active' ? 'Theo dõi đơn' : 'Xem chi tiết'}
                                    </Link>
                                    <button type="button" className="btn btn-red" onClick={() => reorder(order)}>Đặt lại</button>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </main>
        </div>
    );
}

export default OrdersPage;
