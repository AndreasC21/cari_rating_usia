let currentPage = 1;
let totalPages = 1;
// Cache DOM elements
const searchInput = document.getElementById('searchInput');
const ratingFilter = document.getElementById('ratingFilter');
const sortFilter = document.getElementById('sortFilter');
const resultsDiv = document.getElementById('results');
const statsDiv = document.getElementById('stats');

function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadAllGames(1);
    }, 400);
}

// Filter Modal Functions
function toggleFilterModal() {
    const modal = document.getElementById('filterModal');
    modal.classList.toggle('active');
    
    if (modal.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

function closeFilterOnBackdrop(event) {
    const modal = document.getElementById('filterModal');
    if (event.target === modal) {
        toggleFilterModal();
    }
}

function handleFilterChange() {
    // Close the modal and load games after small delay for smooth transition
    setTimeout(() => {
        toggleFilterModal();
        loadAllGames(1);
    }, 100);
}

// Fetch last updated timestamp from database
async function loadLastUpdatedTimestamp() {
    try {
        const response = await fetch('/api/last-updated');
        const data = await response.json();
        
        if (data.timestamp) {
            const lastUpdatedElement = document.getElementById('lastUpdated');
            if (lastUpdatedElement) {
                lastUpdatedElement.textContent = `Data diupdate terakhir tanggal ${data.timestamp}`;
            }
        }
    } catch (error) {
        console.error('Error fetching last updated:', error);
    }
}

// Restore search session on page load
window.addEventListener('load', function() {
    loadLastUpdatedTimestamp();
    
    const searchSession = sessionStorage.getItem('searchSession');
    if (searchSession) {
        const session = JSON.parse(searchSession);
        document.getElementById('searchInput').value = session.query || '';
        if (session.rating) document.getElementById('ratingFilter').value = session.rating;
        if (session.sort) document.getElementById('sortFilter').value = session.sort;
        
        loadAllGames(session.currentPage || 1);
    } else {
        loadAllGames(1);
    }
});

async function loadAllGames(page = 1) {
    if(!resultsDiv) return;
    resultsDiv.innerHTML = '<div class="loading">⏳ Memuat games...</div>';
    currentPage = page;
    
    const query = searchInput ? searchInput.value : '';
    const rating = ratingFilter ? ratingFilter.value : '';
    const sort = sortFilter ? sortFilter.value : '';

    try {
        const queryParams = new URLSearchParams({ page });
        if (query.trim()) queryParams.append('query', query.trim());
        if (rating) queryParams.append('rating', rating);
        if (sort) queryParams.append('sort', sort);
        
        const response = await fetch(`/api/games?${queryParams}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        displayResults(data.games, query);
        displayPagination(data.currentPage, data.pages);
        
        let statsMsg = `Total: ${data.total} games`;
        if (query.trim()) statsMsg += ` untuk pencarian "${escapeHtml(query)}"`;
        if (rating) statsMsg += ` (Rating: ${escapeHtml(rating)})`;
        if(statsDiv) statsDiv.innerHTML = statsMsg;

        // Save search session using fast local logic
        sessionStorage.setItem('searchSession', JSON.stringify({ query, rating, sort, currentPage: data.currentPage }));
    } catch (error) {
        console.error('Error:', error);
        resultsDiv.innerHTML = '<div class="no-results">❌ Terjadi kesalahan saat memuat games</div>';
    }
}

function displayResults(games, query = '') {
    if (!games || games.length === 0) {
        document.getElementById('results').innerHTML = `<div class="no-results">😢 Game tidak ditemukan${query ? ` untuk "${query}"` : ''}</div>`;
        document.getElementById('stats').innerHTML = '';
        return;
    }

    let html = '<div class="game-grid">';
    
    games.forEach(game => {
        const name = game.name || game.title || 'Tidak ada judul';
        const gameId = game.id;
        const developerName = escapeHtml(game.publisherName || 'Tidak Diketahui');
        const ratingBadge = game.ratings && game.ratings.length > 0 ? game.ratings[0].name || game.ratings[0].titleId : 'N/A';
        
        let ratingClass = 'rating-badge ';
        if(ratingBadge.includes('3')) ratingClass += 'rating-3';
        else if(ratingBadge.includes('7')) ratingClass += 'rating-7';
        else if(ratingBadge.includes('13')) ratingClass += 'rating-13';
        else if(ratingBadge.includes('15')) ratingClass += 'rating-15';
        else if(ratingBadge.includes('18')) ratingClass += 'rating-18';
        else if(ratingBadge.toUpperCase().includes('RC')) ratingClass += 'rating-rc';
        else ratingClass += 'rating-13'; // default fallback color

        let platforms = '-';
        if (game.platformsName && game.platformsName.length > 0) {
            platforms = game.platformsName.map(p => escapeHtml(p.trim())).join(' · ');
        }

        let year = '-';
        if (game.releaseYear) {
            year = game.releaseYear;
        } else if (game.releasedAt || game.createdAt || game.updatedAt) {
            const dateStr = game.releasedAt || game.createdAt || game.updatedAt;
            try {
                const d = new Date(dateStr);
                if (!isNaN(d.getTime())) year = d.getFullYear();
            } catch(e){}
        }

        html += `
            <a href="/detail.html?id=${gameId}" class="game-card" style="text-decoration: none;">
                <div class="game-card-main">
                    <h3>${escapeHtml(name)}</h3>
                    <div class="game-publisher">${developerName}</div>
                    <div class="game-meta">
                        <div class="meta-item">
                            <span class="meta-val">${year}</span>
                        </div>
                        <div class="meta-divider">•</div>
                        <div class="meta-item">
                            <span class="meta-val">${platforms}</span>
                        </div>
                    </div>
                </div>
                <div class="game-card-right">
                    <div class="${ratingClass}">${escapeHtml(ratingBadge)}</div>
                    <div class="game-detail-link" style="font-size: 1.2em;">→</div>
                </div>
            </a>
        `;
    });

    html += '</div>';
    document.getElementById('results').innerHTML = html;
}

function displayPagination(currentPage, totalPages) {
    if (totalPages <= 1) return;

    let html = '<div class="pagination">';

    if (currentPage > 1) {
        html += `<button onclick="loadAllGames(1)">« Awal</button>`;
        html += `<button onclick="loadAllGames(${currentPage - 1})">‹ Sebelumnya</button>`;
    }

    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
        html += `<button ${i === currentPage ? 'class="active"' : ''} onclick="loadAllGames(${i})">${i}</button>`;
    }

    if (currentPage < totalPages) {
        html += `<button onclick="loadAllGames(${currentPage + 1})">Selanjutnya ›</button>`;
        html += `<button onclick="loadAllGames(${totalPages})">Akhir »</button>`;
    }

    html += '</div>';
    document.getElementById('results').innerHTML += html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Disclaimer check & timer
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('igrs_disclaimer_accepted_v4')) {
        document.getElementById('disclaimerModal').classList.add('active');
        
        let timeLeft = 20;
        const btn = document.getElementById('btnUnderstand');
        
        const timer = setInterval(() => {
            timeLeft--;
            btn.innerText = `Saya Mengerti (${timeLeft}s)`;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                btn.innerText = "Saya Mengerti";
                btn.disabled = false;
                btn.style.background = "#ffffff";
                btn.style.color = "#000000";
                btn.style.cursor = "pointer";
            }
        }, 1000);
    }
});

function acceptDisclaimer() {
    localStorage.setItem('igrs_disclaimer_accepted_v4', 'true');
    document.getElementById('disclaimerModal').classList.remove('active');
}
