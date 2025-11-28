import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Form, Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';

const VendorProfile = () => {
    const [formData, setFormData] = useState({
        vendor_type: 'perusahaan',
        vendor_name: '',
        email: '',
        telephone: '',
        fax: '',
        mobile: '',
        province: '',
        city: '',
        district: '',
        address: '',
        business_field: '',
        npwp_number: '',
        npwp_name: '',
        npwp_address: '',
        npwp_file_path: '',
        bank_name: '',
        bank_branch: '',
        account_number: '',
        account_holder_name: '',
        bank_book_file_path: '',
        transaction_type: '',
        purch_group: '',
        region_or_so: '',
        nik: '',
        ktp_file_path: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/api/vendor/profile');
            if (response.data.data && response.data.data.profile) {
                const profile = response.data.data.profile;
                setFormData({
                    vendor_type: response.data.data.vendor?.vendor_type || 'perusahaan',
                    vendor_name: profile.vendor_name || '',
                    email: profile.email || '',
                    telephone: profile.phone || '',
                    fax: profile.fax || '',
                    mobile: profile.mobile || '',
                    province: profile.province || '',
                    city: profile.city || '',
                    district: profile.district || '',
                    address: profile.address || '',
                    business_field: profile.business_field || '',
                    npwp_number: profile.npwp_number || '',
                    npwp_name: profile.npwp_name || '',
                    npwp_address: profile.npwp_address || '',
                    npwp_file_path: profile.npwp_file_path || '',
                    bank_name: profile.bank_name || '',
                    bank_branch: profile.bank_branch || '',
                    account_number: profile.account_number || '',
                    account_holder_name: profile.account_holder_name || '',
                    bank_book_file_path: profile.bank_book_file_path || '',
                    transaction_type: profile.transaction_type || '',
                    purch_group: profile.purch_group || '',
                    region_or_so: profile.region_or_so || '',
                    nik: profile.nik || '',
                    ktp_file_path: profile.ktp_file_path || '',
                });
            }
        } catch (err) {
            console.error('Failed to fetch profile', err);
            // Don't show error if it's just 404 (profile not created yet)
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);

        try {
            await api.post('/api/vendor/profile', formData);
            setSuccess('Profile updated successfully!');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div>
            <h2 className="fw-bold mb-4">Vendor Profile</h2>

            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Form onSubmit={handleSubmit}>
                <Card className="shadow-sm border-0 mb-4">
                    <Card.Header className="bg-white py-3">
                        <h5 className="mb-0 fw-bold text-primary">General Information</h5>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Vendor Type</Form.Label>
                                    <Form.Select name="vendor_type" value={formData.vendor_type} onChange={handleChange}>
                                        <option value="perusahaan">Perusahaan</option>
                                        <option value="perorangan">Perorangan</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Vendor Name</Form.Label>
                                    <Form.Control type="text" name="vendor_name" value={formData.vendor_name} onChange={handleChange} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>NIK (KTP)</Form.Label>
                                    <Form.Control type="text" name="nik" value={formData.nik} onChange={handleChange} required />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <Card className="shadow-sm border-0 mb-4">
                    <Card.Header className="bg-white py-3">
                        <h5 className="mb-0 fw-bold text-primary">Contact & Address</h5>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Telephone</Form.Label>
                                    <Form.Control type="text" name="telephone" value={formData.telephone} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Mobile</Form.Label>
                                    <Form.Control type="text" name="mobile" value={formData.mobile} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Fax</Form.Label>
                                    <Form.Control type="text" name="fax" value={formData.fax} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Province</Form.Label>
                                    <Form.Control type="text" name="province" value={formData.province} onChange={handleChange} required />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>City</Form.Label>
                                    <Form.Control type="text" name="city" value={formData.city} onChange={handleChange} required />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>District</Form.Label>
                                    <Form.Control type="text" name="district" value={formData.district} onChange={handleChange} required />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Address</Form.Label>
                                    <Form.Control as="textarea" rows={3} name="address" value={formData.address} onChange={handleChange} required />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <Card className="shadow-sm border-0 mb-4">
                    <Card.Header className="bg-white py-3">
                        <h5 className="mb-0 fw-bold text-primary">Business & Tax Info</h5>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Business Field</Form.Label>
                                    <Form.Control type="text" name="business_field" value={formData.business_field} onChange={handleChange} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>NPWP Number</Form.Label>
                                    <Form.Control type="text" name="npwp_number" value={formData.npwp_number} onChange={handleChange} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>NPWP Name</Form.Label>
                                    <Form.Control type="text" name="npwp_name" value={formData.npwp_name} onChange={handleChange} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>NPWP Address</Form.Label>
                                    <Form.Control type="text" name="npwp_address" value={formData.npwp_address} onChange={handleChange} required />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <Card className="shadow-sm border-0 mb-4">
                    <Card.Header className="bg-white py-3">
                        <h5 className="mb-0 fw-bold text-primary">Bank Information</h5>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Bank Name</Form.Label>
                                    <Form.Control type="text" name="bank_name" value={formData.bank_name} onChange={handleChange} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Bank Branch</Form.Label>
                                    <Form.Control type="text" name="bank_branch" value={formData.bank_branch} onChange={handleChange} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Account Number</Form.Label>
                                    <Form.Control type="text" name="account_number" value={formData.account_number} onChange={handleChange} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Account Holder Name</Form.Label>
                                    <Form.Control type="text" name="account_holder_name" value={formData.account_holder_name} onChange={handleChange} required />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <Card className="shadow-sm border-0 mb-4">
                    <Card.Header className="bg-white py-3">
                        <h5 className="mb-0 fw-bold text-primary">Additional Info</h5>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Transaction Type</Form.Label>
                                    <Form.Control type="text" name="transaction_type" value={formData.transaction_type} onChange={handleChange} required />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Purch Group</Form.Label>
                                    <Form.Control type="text" name="purch_group" value={formData.purch_group} onChange={handleChange} required />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Region / SO</Form.Label>
                                    <Form.Control type="text" name="region_or_so" value={formData.region_or_so} onChange={handleChange} required />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <Card className="shadow-sm border-0 mb-4">
                    <Card.Header className="bg-white py-3">
                        <h5 className="mb-0 fw-bold text-primary">Document Upload</h5>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Upload NPWP Photo</Form.Label>
                                    <Form.Control type="file" accept="image/*,.pdf" />
                                    <Form.Text className="text-muted">
                                        Upload foto/scan NPWP (Max: 5MB)
                                    </Form.Text>
                                    {formData.npwp_file_path && (
                                        <div className="mt-2 small text-success">
                                            ✓ File uploaded: {formData.npwp_file_path}
                                        </div>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Upload Bank Book (Halaman Depan)</Form.Label>
                                    <Form.Control type="file" accept="image/*,.pdf" />
                                    <Form.Text className="text-muted">
                                        Upload foto/scan halaman depan buku rekening (Max: 5MB)
                                    </Form.Text>
                                    {formData.bank_book_file_path && (
                                        <div className="mt-2 small text-success">
                                            ✓ File uploaded: {formData.bank_book_file_path}
                                        </div>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Upload KTP</Form.Label>
                                    <Form.Control type="file" accept="image/*,.pdf" />
                                    <Form.Text className="text-muted">
                                        Upload foto/scan KTP (Max: 5MB)
                                    </Form.Text>
                                    {formData.ktp_file_path && (
                                        <div className="mt-2 small text-success">
                                            ✓ File uploaded: {formData.ktp_file_path}
                                        </div>
                                    )}
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <div className="d-flex justify-content-end mb-5">
                    <Button type="submit" variant="primary" size="lg" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Profile'}
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default VendorProfile;
