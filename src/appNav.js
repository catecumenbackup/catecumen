// Estado de navegación compartido entre App y las pantallas extraídas.
// bypassUnload: cuando es true, se suprime el diálogo "¿Abandonar sitio?"
// (redirección intencional al pago de Stripe). Es un objeto para que la
// mutación se vea en todos los módulos que comparten la referencia.
export const appNav = { bypassUnload: false };
