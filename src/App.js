import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { StoreProvider } from './context/CartContext';
import { StoreGate } from './components/Common';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import TrackingPage from './pages/TrackingPage';
import OrdersPage from './pages/OrdersPage';
import './styles.css';

function ScrollToTop() {
    const { pathname, hash } = useLocation();
    useEffect(() => {
        if (!hash) window.scrollTo(0, 0);
    }, [pathname, hash]);
    return null;
}

function App() {
    return (
        <StoreProvider>
            <BrowserRouter>
                <ScrollToTop />
                <StoreGate>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route path="/tracking/:id" element={<TrackingPage />} />
                        <Route path="/orders" element={<OrdersPage />} />
                    </Routes>
                </StoreGate>
            </BrowserRouter>
        </StoreProvider>
    )
}

export default App;
