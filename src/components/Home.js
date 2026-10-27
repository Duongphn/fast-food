import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Spinner, Alert, Form, Button } from 'react-bootstrap';

const API = 'http://localhost:9999';

const formatPrice = (value) => value.toLocaleString('vi-VN') + 'đ';

function Home() {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [combos, setCombos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [searchParams, setSearchParams] = useSearchParams();
    const search = searchParams.get('q') || '';
    const categorySlug = searchParams.get('category') || '';
    const onSaleOnly = searchParams.get('sale') === '1';

    const updateParam = (key, value) => {
        const next = new URLSearchParams(searchParams);
        if (value) next.set(key, value);
        else next.delete(key);
        setSearchParams(next, { replace: key === 'q' });
    };

    const setSearch = (value) => updateParam('q', value);
    const setCategorySlug = (value) => updateParam('category', value);
    const setOnSaleOnly = (checked) => updateParam('sale', checked ? '1' : '');

    useEffect(() => {
        Promise.all([
            axios.get(`${API}/categories`),
            axios.get(`${API}/products`),
            axios.get(`${API}/combos`)
        ])
            .then(([catRes, prodRes, comboRes]) => {
                setCategories(catRes.data);
                setProducts(prodRes.data);
                setCombos(comboRes.data);
            })
            .catch(() => setError('Không tải được dữ liệu. Hãy chạy "npm run server" trước.'))
            .finally(() => setLoading(false));
    }, []);

    const categoryId = categories.find((c) => c.slug === categorySlug)?.id || '';
    const getCategoryName = (id) => categories.find((c) => c.id === id)?.name || '';
    const getProduct = (id) => products.find((p) => p.id === id);
    const matchesSearch = (text) => text.toLowerCase().includes(search.trim().toLowerCase());

    const filteredProducts = products.filter((p) =>
        matchesSearch(p.name) &&
        (!categoryId || p.categoryId === categoryId) &&
        (!onSaleOnly || p.salePrice)
    );

    const filteredCombos = combos.filter((c) =>
        matchesSearch(c.name) &&
        (!categoryId || c.items.some((i) => getProduct(i.productId)?.categoryId === categoryId)) &&
        (!onSaleOnly || c.price < c.originalPrice)
    );

    const resetFilters = () => {
        setSearchParams({});
    };

    if (loading) {
        return (
            <Container className="text-center my-5">
                <Spinner animation="border" />
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="my-5">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container className="my-4">
            <Row className="g-2 mb-3 align-items-center">
                <Col md={5}>
                    <Form.Control
                        placeholder="Tìm món hoặc combo..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </Col>
                <Col md={3}>
                    <Form.Select value={categoryId ? categorySlug : ''} onChange={(e) => setCategorySlug(e.target.value)}>
                        <option value="">Tất cả danh mục</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.slug}>{c.name}</option>
                        ))}
                    </Form.Select>
                </Col>
                <Col md={2}>
                    <Form.Check
                        type="checkbox"
                        id="onSaleOnly"
                        label="Đang giảm giá"
                        checked={onSaleOnly}
                        onChange={(e) => setOnSaleOnly(e.target.checked)}
                    />
                </Col>
                <Col md={2}>
                    <Button variant="outline-secondary" className="w-100" onClick={resetFilters}>
                        Xóa bộ lọc
                    </Button>
                </Col>
            </Row>

            <div className="d-flex flex-wrap gap-2 mb-4">
                {categories.map((c) => (
                    <Badge
                        key={c.id}
                        bg={c.id === categoryId ? 'primary' : 'secondary'}
                        className="fs-6"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setCategorySlug(c.id === categoryId ? '' : c.slug)}
                    >
                        {c.name}
                    </Badge>
                ))}
            </div>

            <h2 className="mb-3">Combo</h2>
            {filteredCombos.length === 0 ? (
                <p className="text-muted">Không có combo phù hợp.</p>
            ) : (
                <Row xs={1} sm={2} md={3} className="g-4 mb-4">
                    {filteredCombos.map((c) => (
                        <Col key={c.id}>
                            <Card className="h-100 border-warning">
                                <Card.Body>
                                    <Card.Title>{c.name}</Card.Title>
                                    <Card.Text>{c.description}</Card.Text>
                                    <ul className="mb-0">
                                        {c.items.map((i) => (
                                            <li key={i.productId}>
                                                {i.quantity} x {getProduct(i.productId)?.name} ({i.size})
                                            </li>
                                        ))}
                                    </ul>
                                </Card.Body>
                                <Card.Footer>
                                    <strong className="text-danger me-2">{formatPrice(c.price)}</strong>
                                    {c.price < c.originalPrice && (
                                        <del className="text-muted">{formatPrice(c.originalPrice)}</del>
                                    )}
                                </Card.Footer>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            <h2 className="mb-3">Sản phẩm</h2>
            {filteredProducts.length === 0 ? (
                <p className="text-muted">Không có sản phẩm phù hợp.</p>
            ) : (
                <Row xs={1} sm={2} md={3} className="g-4">
                    {filteredProducts.map((p) => (
                        <Col key={p.id}>
                            <Card className="h-100">
                                <Card.Body>
                                    <Card.Title>{p.name}</Card.Title>
                                    <Card.Subtitle className="mb-2 text-muted">
                                        {getCategoryName(p.categoryId)}
                                    </Card.Subtitle>
                                    <Card.Text>{p.description}</Card.Text>
                                </Card.Body>
                                <Card.Footer>
                                    {p.salePrice ? (
                                        <>
                                            <strong className="text-danger me-2">{formatPrice(p.salePrice)}</strong>
                                            <del className="text-muted">{formatPrice(p.price)}</del>
                                        </>
                                    ) : (
                                        <strong>{formatPrice(p.price)}</strong>
                                    )}
                                </Card.Footer>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
}

export default Home;
