self.addEventListener("install", () => {
    self.skipWaiting();
});

self.addEventListener("activate", () => {
    clients.claim();
});

self.addEventListener("message", (event) => {
    const { titulo, corpo } = event.data;

    self.registration.showNotification(titulo, {
        body: corpo,
        icon: "/pomodoro/assets/tomate.png"
    });
});
