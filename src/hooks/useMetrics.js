import { useQuery } from '@tanstack/react-query';
import Metrics from '../services/Metrics.js';
import { useAuth } from '../context/AuthContext.jsx';

// 🎯 Hook para métricas del dashboard
export const useDashboardMetrics = (period = '30d') => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['dashboardMetrics', user?.storeId, period],
        queryFn: () => Metrics.getDashboardMetrics(user?.storeId, period),
        enabled: !!user?.storeId,
        staleTime: 5 * 60 * 1000, // 5 minutos
        cacheTime: 10 * 60 * 1000, // 10 minutos
    });
};

// 💰 Hook para ventas por período
export const useSalesByPeriod = (period = '30d') => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['salesByPeriod', user?.storeId, period],
        queryFn: () => Metrics.getSalesByPeriod(user?.storeId, period),
        enabled: !!user?.storeId,
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
    });
};

// 👥 Hook para métricas de clientes
export const useCustomerMetrics = (period = '30d') => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['customerMetrics', user?.storeId, period],
        queryFn: () => Metrics.getCustomerMetrics(user?.storeId, period),
        enabled: !!user?.storeId,
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
    });
};

// 📦 Hook para productos más vendidos
export const useTopProducts = (period = '30d', limit = 20) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['topProducts', user?.storeId, period, limit],
        queryFn: () => Metrics.getTopProducts(user?.storeId, period, limit),
        enabled: !!user?.storeId,
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
    });
};

// 📈 Hook para tendencias de ventas
export const useSalesTrend = (period = '30d') => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['salesTrend', user?.storeId, period],
        queryFn: () => Metrics.getSalesTrend(user?.storeId, period),
        enabled: !!user?.storeId,
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
    });
};

// 🕐 Hook para métricas por hora
export const useHourlyMetrics = (period = '7d') => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['hourlyMetrics', user?.storeId, period],
        queryFn: () => Metrics.getHourlyMetrics(user?.storeId, period),
        enabled: !!user?.storeId,
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
    });
};

// 📍 Hook para métricas geográficas
export const useGeographicMetrics = (period = '30d') => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['geographicMetrics', user?.storeId, period],
        queryFn: () => Metrics.getGeographicMetrics(user?.storeId, period),
        enabled: !!user?.storeId,
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
    });
};

// 📊 Hook para métricas por método de pago
export const usePaymentMethodMetrics = (period = '30d') => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['paymentMethodMetrics', user?.storeId, period],
        queryFn: () => Metrics.getPaymentMethodMetrics(user?.storeId, period),
        enabled: !!user?.storeId,
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
    });
};

// 📊 Hook para pedidos por día
export const useOrdersByDay = (period = '30d') => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['ordersByDay', user?.storeId, period],
        queryFn: () => Metrics.getOrdersByDay(user?.storeId, period),
        enabled: !!user?.storeId,
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
    });
};

// 📋 Hook para pedidos por fecha específica
export const useOrdersByDate = (date) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['ordersByDate', user?.storeId, date],
        queryFn: () => Metrics.getOrdersByDate(user?.storeId, date),
        enabled: !!user?.storeId && !!date,
        staleTime: 2 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
    });
};

// 📊 Hook para métricas generales del sistema (sin filtros de fecha)
export const useGeneralMetrics = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['generalMetrics', user?.storeId],
        queryFn: () => Metrics.getGeneralMetrics(user?.storeId),
        enabled: !!user?.storeId,
        staleTime: 10 * 60 * 1000, // 10 minutos - datos generales cambian menos
        cacheTime: 30 * 60 * 1000, // 30 minutos
    });
};

// 📋 Hook para reporte completo
export const useFullReport = (period = '30d') => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['fullReport', user?.storeId, period],
        queryFn: () => Metrics.getFullReport(user?.storeId, period),
        enabled: !!user?.storeId,
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
    });
};

export default {
    useDashboardMetrics,
    useSalesByPeriod,
    useCustomerMetrics,
    useTopProducts,
    useSalesTrend,
    useHourlyMetrics,
    useGeographicMetrics,
    usePaymentMethodMetrics,
    useOrdersByDay,
    useOrdersByDate,
    useGeneralMetrics,
    useFullReport,
};
