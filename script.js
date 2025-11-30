if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('/pomodoro/sw.js', { scope: '/pomodoro/' })
        .then(() => console.log('Service Worker registrado!'))
        .catch((err) => console.error('Erro ao registrar SW:', err));
}

import { solicitarPermissao, exibirNotificacao } from './notification.js';

const modos = {
    pomodoro: { foco: 25 * 60, pausa: 5 * 60 },
    longPomodoro: { foco: 50 * 60, pausa: 10 * 60 },
};

let modoAtual = 'pomodoro';
let tipoSessao = 'foco';
let ciclosCompletos = 0;
let tempoRestante = modos[modoAtual][tipoSessao];
let intervalo = null;
let estaRodando = false;

const btnStart = document.getElementById('start-btn');
const btnPause = document.getElementById('pause-btn');
const btnReset = document.getElementById('reset-btn');
const modoBotoes = document.querySelectorAll('.mode-button');
const bells = new Audio('./assets/happy-bell-alert.wav');

document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener(() => solicitarPermissao(), { once: true });
});

btnStart.addEventListener('click', iniciarTimer);
btnPause.addEventListener('click', pausarTimer);
btnPause.disabled = true;
btnReset.addEventListener('click', reiniciarTimer);

document
    .getElementById('pomodoro-mode')
    .addEventListener('click', () => trocarModo('pomodoro'));
document
    .getElementById('long-pomodoro-mode')
    .addEventListener('click', () => trocarModo('longPomodoro'));

function atualizarDisplay() {
    let minutos = Math.floor(tempoRestante / 60);
    let segundos = tempoRestante % 60;

    document.getElementById('time-minutes').textContent = String(
        minutos
    ).padStart(2, '0');
    document.getElementById('time-seconds').textContent = String(
        segundos
    ).padStart(2, '0');
    document.getElementById('session-type').textContent =
        tipoSessao === 'foco' ? 'foco' : 'pausa';
    document.getElementById('ciclos-completos').textContent = ciclosCompletos;
}

function contar() {
    if (tempoRestante > 0) {
        tempoRestante--;
        atualizarDisplay();
    } else {
        clearInterval(intervalo);
        estaRodando = false;
        bells.play();

        const titulo = tipoSessao === 'foco' ? 'FIM DO FOCO!' : 'FIM DA PAUSA!';
        const corpo =
            tipoSessao === 'foco'
                ? 'Hora de Pausar.'
                : 'Hora de Voltar ao foco!';
        exibirNotificacao(titulo, corpo);

        tipoSessao = tipoSessao === 'foco' ? 'pausa' : 'foco';
        if (tipoSessao === 'foco') ciclosCompletos++;
        tempoRestante = modos[modoAtual][tipoSessao];
        atualizarDisplay();
        iniciarTimer();
    }
}

function iniciarTimer() {
    if (estaRodando) return;
    intervalo = setInterval(contar, 1000);
    estaRodando = true;
    btnStart.disabled = true;
    btnPause.disabled = false;
}

function pausarTimer() {
    clearInterval(intervalo);
    intervalo = null;
    estaRodando = false;
    btnStart.disabled = false;
    btnPause.disabled = true;
}

function reiniciarTimer() {
    pausarTimer();
    tipoSessao = 'foco';
    ciclosCompletos = 0;
    tempoRestante = modos[modoAtual][tipoSessao];
    atualizarDisplay();
    btnStart.disabled = false;
    btnPause.disabled = true;
}

function trocarModo(novoModo) {
    pausarTimer();
    modoAtual = novoModo;
    tipoSessao = 'foco';
    ciclosCompletos = 0;
    tempoRestante = modos[modoAtual][tipoSessao];
    atualizarDisplay();

    modoBotoes.forEach((btn) => btn.classList.remove('active'));
    const btnId =
        novoModo === 'pomodoro' ? 'pomodoro-mode' : 'long-pomodoro-mode';
    document.getElementById(btnId).classList.add('active');
}

atualizarDisplay();
