export const themes = {
    blue: {
        primary: '#1479BC',
        secondary: '#6DACD5',
        accent: '#2EABFF',
        hover: '#49a8e7',
        border: '#D3ECFC',
        boxShadow: 'rgba(0, 0, 0, 0.445)',
        commitBox: '#6DACD5',
        recentBox: '#6DACD5',
        leaderboardBox: '#6DACD5',
        text: '#1479BC',
        buttonBg: '#2EABFF',
        buttonHover: '#1479BC'
    },
    yellow: {
        primary: '#E6B800',
        secondary: '#FFD633',
        accent: '#FFCC00',
        hover: '#FFE066',
        border: '#FFF5CC',
        boxShadow: 'rgba(0, 0, 0, 0.445)',
        commitBox: '#FFD633',
        recentBox: '#FFD633',
        leaderboardBox: '#FFD633',
        text: '#E6B800',
        buttonBg: '#FFCC00',
        buttonHover: '#E6B800'
    },
    green: {
        primary: '#2ECC71',
        secondary: '#82E0AA',
        accent: '#58D68D',
        hover: '#A9DFBF',
        border: '#E8F8F5',
        boxShadow: 'rgba(0, 0, 0, 0.445)',
        commitBox: '#82E0AA',
        recentBox: '#82E0AA',
        leaderboardBox: '#82E0AA',
        text: '#2ECC71',
        buttonBg: '#58D68D',
        buttonHover: '#2ECC71'
    },
    orange: {
        primary: '#E67E22',
        secondary: '#F5B041',
        accent: '#F39C12',
        hover: '#FAD7A0',
        border: '#FEF5E7',
        boxShadow: 'rgba(0, 0, 0, 0.445)',
        commitBox: '#F5B041',
        recentBox: '#F5B041',
        leaderboardBox: '#F5B041',
        text: '#E67E22',
        buttonBg: '#F39C12',
        buttonHover: '#E67E22'
    },
    purple: {
        primary: '#8E44AD',
        secondary: '#BB8FCE',
        accent: '#A569BD',
        hover: '#D2B4DE',
        border: '#F4ECF7',
        boxShadow: 'rgba(0, 0, 0, 0.445)',
        commitBox: '#BB8FCE',
        recentBox: '#BB8FCE',
        leaderboardBox: '#BB8FCE',
        text: '#8E44AD',
        buttonBg: '#A569BD',
        buttonHover: '#8E44AD'
    },
    red: {
        primary: '#E74C3C',
        secondary: '#F1948A',
        accent: '#EC7063',
        hover: '#F5B7B1',
        border: '#FDEDEC',
        boxShadow: 'rgba(0, 0, 0, 0.445)',
        commitBox: '#F1948A',
        recentBox: '#F1948A',
        leaderboardBox: '#F1948A',
        text: '#E74C3C',
        buttonBg: '#EC7063',
        buttonHover: '#E74C3C'
    }
};

export const getThemeFromPicture = (picturePath) => {
    if (!picturePath) return themes.blue;
    
    if (picturePath.includes('blue')) return themes.blue;
    if (picturePath.includes('yellow')) return themes.yellow;
    if (picturePath.includes('green')) return themes.green;
    if (picturePath.includes('orange')) return themes.orange;
    if (picturePath.includes('purple')) return themes.purple;
    if (picturePath.includes('red')) return themes.red;
    
    return themes.blue; // Default fallback
};

export const applyTheme = (theme) => {
    document.documentElement.style.setProperty('--primary-color', theme.primary);
    document.documentElement.style.setProperty('--secondary-color', theme.secondary);
    document.documentElement.style.setProperty('--accent-color', theme.accent);
    document.documentElement.style.setProperty('--hover-color', theme.hover);
    document.documentElement.style.setProperty('--border-color', theme.border);
    document.documentElement.style.setProperty('--box-shadow', theme.boxShadow);
    document.documentElement.style.setProperty('--commit-box-color', theme.commitBox);
    document.documentElement.style.setProperty('--recent-box-color', theme.recentBox);
    document.documentElement.style.setProperty('--leaderboard-box-color', theme.leaderboardBox);
    document.documentElement.style.setProperty('--text-color', theme.text);
    document.documentElement.style.setProperty('--commit-button-bg', theme.buttonBg);
    document.documentElement.style.setProperty('--commit-button-hover', theme.buttonHover);
};