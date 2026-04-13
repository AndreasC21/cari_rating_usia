let currentPage = 1;
let totalPages = 1;
let searchTimeout = null;

function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadAllGames(1);
    }, 400);
}

// Restore search session on page load
window.addEventListener('load', function() {
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
    document.getElementById('results').innerHTML = '<div class="loading">⏳ Memuat games...</div>';
    currentPage = page;
    
    const query = document.getElementById('searchInput').value;
    const ratingFilter = document.getElementById('ratingFilter').value;
    const sortFilter = document.getElementById('sortFilter').value;

    try {
        let url = `/api/games?page=${page}`;
        if (query.trim()) {
            url += `&query=${encodeURIComponent(query)}`;
        }
        if (ratingFilter) {
            url += `&rating=${encodeURIComponent(ratingFilter)}`;
        }
        if (sortFilter) {
            url += `&sort=${encodeURIComponent(sortFilter)}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();

        displayResults(data.games, query);
        displayPagination(data.currentPage, data.pages);
        
        let statsMsg = `Total: ${data.total} games`;
        if (query.trim()) statsMsg += ` untuk pencarian "${query}"`;
        if (ratingFilter) statsMsg += ` (Rating: ${ratingFilter})`;
        document.getElementById('stats').innerHTML = statsMsg;

        // Save search session
        sessionStorage.setItem('searchSession', JSON.stringify({
            query: query,
            rating: ratingFilter,
            sort: sortFilter,
            currentPage: data.currentPage
        }));
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('results').innerHTML = '<div class="no-results">❌ Terjadi kesalahan saat memuat games</div>';
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
