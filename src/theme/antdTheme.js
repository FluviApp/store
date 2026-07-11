// Tema central de Ant Design — combina con fluvi.css.
// Restilea de forma global: botones, inputs, tablas, modales, selects, etc.
const FV_BLUE = '#1e90ff';
const FV_FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export const antdTheme = {
    token: {
        colorPrimary: FV_BLUE,
        colorLink: FV_BLUE,
        colorInfo: FV_BLUE,
        borderRadius: 12,
        fontFamily: FV_FONT,
        controlHeight: 40,
    },
    components: {
        Button: { borderRadius: 14, controlHeightLG: 50, fontWeight: 700 },
        Input: { borderRadius: 12, controlHeightLG: 48 },
        InputNumber: { borderRadius: 12 },
        Select: { borderRadius: 12, controlHeightLG: 48 },
        DatePicker: { borderRadius: 12 },
        Card: { borderRadiusLG: 20 },
        Modal: { borderRadiusLG: 20 },
        Table: { borderRadius: 12, headerBg: 'rgba(30,144,255,0.06)', headerColor: '#1f2a37' },
        Tag: { borderRadiusSM: 8 },
    },
};

export default antdTheme;
