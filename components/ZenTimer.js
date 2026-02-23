class ZenTimer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.modes = {
            focus: { label: 'Focus', time: 25 * 60 },
            shortBreak: { label: 'Rest', time: 5 * 60 },
            longBreak: { label: 'Deep Rest', time: 15 * 60 }
        };
        this.currentMode = 'focus';
        this.timeLeft = this.modes.focus.time;
        this.timerId = null;
        this.isRunning = false;
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        const totalTime = this.modes[this.currentMode].time;
        const progress = ((totalTime - this.timeLeft) / totalTime) * 100;
        const dashOffset = 880 - (880 * progress) / 100;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    text-align: center;
                }
                .timer-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 3rem;
                }
                .modes {
                    display: flex;
                    gap: 1.5rem;
                }
                .mode-btn {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: 300;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    padding: 0.5rem 0;
                    border-bottom: 1px solid transparent;
                    transition: all 0.5s ease;
                    opacity: 0.5;
                }
                .mode-btn.active {
                    opacity: 1;
                    color: var(--accent-forest);
                    border-bottom: 1px solid var(--accent-forest);
                }
                .display {
                    position: relative;
                    width: 280px;
                    height: 280px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                svg {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    transform: rotate(-90deg);
                }
                circle {
                    fill: none;
                    stroke-width: 4;
                    stroke-linecap: round;
                }
                .bg-circle {
                    stroke: oklch(100% 0 0 / 0.03);
                }
                .progress-circle {
                    stroke: var(--accent-forest);
                    stroke-dasharray: 880;
                    stroke-dashoffset: ${dashOffset};
                    transition: stroke-dashoffset 1s linear, stroke 1s ease;
                    filter: drop-shadow(0 0 8px var(--accent-forest));
                }
                .time {
                    font-size: 4.5rem;
                    font-weight: 200;
                    letter-spacing: -0.02em;
                    color: var(--text-primary);
                    font-variant-numeric: tabular-nums;
                }
                .controls {
                    display: flex;
                    gap: 3rem;
                    align-items: center;
                }
                .main-btn {
                    background: none;
                    color: var(--text-primary);
                    border: 1px solid var(--border-color);
                    padding: 0.8rem 3rem;
                    border-radius: 40px;
                    font-size: 1rem;
                    font-weight: 300;
                    letter-spacing: 0.05em;
                    cursor: pointer;
                    transition: all 0.4s ease;
                    backdrop-filter: blur(5px);
                }
                .main-btn:hover {
                    background: oklch(100% 0 0 / 0.05);
                    border-color: var(--accent-forest);
                }
                .reset-btn {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    opacity: 0.4;
                    transition: opacity 0.4s;
                }
                .reset-btn:hover {
                    opacity: 0.8;
                }
            </style>
            <div class="timer-container">
                <div class="modes">
                    ${Object.entries(this.modes).map(([key, mode]) => `
                        <button class="mode-btn ${this.currentMode === key ? 'active' : ''}" data-mode="${key}">
                            ${mode.label}
                        </button>
                    `).join('')}
                </div>
                <div class="display">
                    <svg viewBox="0 0 300 300">
                        <circle class="bg-circle" cx="150" cy="150" r="140"></circle>
                        <circle class="progress-circle" cx="150" cy="150" r="140"></circle>
                    </svg>
                    <div class="time">${formattedTime}</div>
                </div>
                <div class="controls">
                    <button class="reset-btn" id="reset" title="Reset">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                    </button>
                    <button class="main-btn" id="start-stop">
                        ${this.isRunning ? 'PAUSE' : 'START'}
                    </button>
                    <div style="width: 20px"></div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.shadowRoot.querySelectorAll('.mode-btn').forEach(btn => {
            btn.onclick = () => this.setMode(btn.dataset.mode);
        });

        const startStopBtn = this.shadowRoot.getElementById('start-stop');
        if (startStopBtn) {
            startStopBtn.onclick = () => this.toggleTimer();
        }

        const resetBtn = this.shadowRoot.getElementById('reset');
        if (resetBtn) {
            resetBtn.onclick = () => this.resetTimer();
        }
    }

    setMode(mode) {
        this.stopTimer();
        this.currentMode = mode;
        this.timeLeft = this.modes[mode].time;
        this.dispatchEvent(new CustomEvent('modechange', { detail: { mode }, bubbles: true, composed: true }));
        this.render();
    }

    toggleTimer() {
        if (this.isRunning) {
            this.stopTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.timerId = setInterval(() => {
            if (this.timeLeft > 0) {
                this.timeLeft--;
                this.updateDisplay();
            } else {
                this.stopTimer();
                this.handleTimerEnd();
            }
        }, 1000);
        
        const btn = this.shadowRoot.getElementById('start-stop');
        if (btn) btn.textContent = 'PAUSE';
    }

    stopTimer() {
        this.isRunning = false;
        clearInterval(this.timerId);
        const btn = this.shadowRoot.getElementById('start-stop');
        if (btn) btn.textContent = 'START';
    }

    resetTimer() {
        this.stopTimer();
        this.timeLeft = this.modes[this.currentMode].time;
        this.render();
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        const timeDisplay = this.shadowRoot.querySelector('.time');
        if (timeDisplay) timeDisplay.textContent = formattedTime;
        
        const totalTime = this.modes[this.currentMode].time;
        const progress = ((totalTime - this.timeLeft) / totalTime) * 100;
        const dashOffset = 880 - (880 * progress) / 100;
        const progressCircle = this.shadowRoot.querySelector('.progress-circle');
        if (progressCircle) progressCircle.style.strokeDashoffset = dashOffset;
    }

    handleTimerEnd() {
        // Simple visual feedback instead of intrusive alert
        const timeDisplay = this.shadowRoot.querySelector('.time');
        if (timeDisplay) {
            timeDisplay.style.color = 'var(--accent-focus)';
            setTimeout(() => { timeDisplay.style.color = 'var(--text-primary)'; }, 3000);
        }
    }
}

customElements.define('zen-timer', ZenTimer);
