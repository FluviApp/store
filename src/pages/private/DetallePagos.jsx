import React, { useState, useMemo } from 'react';
import { Card, Row, Col, Table, Tag, Tabs, Button, DatePicker, Segmented, Space, Typography } from 'antd';
import { DownloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import useOrders from '../../hooks/useOrders.js';
import Sidebar from '../../components/Sidebar.jsx';

const { Text, Title } = Typography;

const PM_LABELS = { efectivo: 'Efectivo', transferencia: 'Transferencia', webpay: 'WebPay', mercadopago: 'Mercado Pago', tarjeta: 'Tarjeta', otro: 'Otro' };
const PM_ORDER = ['efectivo', 'transferencia', 'webpay', 'mercadopago', 'tarjeta', 'otro'];
const fmtCLP = (v) => `$${Number(v || 0).toLocaleString('es-CL')}`;

const DetallePagos = () => {
    const navigate = useNavigate();

    const [payPreset, setPayPreset] = useState('30d'); // today | 7d | 30d | month | custom
    const [payCustom, setPayCustom] = useState(null);   // [dayjs, dayjs]
    const [payMethod, setPayMethod] = useState('all');

    const { payStart, payEnd } = useMemo(() => {
        const today = dayjs();
        if (payPreset === 'custom' && payCustom?.[0] && payCustom?.[1]) {
            return { payStart: payCustom[0].format('YYYY-MM-DD'), payEnd: payCustom[1].format('YYYY-MM-DD') };
        }
        const end = today.format('YYYY-MM-DD');
        let start = end;
        if (payPreset === '7d') start = today.subtract(6, 'day').format('YYYY-MM-DD');
        else if (payPreset === '30d') start = today.subtract(29, 'day').format('YYYY-MM-DD');
        else if (payPreset === 'month') start = today.startOf('month').format('YYYY-MM-DD');
        return { payStart: start, payEnd: end };
    }, [payPreset, payCustom]);

    const { data: payOrdersResp, isLoading: payOrdersLoading } = useOrders({ startDate: payStart, endDate: payEnd, limit: 2000 });
    const payOrders = payOrdersResp?.data?.docs || [];
    const payTotalDocs = payOrdersResp?.data?.totalDocs ?? payOrders.length;
    const payTruncated = payTotalDocs > payOrders.length;

    const amountOf = (o) => Number(o.finalPrice ?? o.price ?? 0);
    const feeOf = (o) => Number(o.paymentFeeAmount || 0);

    const paySummary = useMemo(() => {
        const map = {};
        for (const o of payOrders) {
            const m = o.paymentMethod || 'otro';
            if (!map[m]) map[m] = { count: 0, total: 0, fee: 0 };
            map[m].count += 1;
            map[m].total += amountOf(o);
            map[m].fee += feeOf(o);
        }
        return map;
    }, [payOrders]);
    const payTotalAll = Object.values(paySummary).reduce((s, v) => s + v.total, 0);
    const payRows = payMethod === 'all' ? payOrders : payOrders.filter((o) => (o.paymentMethod || 'otro') === payMethod);

    const payColumns = [
        { title: 'Fecha', dataIndex: 'deliveryDate', key: 'fecha', render: (d) => (d ? dayjs(d).format('DD/MM/YYYY') : '—') },
        { title: 'N° pedido', dataIndex: '_id', key: 'num', render: (id) => `#${String(id || '').slice(-5)}` },
        { title: 'Cliente', key: 'cliente', render: (_, r) => r.customer?.name || r.customer?.address || '—' },
        { title: 'Estado', dataIndex: 'status', key: 'estado', render: (s) => <Tag>{s || '—'}</Tag> },
        { title: 'Método', dataIndex: 'paymentMethod', key: 'metodo', render: (m) => PM_LABELS[m] || m || '—' },
        { title: 'Monto', key: 'monto', align: 'right', render: (_, r) => <span className="font-semibold">{fmtCLP(amountOf(r))}</span> },
        { title: 'Comisión', key: 'comision', align: 'right', render: (_, r) => fmtCLP(feeOf(r)) },
        { title: 'Neto', key: 'neto', align: 'right', render: (_, r) => fmtCLP(amountOf(r) - feeOf(r)) },
    ];

    const exportPayCSV = () => {
        const header = ['Fecha', 'N pedido', 'Cliente', 'Estado', 'Metodo', 'Monto', 'Comision', 'Neto'];
        const clean = (s) => String(s ?? '').replace(/[";\n\r]/g, ' ');
        const lines = payRows.map((r) => [
            r.deliveryDate ? dayjs(r.deliveryDate).format('DD/MM/YYYY') : '',
            `#${String(r._id || '').slice(-5)}`,
            clean(r.customer?.name || r.customer?.address || ''),
            clean(r.status || ''),
            PM_LABELS[r.paymentMethod] || r.paymentMethod || '',
            amountOf(r),
            feeOf(r),
            amountOf(r) - feeOf(r),
        ].join(';'));
        const csv = '﻿' + [header.join(';'), ...lines].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pagos_${payMethod}_${payStart}_${payEnd}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex min-h-screen fluvi-page">
            <Sidebar />
            <div className="flex-1 pt-16 px-4 lg:pt-8 lg:px-8 overflow-x-auto">
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/metricas')} className="mb-4">
                    Volver a Métricas
                </Button>
                <Title level={2} style={{ marginBottom: 16 }}>Detalle de pagos por método</Title>

                <Card
                    title="Pedidos por método de pago"
                    extra={<Button type="primary" icon={<DownloadOutlined />} onClick={exportPayCSV} disabled={!payRows.length}>Exportar CSV</Button>}
                >
                    <Space wrap style={{ marginBottom: 16 }}>
                        <Segmented
                            value={payPreset}
                            onChange={setPayPreset}
                            options={[
                                { label: 'Hoy', value: 'today' },
                                { label: '7 días', value: '7d' },
                                { label: '30 días', value: '30d' },
                                { label: 'Este mes', value: 'month' },
                                { label: 'Personalizado', value: 'custom' },
                            ]}
                        />
                        {payPreset === 'custom' && (
                            <DatePicker.RangePicker value={payCustom} onChange={setPayCustom} format="DD/MM/YYYY" allowClear />
                        )}
                        <Text type="secondary">{payStart} → {payEnd}</Text>
                    </Space>

                    <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                        {PM_ORDER.filter((m) => paySummary[m]).map((m) => (
                            <Col xs={12} sm={8} lg={4} key={m}>
                                <Card size="small" bordered>
                                    <div style={{ fontSize: 12, color: '#888' }}>{PM_LABELS[m]}</div>
                                    <div style={{ fontSize: 18, fontWeight: 700 }}>{fmtCLP(paySummary[m].total)}</div>
                                    <div style={{ fontSize: 12, color: '#888' }}>
                                        {paySummary[m].count} pedidos · {payTotalAll ? Math.round((paySummary[m].total / payTotalAll) * 100) : 0}%
                                    </div>
                                </Card>
                            </Col>
                        ))}
                        {!payOrdersLoading && payOrders.length === 0 && (
                            <Col span={24}><Text type="secondary">No hay pedidos en el rango seleccionado.</Text></Col>
                        )}
                    </Row>

                    <Tabs
                        activeKey={payMethod}
                        onChange={setPayMethod}
                        items={[
                            { key: 'all', label: `Todos (${payOrders.length})` },
                            ...PM_ORDER.filter((m) => paySummary[m]).map((m) => ({ key: m, label: `${PM_LABELS[m]} (${paySummary[m].count})` })),
                        ]}
                    />

                    {payTruncated && (
                        <div style={{ marginBottom: 8 }}>
                            <Text type="warning">Mostrando los primeros {payOrders.length} de {payTotalDocs} pedidos. Acota el rango de fechas para verlos todos.</Text>
                        </div>
                    )}

                    <Table
                        dataSource={payRows}
                        columns={payColumns}
                        rowKey="_id"
                        loading={payOrdersLoading}
                        size="small"
                        pagination={{ pageSize: 10, position: ['bottomCenter'], showSizeChanger: false }}
                        scroll={{ x: 'max-content' }}
                        summary={() => {
                            const t = payRows.reduce((s, r) => s + amountOf(r), 0);
                            const f = payRows.reduce((s, r) => s + feeOf(r), 0);
                            return (
                                <Table.Summary fixed>
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell index={0} colSpan={5}><strong>Total ({payRows.length})</strong></Table.Summary.Cell>
                                        <Table.Summary.Cell index={5} align="right"><strong>{fmtCLP(t)}</strong></Table.Summary.Cell>
                                        <Table.Summary.Cell index={6} align="right"><strong>{fmtCLP(f)}</strong></Table.Summary.Cell>
                                        <Table.Summary.Cell index={7} align="right"><strong>{fmtCLP(t - f)}</strong></Table.Summary.Cell>
                                    </Table.Summary.Row>
                                </Table.Summary>
                            );
                        }}
                    />
                </Card>
            </div>
        </div>
    );
};

export default DetallePagos;
