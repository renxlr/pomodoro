if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('/pomodoro/sw.js', { scope: '/pomodoro/' })
        .then(() => console.log('Service Worker registrado!'))
        .catch((err) => console.error('Erro ao registrar SW:', err));
}

import { solicitarPermissao, exibirNotificacao } from './notification.js';

const modos = {
    pomodoro: { foco: 25 * 60, pausa: 50 * 60 },
    longPomodoro: { foco: 50 * 60, pausa: 10 * 60 },
};

let modoAtual = 'pomodoro';
let tipoSessao = 'foco';
let ciclosCompletos = 1;
let tempoRestante = modos[modoAtual][tipoSessao];
let intervalo = null;
let estaRodando = false;
let autoBreak = localStorage.getItem('autoBreak') === 'true';

const btnSettings = document.querySelector('.settings-btn');
const settingsPanel = document.querySelector('#settingsPanel');
const personalizePanel = document.getElementById('personalizePanel');
const btnStart = document.getElementById('start-btn');
const btnPause = document.getElementById('pause-btn');
const btnReset = document.getElementById('reset-btn');
const modoBotoes = document.querySelectorAll('.mode-button');
const bells = new Audio('./assets/happy-bell-alert.wav');

document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', () => solicitarPermissao(), {
        once: true,
    });
});

const autoBreakCheckbox = document.getElementById('auto-break');

if (autoBreakCheckbox) {
    autoBreakCheckbox.checked = autoBreak;

    autoBreakCheckbox.addEventListener('change', () => {
        autoBreak = autoBreakCheckbox.checked;
        localStorage.setItem('autoBreak', autoBreak);
    });
}

const editSessionsPanel = document.getElementById('editSessionsPanel');
document.getElementById('btn-voltar-sessoes').addEventListener('click', () => {
    editSessionsPanel.classList.remove('open');
    settingsPanel.classList.add('open');
});

btnSettings.addEventListener('click', () => {
    settingsPanel.classList.toggle('open');
    editSessionsPanel.classList.remove('open');
    personalizePanel.classList.remove('open');
});
btnStart.addEventListener('click', iniciarTimer);
btnPause.addEventListener('click', pausarTimer);
btnPause.disabled = true;
btnReset.addEventListener('click', reiniciarTimer);

document
    .getElementById('btn-editar-sessoes')
    .addEventListener('click', abrirEditarSessoes);

document
    .getElementById('btn-salvar-sessoes')
    .addEventListener('click', salvarSessoes);

document
    .getElementById('btn-resetar-sessoes')
    .addEventListener('click', resetarSessoes);

document
    .getElementById('btn-personalizar')
    .addEventListener('click', abrirPersonalizar);

document.getElementById('btn-tarefas').addEventListener('click', abrirTarefas);

document
    .getElementById('pomodoro-mode')
    .addEventListener('click', () => trocarModo('pomodoro'));
document
    .getElementById('long-pomodoro-mode')
    .addEventListener('click', () => trocarModo('longPomodoro'));

function atualizarTitulo() {
    let minutos = Math.floor(tempoRestante / 60);
    let segundos = tempoRestante % 60;

    const textoSessao = tipoSessao === 'foco' ? 'Foco' : 'Pausa';

    document.title = `${String(minutos).padStart(2, '0')}:${String(
        segundos
    ).padStart(2, '0')} — ${textoSessao}`;
}

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

    atualizarTitulo();
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

        if (tipoSessao === 'foco') {
            ciclosCompletos++;
        }

        tempoRestante = modos[modoAtual][tipoSessao];
        atualizarDisplay();

        if (autoBreak) {
            iniciarTimer();
        } else {
            btnStart.disabled = false;
            btnPause.disabled = true;
        }
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
    const confirmar = confirm(`Reiniciar a sessão de ${tipoSessao === 'foco' ? 'foco' : 'pausa'}?`);
    if (!confirmar) return;
    pausarTimer();
    tempoRestante = modos[modoAtual][tipoSessao];
    atualizarDisplay();
    btnStart.disabled = false;
    btnPause.disabled = true;
}

function trocarModo(novoModo) {
    pausarTimer();
    modoAtual = novoModo;
    tipoSessao = 'foco';
    ciclosCompletos = 1;
    tempoRestante = modos[modoAtual][tipoSessao];
    atualizarDisplay();

    modoBotoes.forEach((btn) => btn.classList.remove('active'));
    const btnId =
        novoModo === 'pomodoro' ? 'pomodoro-mode' : 'long-pomodoro-mode';
    document.getElementById(btnId).classList.add('active');

    if (modoAtual === 'pomodoro') {
        document.getElementById('input-foco').value = modos['pomodoro'].foco / 60
        document.getElementById('input-pausa').value = modos['pomodoro'].pausa / 60
    } else {
        document.getElementById('input-foco').value = modos['longPomodoro'].foco / 60
        document.getElementById('input-pausa').value = modos['longPomodoro'].pausa / 60
    }

    atualizarCores();
}

function atualizarCores() {
    const circle = document.querySelector('.app-circle');
    circle.classList.remove('pomodoro', 'modo-long');

    if (modoAtual === 'pomodoro') {
        circle.classList.add('pomodoro');
    } else if (modoAtual === 'longPomodoro') {
        circle.classList.add('modo-long');
    }
}

function abrirEditarSessoes() {
    settingsPanel.classList.remove('open');
    editSessionsPanel.classList.add('open');
}

function salvarSessoes() {
    const focoInput = Number(document.getElementById('input-foco').value);
    const pausaInput = Number(document.getElementById('input-pausa').value);

    if (focoInput <= 0 || pausaInput <= 0) {
        alert('Por favor, insira valores positivos para foco e pausa.');
        return;
    }

    modos[modoAtual].foco = focoInput * 60;
    modos[modoAtual].pausa = pausaInput * 60;

    const botaoAtivo = document.querySelector('.mode-button.active');
    if (botaoAtivo) {
        const spanTempo = botaoAtivo.querySelector('.time-value');
        spanTempo.textContent = `${String(focoInput)}/${String(pausaInput)}`;

        const sessoesInput = document.getElementById('input-sessoes').value;
        document.getElementById('total-ciclos').textContent = sessoesInput;
    }

    pausarTimer();
    tipoSessao = 'foco';
    tempoRestante = modos[modoAtual][tipoSessao];
    atualizarDisplay();
}

function resetarSessoes() {
    modos['pomodoro'].foco = 25 * 60;
    modos['pomodoro'].pausa = 5 * 60;
    modos['longPomodoro'].foco = 50 * 60;
    modos['longPomodoro'].pausa = 10 * 60;

    tempoRestante = modos[modoAtual][tipoSessao];
    pausarTimer();
    atualizarDisplay();

    const botaoAtivo = document.querySelector('.mode-button.active');
    if (botaoAtivo) {
        const spanTempo = botaoAtivo.querySelector('.time-value');
        spanTempo.textContent = `${modos[modoAtual].foco / 60}/${modos[modoAtual].pausa / 60}`;
    }

    document.getElementById('input-foco').value = modos[modoAtual].foco / 60;
    document.getElementById('input-pausa').value = modos[modoAtual].pausa / 60;
    document.getElementById('input-sessoes').value = 4;
    document.getElementById('total-ciclos').textContent = 4;
}

const btnDark = document.getElementById('btn-darkmode');
const iconDark = document.getElementById('icon-darkmode');

if (localStorage.getItem('tema') === 'dark') {
    document.body.classList.add('dark');
    iconDark.src = './assets/sun.png';
}

btnDark.addEventListener('click', () => {
    document.body.classList.toggle('dark');

    const darkAtivo = document.body.classList.contains('dark');

    iconDark.src = darkAtivo ? './assets/sun.png' : './assets/moon.png';

    localStorage.setItem('tema', darkAtivo ? 'dark' : 'light');
});

function abrirPersonalizar() {
    settingsPanel.classList.remove('open');
    editSessionsPanel.classList.remove('open');
    personalizePanel.classList.add('open');
}

document
    .getElementById('btn-voltar-personalizar')
    .addEventListener('click', () => {
        personalizePanel.classList.remove('open');
        settingsPanel.classList.add('open');
    });

function abrirTarefas() {
    alert('Funcionalidade de tarefas em desenvolvimento!');
}

atualizarDisplay();

console.log('made with love by renxlr');
