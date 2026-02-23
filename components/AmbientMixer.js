class AmbientMixer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        // 신뢰할 수 있는 GitHub 오픈 소스 기반의 MP3 리소스로 전면 교체
        this.sounds = [
            { id: 'rain', label: 'Soft Rain', url: 'https://raw.githubusercontent.com/Anuj-Kumar-Sharma/Zen-Mode/main/public/sounds/rain.mp3' },
            { id: 'wind', label: 'Soft Wind', url: 'https://raw.githubusercontent.com/Anuj-Kumar-Sharma/Zen-Mode/main/public/sounds/wind.mp3' },
            { id: 'forest', label: 'Nature Ambient', url: 'https://raw.githubusercontent.com/Anuj-Kumar-Sharma/Zen-Mode/main/public/sounds/forest.mp3' },
            { id: 'waves', label: 'Deep Ocean', url: 'https://raw.githubusercontent.com/Anuj-Kumar-Sharma/Zen-Mode/main/public/sounds/waves.mp3' }
        ];
        this.audioElements = {};
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                .mixer-grid { display: grid; grid-template-columns: 1fr; gap: 1.2rem; }
                .sound-control {
                    display: flex; align-items: center; gap: 1.5rem;
                    background: oklch(100% 0 0 / 0.02); padding: 1rem 1.5rem;
                    border-radius: 20px; border: 1px solid oklch(100% 0 0 / 0.05);
                    transition: all 0.5s ease;
                }
                .label { flex: 1; font-size: 0.85rem; font-weight: 300; letter-spacing: 0.05em; color: var(--text-secondary); }
                input[type="range"] { 
                    width: 100px; accent-color: var(--accent-forest); cursor: pointer; 
                    opacity: 0.3; transition: opacity 0.3s;
                }
                input[type="range"]:hover { opacity: 0.8; }
                .play-pause {
                    background: none; border: none; color: var(--text-primary); cursor: pointer;
                    opacity: 0.3; transition: all 0.3s; display: flex; align-items: center;
                    padding: 8px; border-radius: 50%;
                }
                .play-pause.active { opacity: 1; color: var(--accent-forest); background: oklch(100% 0 0 / 0.05); }
                .play-pause svg { pointer-events: none; }
            </style>
            <div class="mixer-grid">
                ${this.sounds.map(sound => `
                    <div class="sound-control">
                        <div class="label">${sound.label}</div>
                        <input type="range" min="0" max="1" step="0.01" value="0.5" class="volume-slider" data-id="${sound.id}">
                        <button class="play-pause" data-id="${sound.id}" aria-label="Play ${sound.label}">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
        this.setupEventListeners();
    }

    // 오디오 객체 생성 및 에러 처리 (클릭 시에만 호출됨)
    getOrCreateAudio(id) {
        if (!this.audioElements[id]) {
            const sound = this.sounds.find(s => s.id === id);
            const audio = new Audio();
            
            // CORS 에러 방지를 위해 crossOrigin 설정을 제거하거나 기본값으로 둡니다.
            audio.src = sound.url;
            audio.loop = true;
            
            // 볼륨 설정
            const slider = this.shadowRoot.querySelector(`.volume-slider[data-id="${id}"]`);
            audio.volume = slider ? slider.value : 0.5;

            // 상세 에러 로그 출력 (경고창 대신 콘솔에 출력하여 방해 최소화)
            audio.onerror = (e) => {
                console.error(`사운드 로드 실패 (${sound.label}):`, e);
            };

            this.audioElements[id] = audio;
        }
        return this.audioElements[id];
    }

    setupEventListeners() {
        this.shadowRoot.querySelectorAll('.play-pause').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                this.toggleSound(id, btn);
            };
        });

        this.shadowRoot.querySelectorAll('.volume-slider').forEach(slider => {
            slider.oninput = (e) => {
                const id = slider.dataset.id;
                if (this.audioElements[id]) {
                    this.audioElements[id].volume = e.target.value;
                }
            };
        });
    }

    toggleSound(id, btn) {
        const audio = this.getOrCreateAudio(id);

        if (audio.paused) {
            // 버튼 클릭 시에만 재생 시작
            audio.play().then(() => {
                btn.classList.add('active');
                btn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
            }).catch(err => {
                console.warn("재생 실패 (브라우저 정책):", err);
            });
        } else {
            // 정지
            audio.pause();
            btn.classList.remove('active');
            btn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
        }
    }
}
customElements.define('ambient-mixer', AmbientMixer);
