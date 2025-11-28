export async function solicitarPermissao() {
    if (!('Notification' in window)) {
        console.warn('Este navegador não suporta notificações.');
        return;
    }

    if (Notification.permission === 'default') {
        await Notification.requestPermission();
    }
}

export function exibirNotificacao(titulo, corpo) {
    if (!navigator.serviceWorker) return;

    navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
            registration.active.postMessage({ titulo, corpo });
        }
    });
}
