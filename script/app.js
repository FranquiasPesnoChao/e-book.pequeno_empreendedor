(() => {
    const root = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const sepiaToggle = document.getElementById('sepia-toggle');
    const voiceToggle = document.getElementById('voice-toggle');
    const tocLinks = document.querySelectorAll('#toc a[href^="#"]');
    const sections = document.querySelectorAll('main section');
    const paragraphs = document.querySelectorAll('main section p');
    const storage = window.localStorage;
    const session = window.sessionStorage;

    class ThemeManager {
        constructor() {
            this.baseKey = 'base-theme';
            this.themeKey = 'theme';
            this.init();
            this.attach();
        }
        init() {
            const saved = storage.getItem(this.themeKey);
            const defaultTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            this.base = storage.getItem(this.baseKey) || defaultTheme;
            this.apply(saved || this.base);
        }
        apply(theme) {
            root.setAttribute('data-theme', theme);
            storage.setItem(this.themeKey, theme);
            themeToggle.setAttribute('aria-checked', theme === 'dark');
            themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
            sepiaToggle.setAttribute('aria-checked', theme === 'sepia');
            sepiaToggle.textContent = theme === 'sepia' ? '🔘' : '🟤';
        }
        toggleTheme() {
            const current = root.getAttribute('data-theme');
            if (current === 'sepia') {
                this.apply(this.base);
            } else {
                const next = current === 'dark' ? 'light' : 'dark';
                this.base = next;
                storage.setItem(this.baseKey, this.base);
                this.apply(next);
            }
        }
        toggleSepia() {
            const current = root.getAttribute('data-theme');
            if (current === 'sepia') {
                this.apply(this.base);
            } else {
                this.base = current;
                storage.setItem(this.baseKey, this.base);
                this.apply('sepia');
            }
        }
        attach() {
            themeToggle.addEventListener('click', () => this.toggleTheme());
            sepiaToggle.addEventListener('click', () => this.toggleSepia());
        }
    }

    class VoiceManager {
        constructor() {
            this.synth = window.speechSynthesis;
            this.voices = [];
            this.queue = [];
            this.index = 0;
            this.reading = false;
            this.loadVoices();
            this.synth.onvoiceschanged = () => this.loadVoices();
            this.attach();
        }
        loadVoices() {
            this.voices = this.synth.getVoices() || [];
        }
        pickVoice() {
            return this.voices.find(v => v.lang === 'pt-BR' && v.name.toLowerCase().includes('luciana')) ||
                this.voices.find(v => v.lang.startsWith('pt-BR')) ||
                this.voices[0] || null;
        }
        start() {
            if (this.reading) return;
            this.queue = Array.from(paragraphs).map(p => {
                const ut = new SpeechSynthesisUtterance(p.textContent);
                ut.voice = this.pickVoice();
                ut.lang = 'pt-BR';
                ut.rate = 1;
                ut.pitch = 1;
                ut.onend = () => this.next();
                return ut;
            });
            if (!this.queue.length) return;
            this.reading = true;
            this.index = 0;
            voiceToggle.setAttribute('aria-checked', 'true');
            voiceToggle.textContent = '⏹️';
            this.synth.speak(this.queue[0]);
        }
        next() {
            this.index++;
            if (this.index < this.queue.length && this.reading) {
                this.synth.speak(this.queue[this.index]);
            } else {
                this.stop();
            }
        }
        stop() {
            this.synth.cancel();
            this.reading = false;
            this.index = 0;
            this.queue = [];
            voiceToggle.setAttribute('aria-checked', 'false');
            voiceToggle.textContent = '🎤';
        }
        attach() {
            voiceToggle.addEventListener('click', () => this.reading ? this.stop() : this.start());
        }
    }

    class ScrollObserver {
        constructor() {
            this.observer = new IntersectionObserver(this.onObserve.bind(this), {
                threshold: 0.25
            });
            sections.forEach(s => this.observer.observe(s));
            tocLinks.forEach(link => {
                link.addEventListener('click', e => {
                    e.preventDefault();
                    const id = link.getAttribute('href').slice(1);
                    const target = document.getElementById(id);
                    if (target) {
                        window.scrollTo({
                            top: target.offsetTop - 20,
                            behavior: 'smooth'
                        });
                        history.pushState(null, '', `#${id}`);
                    }
                });
            });
            setTimeout(() => sections.forEach(s => s.classList.add('visible')), 100);
        }
        onObserve(entries) {
            entries.forEach(({
                target,
                isIntersecting
            }) => {
                const link = document.querySelector(`#toc a[href="#${target.id}"]`);
                if (link) link.classList.toggle('active', isIntersecting);
                target.classList.toggle('visible', isIntersecting);
            });
        }
    }

    class ScrollMemory {
        constructor() {
            window.addEventListener('beforeunload', () => session.setItem('scrollPos', window.scrollY));
            const pos = session.getItem('scrollPos');
            if (pos) window.scrollTo(0, +pos);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        new ThemeManager();
        new VoiceManager();
        new ScrollObserver();
        new ScrollMemory();

        const backToTop = document.getElementById('back-to-top');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });
        backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    });
})();