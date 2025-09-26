import instance from '../apis/app';

class MetricsService {
    // 🎯 Métricas principales del dashboard
    getDashboardMetrics = (storeId, period = '30d') =>
        instance.get(`/store/metrics/dashboard/${storeId}`, { params: { period } });

    // 💰 Ventas por período
    getSalesByPeriod = (storeId, period = '30d') =>
        instance.get(`/store/metrics/sales/${storeId}`, { params: { period } });

    // 👥 Métricas de clientes
    getCustomerMetrics = (storeId, period = '30d') =>
        instance.get(`/store/metrics/customers/${storeId}`, { params: { period } });

    // 📦 Productos más vendidos
    getTopProducts = (storeId, period = '30d', limit = 20) =>
        instance.get(`/store/metrics/products/${storeId}`, { params: { period, limit } });

    // 📈 Tendencias de ventas
    getSalesTrend = (storeId, period = '30d') =>
        instance.get(`/store/metrics/trends/${storeId}`, { params: { period } });

    // 🕐 Métricas por hora
    getHourlyMetrics = (storeId, period = '7d') =>
        instance.get(`/store/metrics/hourly/${storeId}`, { params: { period } });

    // 📍 Métricas geográficas
    getGeographicMetrics = (storeId, period = '30d') =>
        instance.get(`/store/metrics/geographic/${storeId}`, { params: { period } });

    // 📊 Métricas por método de pago
    getPaymentMethodMetrics = (storeId, period = '30d') =>
        instance.get(`/store/metrics/payment-methods/${storeId}`, { params: { period } });

    // 📊 Pedidos por día
    getOrdersByDay = (storeId, period = '30d') =>
        instance.get(`/store/metrics/orders-by-day/${storeId}`, { params: { period } });

    // 📋 Pedidos por fecha específica
    getOrdersByDate = (storeId, date) =>
        instance.get(`/store/metrics/orders-by-date/${storeId}/${date}`);

    // 📊 Métricas generales del sistema (sin filtros de fecha)
    getGeneralMetrics = (storeId) =>
        instance.get(`/store/metrics/general/${storeId}`);

    // 📋 Reporte completo
    getFullReport = (storeId, period = '30d') =>
        instance.get(`/store/metrics/full-report/${storeId}`, { params: { period } });
}

const Metrics = new MetricsService();
export default Metrics;
