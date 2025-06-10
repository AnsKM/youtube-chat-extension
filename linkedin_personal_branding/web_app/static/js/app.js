// LinkedIn Personal Branding Dashboard - Main JavaScript

// Global app configuration
const AppConfig = {
    apiBaseUrl: '/api',
    refreshInterval: 30000, // 30 seconds
    chartColors: {
        primary: '#1E3A8A',
        secondary: '#059669',
        accent: '#F59E0B',
        gray: '#6B7280'
    }
};

// Utility Functions
const Utils = {
    // Format numbers with commas
    formatNumber: (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    // Format date to readable string
    formatDate: (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    // Show toast notification
    showToast: (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;
        
        const bgColor = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        }[type] || 'bg-blue-500';
        
        toast.className += ` ${bgColor} text-white`;
        toast.innerHTML = `
            <div class="flex items-center">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-3 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }, 5000);
    },

    // Show loading state
    showLoading: (element, text = 'Loading...') => {
        const originalContent = element.innerHTML;
        element.innerHTML = `
            <div class="flex items-center justify-center">
                <div class="loading-spinner mr-2"></div>
                ${text}
            </div>
        `;
        element.disabled = true;
        return originalContent;
    },

    // Hide loading state
    hideLoading: (element, originalContent) => {
        element.innerHTML = originalContent;
        element.disabled = false;
    },

    // Copy text to clipboard
    copyToClipboard: async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            Utils.showToast('Copied to clipboard!', 'success');
            return true;
        } catch (err) {
            console.error('Failed to copy: ', err);
            Utils.showToast('Failed to copy to clipboard', 'error');
            return false;
        }
    }
};

// API Helper Functions
const API = {
    // Generic API call function
    call: async (endpoint, options = {}) => {
        const url = `${AppConfig.apiBaseUrl}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, finalOptions);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'API call failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            Utils.showToast(`API Error: ${error.message}`, 'error');
            throw error;
        }
    },

    // Save daily log entry
    saveDailyLog: async (logData) => {
        return await API.call('/daily-log', {
            method: 'POST',
            body: JSON.stringify(logData)
        });
    },

    // Scrape LinkedIn profile
    scrapeProfile: async (token) => {
        return await API.call('/scrape-profile', {
            method: 'POST',
            body: JSON.stringify({ apify_token: token })
        });
    },

    // Generate content ideas
    generateContentIdeas: async (topic, type = 'educational', tone = 'professional') => {
        return await API.call('/content-ideas', {
            method: 'POST',
            body: JSON.stringify({ topic, type, tone })
        });
    },

    // Toggle goal completion
    toggleGoal: async (index, completed) => {
        return await API.call('/toggle-goal', {
            method: 'POST',
            body: JSON.stringify({ index, completed })
        });
    }
};

// Dashboard Functions
const Dashboard = {
    // Initialize dashboard
    init: () => {
        Dashboard.updateMetrics();
        Dashboard.initCharts();
        Dashboard.startAutoRefresh();
    },

    // Update metric cards
    updateMetrics: async () => {
        try {
            const data = await API.call('/metrics');
            
            // Update connections
            const connectionsElement = document.querySelector('[data-metric="connections"]');
            if (connectionsElement) {
                connectionsElement.textContent = Utils.formatNumber(data.connections);
            }
            
            // Update followers
            const followersElement = document.querySelector('[data-metric="followers"]');
            if (followersElement) {
                followersElement.textContent = Utils.formatNumber(data.followers);
            }
            
            // Update progress bars
            Dashboard.updateProgressBars(data);
            
        } catch (error) {
            console.error('Failed to update metrics:', error);
        }
    },

    // Update progress bars
    updateProgressBars: (data) => {
        const progressBars = document.querySelectorAll('.progress-fill');
        progressBars.forEach(bar => {
            const metric = bar.dataset.metric;
            const target = bar.dataset.target;
            const current = data[metric];
            
            if (current && target) {
                const percentage = Math.min((current / target) * 100, 100);
                bar.style.width = `${percentage}%`;
            }
        });
    },

    // Initialize charts
    initCharts: () => {
        // This would be called after Chart.js is loaded
        if (typeof Chart !== 'undefined') {
            Dashboard.createGrowthChart();
            Dashboard.createEngagementChart();
        }
    },

    // Create growth chart
    createGrowthChart: () => {
        const ctx = document.getElementById('growthChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['June', 'July', 'August', 'September', 'October', 'November', 'December'],
                datasets: [{
                    label: 'Connections',
                    data: [366, 500, 800, 1200, 2000, 3500, 5500],
                    borderColor: AppConfig.chartColors.primary,
                    backgroundColor: AppConfig.chartColors.primary + '20',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Followers',
                    data: [405, 600, 1000, 1800, 3500, 6500, 10000],
                    borderColor: AppConfig.chartColors.secondary,
                    backgroundColor: AppConfig.chartColors.secondary + '20',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    },

    // Start auto-refresh
    startAutoRefresh: () => {
        setInterval(() => {
            Dashboard.updateMetrics();
        }, AppConfig.refreshInterval);
    }
};

// Content Management Functions
const ContentManager = {
    // Generate content ideas
    generateIdeas: async (topic) => {
        const button = document.querySelector('#generateContentBtn');
        if (!button) return;

        const originalContent = Utils.showLoading(button, 'Generating...');
        
        try {
            const data = await API.generateContentIdeas(topic);
            ContentManager.displayIdeas(data.ideas);
            Utils.showToast('Content ideas generated!', 'success');
        } catch (error) {
            Utils.showToast('Failed to generate ideas', 'error');
        } finally {
            Utils.hideLoading(button, originalContent);
        }
    },

    // Display generated ideas
    displayIdeas: (ideas) => {
        const container = document.querySelector('#ideasContainer');
        if (!container) return;

        container.innerHTML = ideas.map(idea => `
            <div class="idea-card p-4 border border-gray-200 rounded-lg">
                <p class="text-sm text-gray-900">${idea}</p>
                <div class="mt-2 flex space-x-2">
                    <button onclick="ContentManager.useIdea('${idea}')" class="btn-primary text-xs">
                        Use Idea
                    </button>
                    <button onclick="ContentManager.saveIdea('${idea}')" class="btn-secondary text-xs">
                        Save
                    </button>
                </div>
            </div>
        `).join('');
    },

    // Use content idea
    useIdea: (idea) => {
        Utils.copyToClipboard(idea);
        Utils.showToast('Idea copied! Ready to create your post.', 'success');
    },

    // Save content idea
    saveIdea: (idea) => {
        // This would save to local storage or backend
        const savedIdeas = JSON.parse(localStorage.getItem('savedIdeas') || '[]');
        savedIdeas.push({ idea, timestamp: new Date().toISOString() });
        localStorage.setItem('savedIdeas', JSON.stringify(savedIdeas));
        
        Utils.showToast('Idea saved to your bank!', 'success');
    }
};

// Profile Management Functions
const ProfileManager = {
    // Scrape profile data
    scrapeProfile: async () => {
        const tokenInput = document.querySelector('#apifyToken');
        const token = tokenInput ? tokenInput.value : prompt('Enter your Apify token:');
        
        if (!token) {
            Utils.showToast('Token is required', 'warning');
            return;
        }

        const button = document.querySelector('#scrapeProfileBtn');
        const originalContent = Utils.showLoading(button, 'Scraping...');
        
        try {
            const data = await API.scrapeProfile(token);
            ProfileManager.updateProfileData(data);
            Utils.showToast('Profile data updated!', 'success');
        } catch (error) {
            Utils.showToast('Failed to scrape profile', 'error');
        } finally {
            Utils.hideLoading(button, originalContent);
        }
    },

    // Update profile data in UI
    updateProfileData: (data) => {
        // Update connections count
        const connectionsEl = document.querySelector('[data-profile="connections"]');
        if (connectionsEl && data.connections) {
            connectionsEl.textContent = Utils.formatNumber(data.connections);
        }

        // Update followers count
        const followersEl = document.querySelector('[data-profile="followers"]');
        if (followersEl && data.followers) {
            followersEl.textContent = Utils.formatNumber(data.followers);
        }

        // Update last updated timestamp
        const timestampEl = document.querySelector('[data-profile="timestamp"]');
        if (timestampEl) {
            timestampEl.textContent = `Last updated: ${Utils.formatDate(new Date())}`;
        }
    }
};

// Settings Management
const SettingsManager = {
    // Save API settings
    saveApiSettings: async () => {
        const form = document.querySelector('#apiSettingsForm');
        if (!form) return;

        const formData = new FormData(form);
        const settings = Object.fromEntries(formData);

        try {
            await API.call('/settings/api', {
                method: 'POST',
                body: JSON.stringify(settings)
            });
            Utils.showToast('API settings saved!', 'success');
        } catch (error) {
            Utils.showToast('Failed to save settings', 'error');
        }
    },

    // Test API connections
    testConnections: async () => {
        const button = document.querySelector('#testConnectionsBtn');
        const originalContent = Utils.showLoading(button, 'Testing...');

        try {
            const results = await API.call('/test-connections');
            SettingsManager.displayConnectionResults(results);
        } catch (error) {
            Utils.showToast('Connection test failed', 'error');
        } finally {
            Utils.hideLoading(button, originalContent);
        }
    },

    // Display connection test results
    displayConnectionResults: (results) => {
        const container = document.querySelector('#connectionResults');
        if (!container) return;

        container.innerHTML = Object.entries(results).map(([service, status]) => `
            <div class="flex items-center justify-between p-2 border-b">
                <span>${service}</span>
                <span class="status-badge ${status.success ? 'success' : 'error'}">
                    ${status.success ? 'Connected' : 'Failed'}
                </span>
            </div>
        `).join('');
    }
};

// Modal Management
const ModalManager = {
    // Show modal
    show: (modalId, title, content) => {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        const titleEl = modal.querySelector('.modal-title');
        const contentEl = modal.querySelector('.modal-content-body');

        if (titleEl) titleEl.textContent = title;
        if (contentEl) contentEl.innerHTML = content;

        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    },

    // Hide modal
    hide: (modalId) => {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    },

    // Hide all modals
    hideAll: () => {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
        document.body.style.overflow = 'auto';
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize dashboard if on dashboard page
    if (document.querySelector('#dashboard')) {
        Dashboard.init();
    }

    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            ModalManager.hideAll();
        }
    });

    // Handle escape key for modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            ModalManager.hideAll();
        }
    });

    // Handle form submissions
    document.addEventListener('submit', async (e) => {
        if (e.target.id === 'dailyLogForm') {
            e.preventDefault();
            await handleDailyLogSubmit(e.target);
        }
    });

    // Handle copy buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('copy-btn')) {
            const text = e.target.dataset.copy;
            Utils.copyToClipboard(text);
        }
    });
});

// Daily Log Form Handler
async function handleDailyLogSubmit(form) {
    const formData = new FormData(form);
    const data = {
        mood: formData.get('mood'),
        time_invested: formData.get('time_invested'),
        observations: formData.get('observations').split('\n').filter(obs => obs.trim()),
        tomorrow_priority: formData.get('tomorrow_priority')
    };

    try {
        await API.saveDailyLog(data);
        Utils.showToast('Daily log saved!', 'success');
        ModalManager.hideAll();
        form.reset();
    } catch (error) {
        Utils.showToast('Failed to save daily log', 'error');
    }
}

// Global functions for template usage
window.AppUtils = Utils;
window.AppAPI = API;
window.ContentManager = ContentManager;
window.ProfileManager = ProfileManager;
window.SettingsManager = SettingsManager;
window.ModalManager = ModalManager;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Utils,
        API,
        Dashboard,
        ContentManager,
        ProfileManager,
        SettingsManager,
        ModalManager
    };
}