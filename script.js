if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('/pomodoro/sw.js', { scope: '/pomodoro/' })
        .then(() => console.log('Service Worker registrado!'))
        .catch((err) => console.error('Erro ao registrar SW:', err));
}

import { solicitarPermissao, exibirNotificacao } from './notification.js';
let modoAtual = 'pomodoro';
let ciclosCompletos = 0;
let tempoRestante = 1500;
let intervalo = null;
let estaRodando = false;
const modoBotoes = document.querySelectorAll('.mode-button');
const bells = new Audio('./assets/happy-bell-alert.wav');

atualizarDisplay();
atualizarCiclosDisplay();

document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener(
        'click',
        () => {
            solicitarPermissao();
        },
        { once: true }
    );
});

const btnStart = document.getElementById('start-btn');
btnStart.addEventListener('click', iniciarTimer);

const btnPause = document.getElementById('pause-btn');
btnPause.addEventListener('click', pausarTimer);
btnPause.disabled = true;

const btnReset = document.getElementById('reset-btn');
btnReset.addEventListener('click', reiniciarTimer);

document
    .getElementById('pomodoro-mode')
    .addEventListener('click', () => trocarModo('pomodoro'));
document
    .getElementById('pausaCurta-mode')
    .addEventListener('click', () => trocarModo('pausaCurta'));
document
    .getElementById('pausaLonga-mode')
    .addEventListener('click', () => trocarModo('pausaLonga'));

const tempos = {
    pomodoro: 1500,
    pausaCurta: 300,
    pausaLonga: 900,
};

function atualizarDisplay() {
    let minutos = Math.floor(tempoRestante / 60);
    let segundos = tempoRestante % 60;

    const displayMinutos = String(minutos).padStart(2, '0');
    const displaySegundos = String(segundos).padStart(2, '0');

    document.getElementById('time-minutes').textContent = displayMinutos;
    document.getElementById('time-seconds').textContent = displaySegundos;
}

function contar() {
    if (tempoRestante > 0) {
        tempoRestante--;
        atualizarDisplay();
    } else if (tempoRestante === 0) {
        clearInterval(intervalo);
        estaRodando = false;
        tempoRestante = tempos[modoAtual];
        atualizarDisplay();

        bells.play();
        let tituloNotificacao =
            modoAtual === 'pomodoro' ? 'FIM DO FOCO!' : 'FIM DA PAUSA!';
        let corpoNotificacao =
            modoAtual === 'pomodoro' ? 'Hora de Pausar.' : 'Hora de Voltar!';
        exibirNotificacao(tituloNotificacao, corpoNotificacao);
        setTimeout(proximoModo, 1000);
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
    tempoRestante = tempos[modoAtual];
    atualizarDisplay();
    btnStart.disabled = false;

    ciclosCompletos = 0;
    atualizarCiclosDisplay();
}

function trocarModo(novoModo) {
    pausarTimer();
    modoAtual = novoModo;
    tempoRestante = tempos[novoModo];
    atualizarDisplay();

    btnStart.disabled = false;
    btnPause.disabled = true;

    const novoBotaoID = novoModo + '-mode';
    modoBotoes.forEach((btn) => {
        btn.classList.remove('active');
        if (btn.id === novoBotaoID) {
            btn.classList.add('active');
        }
    });
}

function proximoModo() {
    if (modoAtual === 'pomodoro') {
        ciclosCompletos++;
        atualizarCiclosDisplay();
        if (ciclosCompletos % 4 === 0) {
            trocarModo('pausaLonga');
        } else {
            trocarModo('pausaCurta');
        }
    } else {
        trocarModo('pomodoro');
    }
}

function atualizarCiclosDisplay() {
    document.getElementById('ciclos-completos').textContent = ciclosCompletos;
}

trocarModo(modoAtual);
