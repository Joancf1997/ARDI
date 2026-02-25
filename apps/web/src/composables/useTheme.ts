import { ref } from 'vue';

const isDark = ref(false);
const THEME_KEY = 'theme-preference';

// Apply initial state
const initTheme = () => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) {
        isDark.value = saved === 'dark';
    } else {
        isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    applyTheme();
};

const applyTheme = () => {
    if (isDark.value) {
        document.documentElement.classList.add('my-app-dark');
    } else {
        document.documentElement.classList.remove('my-app-dark');
    }
};

// Initialize on module load
initTheme();

export function useTheme() {
    const toggleTheme = () => {
        isDark.value = !isDark.value;
        applyTheme();
        localStorage.setItem(THEME_KEY, isDark.value ? 'dark' : 'light');
    };

    return {
        isDark,
        toggleTheme
    };
}
