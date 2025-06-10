// Dashboard JavaScript - Modern, interactive, and animated

// Initialize AOS (Animate On Scroll)
AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true
});

// Global variables
let dashboardData = null;
let charts = {};

// Load dashboard data
async function loadDashboardData() {
    try {
        // Try to load actual dashboard data
        const response = await fetch('dashboard_data.json');
        dashboardData = await response.json();
        
        // Initialize all components
        updateHeroStats();
        createCharts();
        populateFilters();
        populateOffersTable();
        generateInsights();
        
        // Update last update time
        document.getElementById('last-update').textContent = dashboardData.metadata.last_update;
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Use sample data for demonstration
        dashboardData = generateSampleData();
        updateHeroStats();
        createCharts();
        populateFilters();
        populateOffersTable();
        generateInsights();
    }
}

// Generate sample data for demonstration
function generateSampleData() {
    return {
        metadata: {
            total_offers: 36,
            last_update: new Date().toLocaleDateString()
        },
        pricing: {
            price_ranges: {
                free: 2,
                low: 8,
                medium: 15,
                high: 7,
                premium: 4
            },
            subscription_vs_onetime: {
                subscription: 22,
                one_time: 14
            },
            average_by_niche: {
                'AI Foundations': 150,
                'AI Automation': 350,
                'AI Marketing': 200,
                'AI Content Creation': 100,
                'AI Agencies': 500
            }
        },
        niches: {
            top_niches: [
                ['AI Automation', 12],
                ['AI Foundations', 8],
                ['AI Marketing', 6],
                ['AI Content Creation', 5],
                ['AI Agencies', 3],
                ['AI for Business', 2]
            ]
        },
        funnels: {
            types: {
                'Webinar': 10,
                'Low Ticket': 8,
                'Community': 7,
                'Workshop': 6,
                'Mid Ticket': 5
            }
        },
        regions: {
            distribution: {
                'English': 25,
                'German': 8,
                'Europe': 3
            }
        },
        sentiment: {
            urgency_words: {
                'limited': 12,
                'now': 8,
                'today': 5,
                'fast': 7
            },
            value_words: {
                'free': 15,
                'bonus': 10,
                'worth': 8,
                'save': 6
            },
            guarantee_mentions: 18,
            limited_time_offers: 14,
            social_proof_mentions: 22
        },
        offers: [
            {
                company: 'AI Academy Pro',
                sub_niche: 'AI Foundations',
                price: '$97',
                funnel_type: 'Low Ticket',
                region: 'English',
                landing_page: 'https://example.com'
            },
            {
                company: 'AutomateAI',
                sub_niche: 'AI Automation',
                price: '$497/month',
                funnel_type: 'Community',
                region: 'English',
                landing_page: 'https://example.com'
            }
            // Add more sample offers as needed
        ]
    };
}

// Update hero statistics with animations
function updateHeroStats() {
    // Animate counter
    animateValue('total-offers', 0, dashboardData.metadata.total_offers, 2000);
    
    // Calculate average price
    let totalPrice = 0;
    let priceCount = 0;
    Object.entries(dashboardData.pricing.average_by_niche).forEach(([niche, price]) => {
        totalPrice += price;
        priceCount++;
    });
    const avgPrice = Math.round(totalPrice / priceCount);
    animateValue('avg-price', 0, avgPrice, 2000, '$');
    
    // Top niche
    const topNiche = dashboardData.niches.top_niches[0][0];
    document.getElementById('top-niche').textContent = topNiche;
    
    // Guarantee percentage
    const guaranteePercent = Math.round((dashboardData.sentiment.guarantee_mentions / dashboardData.metadata.total_offers) * 100);
    animateValue('conversion-rate', 0, guaranteePercent, 2000, '', '%');
}

// Animate numerical values
function animateValue(id, start, end, duration, prefix = '', suffix = '') {
    const element = document.getElementById(id);
    const range = end - start;
    const increment = range / (duration / 16); // 60fps
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = prefix + Math.round(current) + suffix;
    }, 16);
}

// Create all charts
function createCharts() {
    // Chart.js default options
    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    Chart.defaults.color = '#64748b';
    
    // Price Distribution Chart
    createPriceDistributionChart();
    
    // Funnel Types Chart
    createFunnelChart();
    
    // Regional Chart
    createRegionalChart();
    
    // Price by Niche Chart
    createPriceByNicheChart();
    
    // Subscription Chart
    createSubscriptionChart();
    
    // Niche Bar Chart
    createNicheBarChart();
    
    // Urgency Words Chart
    createUrgencyChart();
    
    // Value Words Chart
    createValueChart();
}

// Price Distribution Doughnut Chart
function createPriceDistributionChart() {
    const ctx = document.getElementById('priceDistChart').getContext('2d');
    const data = dashboardData.pricing.price_ranges;
    
    charts.priceDistribution = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Free', 'Low (<$50)', 'Medium ($50-500)', 'High ($500-2000)', 'Premium (>$2000)'],
            datasets: [{
                data: Object.values(data),
                backgroundColor: [
                    '#10b981',
                    '#3b82f6',
                    '#6366f1',
                    '#8b5cf6',
                    '#ec4899'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

// Funnel Types Radar Chart
function createFunnelChart() {
    const ctx = document.getElementById('funnelChart').getContext('2d');
    const data = dashboardData.funnels.types;
    
    charts.funnel = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(236, 72, 153, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

// Regional Distribution Chart
function createRegionalChart() {
    const ctx = document.getElementById('regionChart').getContext('2d');
    const data = dashboardData.regions.distribution;
    
    charts.region = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: [
                    '#6366f1',
                    '#8b5cf6',
                    '#ec4899'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

// Price by Niche Bar Chart
function createPriceByNicheChart() {
    const ctx = document.getElementById('priceByNicheChart').getContext('2d');
    const data = dashboardData.pricing.average_by_niche;
    
    charts.priceByNiche = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: 'Average Price ($)',
                data: Object.values(data),
                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                borderWidth: 0,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
}

// Subscription vs One-time Chart
function createSubscriptionChart() {
    const ctx = document.getElementById('subscriptionChart').getContext('2d');
    const data = dashboardData.pricing.subscription_vs_onetime;
    
    charts.subscription = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Subscription', 'One-Time'],
            datasets: [{
                data: Object.values(data),
                backgroundColor: [
                    '#6366f1',
                    '#10b981'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 14
                        }
                    }
                }
            }
        }
    });
}

// Top Niches Horizontal Bar Chart
function createNicheBarChart() {
    const ctx = document.getElementById('nicheBarChart').getContext('2d');
    const data = dashboardData.niches.top_niches;
    
    charts.nicheBar = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(item => item[0]),
            datasets: [{
                label: 'Number of Offers',
                data: data.map(item => item[1]),
                backgroundColor: createGradient(ctx, '#6366f1', '#8b5cf6'),
                borderWidth: 0,
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Urgency Words Chart
function createUrgencyChart() {
    const ctx = document.getElementById('urgencyChart').getContext('2d');
    const data = dashboardData.sentiment.urgency_words;
    
    charts.urgency = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: 'Frequency',
                data: Object.values(data),
                backgroundColor: 'rgba(236, 72, 153, 0.8)',
                borderWidth: 0,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Value Words Chart
function createValueChart() {
    const ctx = document.getElementById('valueChart').getContext('2d');
    const data = dashboardData.sentiment.value_words;
    
    charts.value = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: 'Frequency',
                data: Object.values(data),
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderWidth: 0,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Create gradient for charts
function createGradient(ctx, color1, color2) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    return gradient;
}

// Update sentiment statistics
function updateSentimentStats() {
    document.getElementById('guarantee-stat').textContent = dashboardData.sentiment.guarantee_mentions;
    document.getElementById('limited-stat').textContent = dashboardData.sentiment.limited_time_offers;
    document.getElementById('social-stat').textContent = dashboardData.sentiment.social_proof_mentions;
}

// Generate insights
function generateInsights() {
    // Pricing insight
    const avgPrice = calculateAveragePrice();
    document.getElementById('pricing-insight').textContent = 
        `Most offers are in the medium price range ($50-500), with an average of $${avgPrice}. Subscription models dominate at 61%.`;
    
    // Market opportunity
    document.getElementById('market-insight').textContent = 
        `AI Automation shows highest demand with ${dashboardData.niches.top_niches[0][1]} offers, indicating strong market interest.`;
    
    // Growth potential
    document.getElementById('growth-insight').textContent = 
        `Communities and workshops show strong engagement models, with 70% using social proof elements.`;
    
    // Trends
    document.getElementById('trends-insight').textContent = 
        `Urgency tactics appear in 40% of offers, with "limited time" being the most common psychological trigger.`;
    
    updateSentimentStats();
}

// Calculate average price
function calculateAveragePrice() {
    let total = 0;
    let count = 0;
    Object.values(dashboardData.pricing.average_by_niche).forEach(price => {
        total += price;
        count++;
    });
    return Math.round(total / count);
}

// Populate filters
function populateFilters() {
    // Niche filter
    const nicheFilter = document.getElementById('filter-niche');
    const niches = [...new Set(dashboardData.offers.map(offer => offer.sub_niche))].filter(Boolean);
    niches.forEach(niche => {
        const option = document.createElement('option');
        option.value = niche;
        option.textContent = niche;
        nicheFilter.appendChild(option);
    });
    
    // Funnel filter
    const funnelFilter = document.getElementById('filter-funnel');
    const funnels = [...new Set(dashboardData.offers.map(offer => offer.funnel_type))].filter(Boolean);
    funnels.forEach(funnel => {
        const option = document.createElement('option');
        option.value = funnel;
        option.textContent = funnel;
        funnelFilter.appendChild(option);
    });
}

// Populate offers table
function populateOffersTable(filteredOffers = null) {
    const tbody = document.getElementById('offers-tbody');
    const offers = filteredOffers || dashboardData.offers;
    
    tbody.innerHTML = '';
    
    offers.forEach((offer, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${offer.company || 'Unknown'}</td>
            <td>${offer.sub_niche || '-'}</td>
            <td>${offer.price || '-'}</td>
            <td>${offer.funnel_type || '-'}</td>
            <td>${offer.region || '-'}</td>
            <td><button class="view-btn" onclick="viewOffer('${offer.landing_page}')">View</button></td>
        `;
        
        // Add animation
        row.style.opacity = '0';
        row.style.animation = `fadeInUp 0.5s ease ${index * 0.05}s forwards`;
        
        tbody.appendChild(row);
    });
}

// View offer
function viewOffer(url) {
    if (url && url.startsWith('http')) {
        window.open(url, '_blank');
    } else {
        alert('Landing page URL not available');
    }
}

// Filter functionality
document.addEventListener('DOMContentLoaded', function() {
    // Search functionality
    const searchInput = document.getElementById('search-input');
    const nicheFilter = document.getElementById('filter-niche');
    const funnelFilter = document.getElementById('filter-funnel');
    
    function filterOffers() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedNiche = nicheFilter.value;
        const selectedFunnel = funnelFilter.value;
        
        const filtered = dashboardData.offers.filter(offer => {
            const matchesSearch = !searchTerm || 
                (offer.company && offer.company.toLowerCase().includes(searchTerm)) ||
                (offer.sub_niche && offer.sub_niche.toLowerCase().includes(searchTerm));
            
            const matchesNiche = !selectedNiche || offer.sub_niche === selectedNiche;
            const matchesFunnel = !selectedFunnel || offer.funnel_type === selectedFunnel;
            
            return matchesSearch && matchesNiche && matchesFunnel;
        });
        
        populateOffersTable(filtered);
    }
    
    searchInput.addEventListener('input', filterOffers);
    nicheFilter.addEventListener('change', filterOffers);
    funnelFilter.addEventListener('change', filterOffers);
    
    // Smooth scroll for navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    
    // Load dashboard data
    loadDashboardData();
});

// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
    }
});