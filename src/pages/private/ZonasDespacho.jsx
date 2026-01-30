import React, { useMemo, useState, useRef, useEffect } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { Table, Button, Space, Input, Modal, Form, Card, message, Empty, Select, Radio } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, SearchOutlined, AimOutlined } from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import { GoogleMap, DrawingManager, Polygon, useJsApiLoader } from '@react-google-maps/api';
import { useAuth } from '../../context/AuthContext.jsx';
import useZones from '../../hooks/useZones.js';
import Zones from '../../services/Zones.js';
import HorarioGridForm from '../../components/HorarioGridForm';
import useAllDealers from '../../hooks/useAllDealers';

const { Search } = Input;
const comunasDeChile = [
    'Santiago', 'Ñuñoa', 'Providencia', 'La Florida', 'Puente Alto', 'Maipú',
];

const ZonasDespacho = () => {
    const { user } = useAuth();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingZone, setEditingZone] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [tipoZona, setTipoZona] = useState('comuna');
    const [newPolygonCoords, setNewPolygonCoords] = useState([]);
    const [editPolygonCoords, setEditPolygonCoords] = useState([]);
    const [drawingEnabled, setDrawingEnabled] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [customSchedule, setCustomSchedule] = useState(null);

    const isMobile = useMediaQuery({ maxWidth: 768 });
    const drawingManagerRef = useRef(null);
    const newPolygonRef = useRef(null);
    const drawnPolygonRef = useRef(null);
    const mainMapRef = useRef(null);

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: ['drawing'],
    });

    const { data, isLoading, refetch } = useZones({ page: 1, limit: 100 });
    const zonas = data?.data?.docs || [];
    const pageSize = 5;

    const { data: dealersData, isLoading: isLoadingDealers } = useAllDealers();
    const dealers = dealersData?.data || [];


    const filteredZonas = searchText
        ? zonas.filter((item) =>
            item.comuna?.toLowerCase().includes(searchText.toLowerCase()) ||
            item.type?.toLowerCase().includes(searchText.toLowerCase())
        )
        : zonas;

    const zonasDeAreaParaMapa = useMemo(() => {
        const normalizePolygon = (polygon) =>
            (Array.isArray(polygon) ? polygon : [])
                .map((p) => ({ lat: Number(p?.lat), lng: Number(p?.lng) }))
                .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

        return (filteredZonas || [])
            .filter((z) => z?.type === 'area')
            .map((z) => ({ ...z, polygon: normalizePolygon(z?.polygon) }))
            .filter((z) => z.polygon.length >= 3);
    }, [filteredZonas]);

    useEffect(() => {
        if (!isLoaded) return;
        if (!mainMapRef.current) return;
        if (!zonasDeAreaParaMapa.length) return;
        if (!window.google?.maps?.LatLngBounds) return;

        const bounds = new window.google.maps.LatLngBounds();
        zonasDeAreaParaMapa.forEach((z) => z.polygon.forEach((p) => bounds.extend(p)));
        mainMapRef.current.fitBounds(bounds);
    }, [isLoaded, zonasDeAreaParaMapa]);

    const paginatedZonas = filteredZonas.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const columns = [
        {
            title: 'Tipo',
            dataIndex: 'type',
            key: 'type',
            render: (text) => text === 'comuna' ? 'Comuna' : 'Área',
        },
        {
            title: 'Detalle',
            key: 'detalle',
            render: (_, record) => record.type === 'comuna' ? record.comuna : `${record.polygon?.length || 0} puntos`,
        },
        {
            title: 'Costo',
            dataIndex: 'deliveryCost',
            key: 'deliveryCost',
            render: (value) => `$${value}`,
        },

        {
            title: 'Acciones',
            key: 'acciones',
            render: (_, record) => (
                <Space size="middle">
                    <Button icon={<EditOutlined />} onClick={() => handleEditar(record)}>Editar</Button>
                    <Button danger icon={<DeleteOutlined />} onClick={() => handleEliminar(record._id)}>Eliminar</Button>
                </Space>
            ),
        },
    ];

    const handleAgregar = () => {
        setEditingZone(null);
        form.resetFields();
        setTipoZona('comuna');
        setNewPolygonCoords([]);
        setEditPolygonCoords([]);
        setDrawingEnabled(false);
        setIsModalVisible(true);
    };
    const handleEditar = (zona) => {
        console.log('Abriendo edición de zona:', zona);
        setEditingZone(zona);
        setTipoZona(zona.type);
        setNewPolygonCoords([]);

        if (zona.type === 'area') {
            console.log('Seteando coords para edición:', zona.polygon);
            setEditPolygonCoords([...(zona.polygon || [])]);
            form.setFieldsValue({
                costoDespacho: zona.deliveryCost,
                dealerId: zona.dealerId || null,
            });
        } else {
            form.setFieldsValue({
                comuna: zona.comuna,
                costoDespacho: zona.deliveryCost,
                dealerId: zona.dealerId || null,
            });
            setEditPolygonCoords([]);
        }

        setNewPolygonCoords([]);
        setIsModalVisible(true);
    };


    useEffect(() => {
        if (isModalVisible && editingZone && editingZone.type === 'area') {
            setEditPolygonCoords(editingZone.polygon || []);
        }
    }, [isModalVisible, editingZone]);

    const handleModalOk = () => {
        form.validateFields().then(async (values) => {
            let payload;

            if (tipoZona === 'comuna') {
                payload = {
                    type: 'comuna',
                    comuna: values.comuna,
                    deliveryCost: parseFloat(values.costoDespacho),
                    storeId: user.storeId,
                    dealerId: values.dealerId || '',
                };

            } else if (tipoZona === 'area') {
                const rawCoords = editingZone
                    ? newPolygonCoords.length > 0
                        ? newPolygonCoords
                        : editPolygonCoords
                    : newPolygonCoords;

                const coords = rawCoords.map(({ lat, lng }) => ({ lat, lng }));

                if (coords.length === 0) {
                    message.error('Por favor dibuja un área en el mapa');
                    return;
                }

                payload = {
                    type: 'area',
                    polygon: coords,
                    deliveryCost: parseFloat(values.costoDespacho),
                    storeId: user.storeId,
                    dealerId: values.dealerId || '',
                };

            }

            try {
                payload.schedule = customSchedule || editingZone?.schedule;

                const response = editingZone
                    ? await Zones.edit(editingZone._id, payload)
                    : await Zones.create(payload);

                if (response?.success) {
                    message.success(editingZone ? 'Zona actualizada correctamente' : 'Zona creada correctamente');

                    setNewPolygonCoords([]);
                    setEditPolygonCoords([]);
                    setDrawingEnabled(false);
                    form.resetFields();
                    setEditingZone(null);

                    if (drawnPolygonRef.current) {
                        drawnPolygonRef.current.setMap(null);
                        drawnPolygonRef.current = null;
                    }

                    if (newPolygonRef.current) {
                        newPolygonRef.current.setMap(null);
                        newPolygonRef.current = null;
                    }

                    setIsModalVisible(false);
                    setCustomSchedule(null); // ✅ Limpia el horario al cerrar
                    refetch();
                } else {
                    message.warning(response.message || 'No se pudo completar la acción');
                }
            } catch (error) {
                const errorMessage = error?.response?.data?.message || error.message || 'Error de servidor';
                message.error(errorMessage);
            }
        }).catch(() => {
            message.error('Por favor completá correctamente el formulario.');
        });
    };



    const handleEliminar = (id) => {
        Modal.confirm({
            title: '¿Eliminar zona?',
            content: 'Esta acción no se puede deshacer.',
            okType: 'danger',
            okText: 'Eliminar',
            cancelText: 'Cancelar',
            onOk: async () => {
                try {
                    const response = await Zones.delete(id);
                    if (response?.success) {
                        message.success('Zona eliminada correctamente');
                        refetch();
                    } else {
                        message.warning(response.message || 'No se pudo eliminar la zona');
                    }
                } catch (err) {
                    const errorMessage = err?.response?.data?.message || err?.message || 'Error al eliminar zona';
                    message.error(errorMessage);
                }
            }
        });
    };

    const handleBuscar = (value) => {
        setCurrentPage(1);
        setSearchText(value);
    };

    const handleModalCancel = () => {
        form.resetFields();
        setEditingZone(null);
        setNewPolygonCoords([]);
        setEditPolygonCoords([]);
        setDrawingEnabled(false);

        if (drawingManagerRef.current) {
            drawingManagerRef.current.setMap(null);
            drawingManagerRef.current = null;
        }

        if (drawnPolygonRef.current) {
            drawnPolygonRef.current.setMap(null);
            drawnPolygonRef.current = null;
        }

        if (newPolygonRef.current) {
            newPolygonRef.current.setMap(null);
            newPolygonRef.current = null;
        }

        setIsModalVisible(false);
        setCustomSchedule(null); // ✅ También aquí para evitar arrastre
    };


    const onPolygonComplete = (polygon) => {
        const path = polygon.getPath();
        const coords = [];
        for (let i = 0; i < path.getLength(); i++) {
            const point = path.getAt(i);
            coords.push({ lat: point.lat(), lng: point.lng() });
        }

        if (drawnPolygonRef.current) {
            drawnPolygonRef.current.setMap(null);
        }
        drawnPolygonRef.current = polygon;

        setNewPolygonCoords(coords);
        setDrawingEnabled(false);
    };

    const toggleDrawing = () => {
        setDrawingEnabled(true);
    };


    useEffect(() => {
        if (isModalVisible && editingZone && editingZone.type === 'area' && mapLoaded) {
            setEditPolygonCoords(editingZone.polygon || []);
        }
    }, [isModalVisible, editingZone, mapLoaded]);

    useEffect(() => {
        if (mapLoaded && editingZone?.type === 'area') {
            console.log('useEffect ejecutado - mapLoaded:', mapLoaded, 'editingZone:', editingZone);
            setTimeout(() => {
                setEditPolygonCoords([...(editingZone.polygon || [])]);
                console.log('Polygon coords seteados con delay forzado');
            }, 1000); // Delay breve para garantizar que el mapa esté renderizado
        }
    }, [mapLoaded, editingZone]);


    useEffect(() => {
        if (!isModalVisible) {
            setNewPolygonCoords([]);      // limpiar nuevo polígono
            setEditPolygonCoords([]);     // 🔴 limpiar polígono de edición
            setDrawingEnabled(false);     // desactivar herramienta de dibujo
        }
    }, [isModalVisible]);

    return (

        <div className="flex min-h-screen bg-gray-100">
            {(() => {
                if (mapLoaded && editingZone?.type === 'area') {
                    console.log('Render condicional Polygon:', {
                        coords: editPolygonCoords,
                        length: editPolygonCoords.length,
                        mapLoaded,
                        editingZone
                    });
                }
                return null;
            })()}
            <Sidebar />
            <div className="flex-1 pt-16 px-4 lg:pt-8 lg:px-8 overflow-x-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Zonas de Despacho</h1>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAgregar}>Agregar Zona</Button>
                </div>

                <div className="mb-6">
                    <Search
                        placeholder="Buscar zona..."
                        allowClear
                        enterButton={<SearchOutlined />}
                        size="large"
                        onSearch={handleBuscar}
                        onChange={(e) => handleBuscar(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card
                        bordered
                        title="Mapa de zonas (polígonos)"
                        className="h-fit"
                    >
                        {!isLoaded ? (
                            <div className="flex justify-center items-center" style={{ height: 450 }}>
                                <span>Cargando mapa...</span>
                            </div>
                        ) : zonasDeAreaParaMapa.length === 0 ? (
                            <div className="flex justify-center items-center" style={{ height: 450 }}>
                                <Empty description="No hay zonas de tipo área para dibujar" />
                            </div>
                        ) : (
                            <div className="rounded-lg overflow-hidden" style={{ height: 450 }}>
                                <GoogleMap
                                    mapContainerStyle={{ width: '100%', height: '100%' }}
                                    center={{ lat: -33.45, lng: -70.6667 }}
                                    zoom={12}
                                    onLoad={(map) => {
                                        mainMapRef.current = map;
                                    }}
                                    onUnmount={() => {
                                        mainMapRef.current = null;
                                    }}
                                >
                                    {zonasDeAreaParaMapa.map((zone) => (
                                        <Polygon
                                            key={zone._id}
                                            paths={zone.polygon}
                                            options={{
                                                fillColor: '#2563eb',
                                                fillOpacity: 0.2,
                                                strokeColor: '#2563eb',
                                                strokeWeight: 2,
                                                clickable: true,
                                                editable: false,
                                                zIndex: 1,
                                            }}
                                            onClick={() => handleEditar(zone)}
                                        />
                                    ))}
                                </GoogleMap>
                            </div>
                        )}
                    </Card>

                    <div className="overflow-x-auto">
                        {isMobile ? (
                            paginatedZonas.length > 0 ? (
                                <div className="grid gap-4">
                                    {paginatedZonas.map((zona) => (
                                        <Card key={zona._id} bordered>
                                            <p><strong>Tipo:</strong> {zona.type === 'comuna' ? 'Comuna' : 'Área'}</p>
                                            <p><strong>Costo Despacho:</strong> ${zona.deliveryCost}</p>

                                            <p><strong>Detalle:</strong> {zona.type === 'comuna' ? zona.comuna : `${zona.polygon?.length || 0} puntos`}</p>
                                            <div className="flex gap-2 mt-2">
                                                <Button icon={<EditOutlined />} onClick={() => handleEditar(zona)}>Editar</Button>
                                                <Button danger icon={<DeleteOutlined />} onClick={() => handleEliminar(zona._id)}>Eliminar</Button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex justify-center items-center min-h-[300px]">
                                    <Empty description="No hay zonas" />
                                </div>
                            )
                        ) : (
                            <Table
                                dataSource={filteredZonas}
                                columns={columns}
                                loading={isLoading}
                                pagination={{ pageSize }}
                                bordered
                                rowKey="_id"
                            />
                        )}
                    </div>
                </div>

                <Modal
                    title={editingZone ? 'Editar Zona' : 'Agregar Zona'}
                    open={isModalVisible}
                    onOk={handleModalOk}
                    onCancel={handleModalCancel}
                    okText={editingZone ? 'Guardar Cambios' : 'Agregar'}
                    cancelText="Cancelar"
                    width={800}
                >
                    <Form form={form} layout="vertical">
                        <Form.Item label="Tipo de Zona">
                            <Radio.Group
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setTipoZona(value);
                                    if (value === 'area') {
                                        setNewPolygonCoords([]);
                                    }
                                }}
                                value={tipoZona}
                                disabled={!!editingZone}
                            >
                                <Radio value="comuna">Por Comuna</Radio>
                                <Radio value="area">Por Área</Radio>
                            </Radio.Group>
                        </Form.Item>

                        {tipoZona === 'comuna' && (
                            <Form.Item name="comuna" label="Comuna" rules={[{ required: true, message: 'Selecciona una comuna' }]}>
                                <Select showSearch placeholder="Selecciona una comuna">
                                    {comunasDeChile.map((comuna) => (
                                        <Select.Option key={comuna} value={comuna}>{comuna}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        )}


                        <Form.Item
                            name="costoDespacho"
                            label="Costo de Despacho"
                            rules={[
                                { required: true, message: 'Por favor ingresa el costo de despacho' },
                                {
                                    validator: (_, value) =>
                                        value >= 0 ? Promise.resolve() : Promise.reject('Debe ser mayor o igual a 0'),
                                },
                            ]}
                        >
                            <Input type="number" min={0} placeholder="Ej: 1500" />
                        </Form.Item>

                        <Form.Item
                            name="dealerId"
                            label="Repartidor"
                            rules={[{ required: false }]}
                        >
                            <Select
                                placeholder="Selecciona un repartidor"
                                allowClear
                                showSearch
                                optionFilterProp="children"
                                loading={isLoadingDealers}
                            >
                                {dealers.map(dealer => (
                                    <Select.Option key={dealer._id} value={dealer._id}>
                                        {dealer.name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>


                        {tipoZona === 'area' && isLoaded && (
                            <div>
                                <Button
                                    type="dashed"
                                    icon={<AimOutlined />}
                                    onClick={toggleDrawing}
                                    disabled={!isLoaded}
                                    className="mb-4"
                                >
                                    {(newPolygonCoords.length || editPolygonCoords.length) ? 'Redibujar Área' : 'Dibujar Área'}
                                </Button>

                                <div className="rounded-lg overflow-hidden mb-6" style={{ height: '400px' }}>
                                    <GoogleMap
                                        mapContainerStyle={{ width: '100%', height: '100%' }}
                                        center={{ lat: -33.45, lng: -70.6667 }}
                                        zoom={14}
                                        onTilesLoaded={() => setMapLoaded(true)}
                                    >
                                        {mapLoaded && editingZone?.type === 'area' && editPolygonCoords.length > 0 && (
                                            <Polygon
                                                key={`original-${editingZone._id}`}
                                                paths={editPolygonCoords}
                                                options={{
                                                    fillColor: '#FF0000',
                                                    fillOpacity: 0.3,
                                                    strokeColor: '#FF0000',
                                                    strokeWeight: 2,
                                                    clickable: false,
                                                    editable: false,
                                                    zIndex: 1,
                                                }}
                                            />
                                        )}

                                        {mapLoaded && newPolygonCoords.length > 0 && isModalVisible && (
                                            <Polygon
                                                onLoad={(polygon) => {
                                                    newPolygonRef.current = polygon;
                                                }}
                                                onUnmount={() => {
                                                    newPolygonRef.current = null;
                                                }}
                                                paths={newPolygonCoords}
                                                options={{
                                                    fillColor: '#2196F3',
                                                    fillOpacity: 0.3,
                                                    strokeColor: '#2196F3',
                                                    strokeWeight: 2,
                                                    clickable: false,
                                                    editable: false,
                                                    zIndex: 2,
                                                }}
                                            />
                                        )}

                                        {isLoaded && drawingEnabled && (
                                            <DrawingManager
                                                onPolygonComplete={onPolygonComplete}
                                                options={{
                                                    drawingControl: false,
                                                    drawingMode: 'polygon',
                                                    polygonOptions: {
                                                        fillColor: '#2196F3',
                                                        fillOpacity: 0.3,
                                                        strokeColor: '#2196F3',
                                                        strokeWeight: 2,
                                                        clickable: false,
                                                        editable: false,
                                                        zIndex: 3,
                                                    },
                                                }}
                                            />
                                        )}
                                    </GoogleMap>
                                </div>



                            </div>
                        )}

                        {editingZone && (
                            <Form.Item label="Horarios de Despacho">
                                <div className="max-h-[300px] overflow-y-auto rounded-lg p-4 border-t border-gray-200">
                                    <HorarioGridForm
                                        initialSchedule={editingZone.schedule}
                                        onChange={(updatedSchedule) => setCustomSchedule(updatedSchedule)}
                                    />
                                </div>
                            </Form.Item>
                        )}
                    </Form>


                </Modal>
            </div>
        </div>
    );
};

export default ZonasDespacho;
