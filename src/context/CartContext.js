import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api, { CURRENT_USER_ID } from '../api';
import { lineKey, voucherDiscount, voucherError } from '../utils';

const StoreContext = createContext(null);

const byId = (list) => Object.fromEntries(list.map((item) => [item.id, item]));

export function StoreProvider({ children }) {
    const [catalog, setCatalog] = useState(null);
    const [items, setItems] = useState([]);
    const [voucherCode, setVoucherCode] = useState('');
    const [kitchenNote, setKitchenNote] = useState('');
    const [error, setError] = useState('');
    const [syncError, setSyncError] = useState('');

    const itemsRef = useRef([]);
    const cartIdRef = useRef(null);
    const queueRef = useRef(Promise.resolve());

    const load = useCallback(() => {
        setError('');
        Promise.all([
            api.get('/categories', { params: { isActive: true, _sort: 'sortOrder' } }),
            api.get('/products'),
            api.get('/combos'),
            api.get('/toppings'),
            api.get('/vouchers'),
            api.get('/settings'),
            api.get('/carts', { params: { userId: CURRENT_USER_ID } })
        ])
            .then(([cat, prod, combo, top, vou, set, cart]) => {
                setCatalog({
                    categories: cat.data,
                    products: prod.data,
                    combos: combo.data,
                    toppings: top.data,
                    vouchers: vou.data,
                    settings: set.data
                });
                const existing = cart.data[0];
                cartIdRef.current = existing?.id || null;
                itemsRef.current = existing?.items || [];
                setItems(itemsRef.current);
            })
            .catch(() => setError('Không kết nối được json-server. Hãy chạy "npm run server" rồi tải lại trang.'));
    }, []);

    useEffect(load, [load]);

    const value = useMemo(() => {
        if (!catalog) return { loading: !error, error, reload: load };

        const products = byId(catalog.products);
        const combos = byId(catalog.combos);
        const toppings = byId(catalog.toppings);
        const categories = byId(catalog.categories);
        const { settings } = catalog;

        const persist = (next) => {
            queueRef.current = queueRef.current
                .then(async () => {
                    const body = { userId: CURRENT_USER_ID, items: next, updatedAt: new Date().toISOString() };
                    if (cartIdRef.current) await api.patch(`/carts/${cartIdRef.current}`, body);
                    else cartIdRef.current = (await api.post('/carts', body)).data.id;
                    setSyncError('');
                })
                .catch(() => setSyncError('Không lưu được giỏ hàng lên server.'));
        };

        const commit = (next) => {
            itemsRef.current = next;
            setItems(next);
            persist(next);
        };

        const productUnitPrice = (product, sizeName, toppingIds = []) => {
            const size = product.sizes?.find((s) => s.name === sizeName);
            const extras = toppingIds.reduce((sum, id) => sum + (toppings[id]?.price || 0), 0);
            return (product.salePrice ?? product.price) + (size?.extraPrice || 0) + extras;
        };

        const makeLine = (source, quantity = 1) => {
            if (source.type === 'combo') {
                const combo = combos[source.comboId];
                return { type: 'combo', comboId: combo.id, quantity, unitPrice: combo.price, note: '' };
            }
            const product = products[source.productId];
            const size = source.size ?? product.sizes?.[0]?.name ?? null;
            const toppingIds = source.toppingIds || [];
            return { type: 'product', productId: product.id, size, toppingIds, quantity, unitPrice: productUnitPrice(product, size, toppingIds), note: '' };
        };

        const addLines = (lines) => {
            const next = itemsRef.current.map((i) => ({ ...i }));
            lines.forEach((line) => {
                const found = next.find((i) => lineKey(i) === lineKey(line));
                if (found) found.quantity += line.quantity;
                else next.push(line);
            });
            commit(next);
        };

        const setLineQty = (key, quantity) =>
            commit(
                quantity <= 0
                    ? itemsRef.current.filter((i) => lineKey(i) !== key)
                    : itemsRef.current.map((i) => (lineKey(i) === key ? { ...i, quantity } : i))
            );

        const changeLineSize = (key, size) => {
            const line = itemsRef.current.find((i) => lineKey(i) === key);
            const replaced = makeLine({ ...line, size }, line.quantity);
            const twin = itemsRef.current.find((i) => lineKey(i) === lineKey(replaced));
            commit(
                twin
                    ? itemsRef.current
                        .filter((i) => i !== line)
                        .map((i) => (i === twin ? { ...i, quantity: i.quantity + line.quantity } : i))
                    : itemsRef.current.map((i) => (i === line ? replaced : i))
            );
        };

        const defaultLine = (product) => makeLine({ type: 'product', productId: product.id });

        const lineInfo = (line) => {
            if (line.type === 'combo') {
                const combo = combos[line.comboId];
                return { name: combo?.name || 'Combo', item: { ...combo, tone: 'cream' }, option: 'Combo' };
            }
            const product = products[line.productId];
            const category = categories[product?.categoryId];
            const option = (line.toppingIds || []).map((id) => toppings[id]?.name).filter(Boolean).join(' · ');
            return { name: product?.name || 'Món đã ngừng bán', item: product && { ...product, categorySlug: category?.slug }, option, product };
        };

        const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
        const shipping = subtotal === 0 || subtotal >= settings.freeShippingThreshold ? 0 : settings.baseShippingFee;
        const voucher = catalog.vouchers.find((v) => v.code === voucherCode);
        const discount = voucherDiscount(voucher, subtotal, shipping);
        const totals = { subtotal, shipping, discount, total: subtotal + shipping - discount };

        const applyVoucher = (code) => {
            const normalized = code.trim().toUpperCase();
            if (!normalized) {
                setVoucherCode('');
                return '';
            }
            const message = voucherError(catalog.vouchers.find((v) => v.code === normalized), subtotal);
            if (!message) setVoucherCode(normalized);
            return message;
        };

        const placeOrder = async ({ receiverName, phone, fullAddress, shipperNote, deliveryTime, paymentMethod }) => {
            const now = new Date();
            const { data: allOrders } = await api.get('/orders');
            const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
            const order = {
                orderCode: `FF${ymd}${String(allOrders.length + 1).padStart(3, '0')}`,
                userId: CURRENT_USER_ID,
                shipperId: null,
                shippingAddress: { receiverName, phone, fullAddress, note: shipperNote },
                items: items.map((line) => {
                    const info = lineInfo(line);
                    const base = line.type === 'combo' ? { type: 'combo', comboId: line.comboId } : { type: 'product', productId: line.productId };
                    return {
                        ...base,
                        name: info.name,
                        size: line.size || null,
                        toppings: (line.toppingIds || []).map((id) => ({ toppingId: id, name: toppings[id]?.name, price: toppings[id]?.price })),
                        quantity: line.quantity,
                        unitPrice: line.unitPrice,
                        subtotal: line.unitPrice * line.quantity
                    };
                }),
                itemsTotal: subtotal,
                shippingFee: shipping,
                voucherCode: discount ? voucherCode : null,
                discount,
                totalAmount: totals.total,
                paymentMethod,
                paymentStatus: 'unpaid',
                status: 'pending',
                note: kitchenNote.trim(),
                deliveryTime,
                statusHistory: [{ status: 'pending', at: now.toISOString() }],
                createdAt: now.toISOString(),
                updatedAt: now.toISOString()
            };
            const { data: created } = await api.post('/orders', order);
            if (discount && voucher) {
                await api.patch(`/vouchers/${voucher.id}`, { usedCount: voucher.usedCount + 1 });
                setCatalog((prev) => ({
                    ...prev,
                    vouchers: prev.vouchers.map((v) => (v.id === voucher.id ? { ...v, usedCount: v.usedCount + 1 } : v))
                }));
            }
            commit([]);
            setVoucherCode('');
            setKitchenNote('');
            return created;
        };

        return {
            loading: false,
            error,
            syncError,
            ...catalog,
            productById: products,
            comboById: combos,
            categoryById: categories,
            items,
            count: items.reduce((sum, i) => sum + i.quantity, 0),
            totals,
            lineInfo,
            makeLine,
            addLines,
            addProduct: (product) => addLines([defaultLine(product)]),
            addCombo: (combo) => addLines([makeLine({ type: 'combo', comboId: combo.id })]),
            productQty: (product) => items.find((i) => lineKey(i) === lineKey(defaultLine(product)))?.quantity || 0,
            setProductQty: (product, quantity) => {
                const key = lineKey(defaultLine(product));
                if (itemsRef.current.some((i) => lineKey(i) === key)) setLineQty(key, quantity);
                else if (quantity > 0) addLines([defaultLine(product)]);
            },
            setLineQty,
            changeLineSize,
            removeLine: (key) => setLineQty(key, 0),
            clearCart: () => commit([]),
            voucherCode,
            applyVoucher,
            kitchenNote,
            setKitchenNote,
            placeOrder
        };
    }, [catalog, items, voucherCode, kitchenNote, error, syncError, load]);

    return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
