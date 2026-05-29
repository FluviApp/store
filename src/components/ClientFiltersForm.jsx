import React from 'react';
import { Select, Slider, DatePicker, Card, Row, Col, Button, Spin, Tag, Table, Switch } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useZones from '../hooks/useZones';
import useFilteredClients from '../hooks/useFilteredClients';

const ClientFiltersForm = ({ onClientsFound, onLoading }) => {
    const { data: zonesData } = useZones({ page: 1, limit: 1000 });
    const zones = zonesData?.data?.docs || [];
    const { getFilteredClients, isLoading, filteredClients } = useFilteredClients();

    const [filters, setFilters] = React.useState({
        zones: [],
        inactivityDays: null,
        registrationDateFrom: null,
        registrationDateTo: null,
        minSpent: null,
        maxSpent: null,
        neverPurchased: false
    });

    const handleApplyFilters = async () => {
        if (onLoading) onLoading(true);
        const clients = await getFilteredClients(filters);
        if (onLoading) onLoading(false);
        if (onClientsFound && clients) {
            onClientsFound(clients);
        }
    };

    return (
        <Card title="🔍 Filtrar Clientes" bordered={false} className="mb-4">
            <Spin spinning={isLoading}>
                <div className="space-y-4">
                    {/* Zonas */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Zonas</label>
                        <Select
                            mode="multiple"
                            placeholder="Selecciona zonas (opcional)"
                            style={{ width: '100%' }}
                            value={filters.zones}
                            onChange={(value) => setFilters({ ...filters, zones: value })}
                        >
                            {zones.map(zone => (
                                <Select.Option key={zone._id} value={zone.name}>
                                    {zone.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </div>

                    {/* Solo clientes que nunca han comprado */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div>
                            <label className="block text-sm font-medium">Solo clientes que nunca han comprado</label>
                            <p className="text-xs text-gray-500 mt-1">
                                Clientes registrados que jamás hicieron un pedido
                            </p>
                        </div>
                        <Switch
                            checked={filters.neverPurchased}
                            onChange={(checked) => setFilters({
                                ...filters,
                                neverPurchased: checked,
                                inactivityDays: checked ? null : filters.inactivityDays
                            })}
                        />
                    </div>

                    {/* Inactividad */}
                    <div className={filters.neverPurchased ? 'opacity-40 pointer-events-none' : ''}>
                        <label className="block text-sm font-medium mb-2">
                            Clientes con compras pero inactivos hace mínimo:
                            {filters.inactivityDays && <Tag color="blue" className="ml-2">{filters.inactivityDays} días</Tag>}
                        </label>
                        <Slider
                            min={0}
                            max={365}
                            step={1}
                            disabled={filters.neverPurchased}
                            value={filters.inactivityDays || 0}
                            onChange={(value) => setFilters({ ...filters, inactivityDays: value > 0 ? value : null })}
                            marks={{ 0: '0 días', 30: '1 mes', 90: '3 meses', 180: '6 meses', 365: '1 año' }}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Solo incluye clientes que ya compraron antes pero no recientemente.
                        </p>
                    </div>

                    {/* Fecha de Registro */}
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <label className="block text-sm font-medium mb-2">Registrados desde</label>
                            <DatePicker
                                style={{ width: '100%' }}
                                value={filters.registrationDateFrom ? dayjs(filters.registrationDateFrom) : null}
                                onChange={(date) => setFilters({ ...filters, registrationDateFrom: date ? date.toDate() : null })}
                                format="DD/MM/YYYY"
                            />
                        </Col>
                        <Col xs={24} sm={12}>
                            <label className="block text-sm font-medium mb-2">Registrados hasta</label>
                            <DatePicker
                                style={{ width: '100%' }}
                                value={filters.registrationDateTo ? dayjs(filters.registrationDateTo) : null}
                                onChange={(date) => setFilters({ ...filters, registrationDateTo: date ? date.toDate() : null })}
                                format="DD/MM/YYYY"
                            />
                        </Col>
                    </Row>

                    {/* Gasto */}
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <label className="block text-sm font-medium mb-2">Gasto mínimo ($)</label>
                            <input
                                type="number"
                                min="0"
                                step="1000"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="Sin límite"
                                value={filters.minSpent || ''}
                                onChange={(e) => setFilters({ ...filters, minSpent: e.target.value ? parseFloat(e.target.value) : null })}
                            />
                        </Col>
                        <Col xs={24} sm={12}>
                            <label className="block text-sm font-medium mb-2">Gasto máximo ($)</label>
                            <input
                                type="number"
                                min="0"
                                step="1000"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="Sin límite"
                                value={filters.maxSpent || ''}
                                onChange={(e) => setFilters({ ...filters, maxSpent: e.target.value ? parseFloat(e.target.value) : null })}
                            />
                        </Col>
                    </Row>

                    {/* Botón Buscar y Resultado */}
                    <div className="pt-2">
                        <Button
                            type="primary"
                            icon={<FilterOutlined />}
                            onClick={handleApplyFilters}
                            loading={isLoading}
                            block
                        >
                            Buscar Clientes
                        </Button>

                        {filteredClients.length > 0 && (
                            <div className="mt-4">
                                <div className="p-3 bg-green-50 rounded-lg border border-green-200 mb-4">
                                    <p className="text-green-900 font-medium">
                                        ✅ Se encontraron <strong>{filteredClients.length}</strong> clientes que cumplen los criterios
                                    </p>
                                </div>

                                <div className="border rounded-lg overflow-hidden">
                                    <Table
                                        dataSource={filteredClients}
                                        size="small"
                                        pagination={{ pageSize: 10, position: ['bottomCenter'] }}
                                        rowKey="_id"
                                        columns={[
                                            {
                                                title: 'Dirección',
                                                dataIndex: 'address',
                                                key: 'address',
                                                width: '25%',
                                                render: (address) => address || '-'
                                            },
                                            {
                                                title: 'Email',
                                                dataIndex: 'email',
                                                key: 'email',
                                                width: '25%'
                                            },
                                            {
                                                title: 'Zona',
                                                dataIndex: 'block',
                                                key: 'block',
                                                width: '15%',
                                                render: (block) => block ? <Tag color="blue">{block}</Tag> : '-'
                                            },
                                            {
                                                title: 'Registrado',
                                                dataIndex: 'createdAt',
                                                key: 'createdAt',
                                                width: '15%',
                                                render: (date) => dayjs(date).format('DD/MM/YYYY')
                                            },
                                            {
                                                title: 'Última Compra',
                                                dataIndex: 'lastOrderDate',
                                                key: 'lastOrderDate',
                                                width: '12%',
                                                render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : 'Nunca'
                                            },
                                            {
                                                title: 'Gasto Total',
                                                dataIndex: 'totalSpent',
                                                key: 'totalSpent',
                                                width: '12%',
                                                render: (amount) => `$${(amount || 0).toLocaleString('es-CO')}`
                                            }
                                        ]}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Spin>
        </Card>
    );
};

export default ClientFiltersForm;
