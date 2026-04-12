
        async function loadGameDetail() {
            try {
                // Get game ID dari URL
                const params = new URLSearchParams(window.location.search);
                const gameId = params.get('id');

                if (!gameId) {
                    document.getElementById('content').innerHTML = '<div class="error">âŒ Game ID tidak ditemukan</div>';
                    return;
                }

                const response = await fetch(`/api/game/${gameId}`);
                if (!response.ok) {
                    throw new Error('Game tidak ditemukan');
                }

                const game = await response.json();
                displayGameDetail(game);
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('content').innerHTML = `<div class="error">âŒ ${error.message}</div>`;
            }
        }

        function displayGameDetail(game) {
            const name = game.name || game.title || 'Tidak ada judul';
            const author = game.publisherName || game.developerName || '';
            const description = game.description || 'Tidak ada deskripsi tersedia';
            const gameId = game.id || game._id;

            let html = `
                <div class="top-banner">
                    <div class="banner-container">
                        <button class="back-btn" onclick="history.back()">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                            Kembali
                        </button>
                        <img id="gameCoverImage" src="" class="hero-banner-image" alt="${escapeHtml(name)}" data-fetched="false">
                        <h1 class="game-title" style="margin-top: 10px;">${escapeHtml(name)}</h1>
                        ${author ? `<div class="game-publisher">${escapeHtml(author)}</div>` : ''}
                    </div>
                </div>

                <div class="store-belt">
                    <div style="color: #A1A1AA; font-size: 0.95em;">IGRS ID: ${gameId}</div>
                    <a href="https://igrs.id/game-detail/${gameId}" target="_blank" class="igrs-link-button" style="margin-top: 0; padding: 8px 20px; font-size: 0.9em;">Buka di IGRS.id â†—</a>
                </div>

                <div class="content-container">
                    <div class="main-content">
                        <h2 class="section-title">Tentang Gim Ini</h2>
                        <div class="description-text">
                            ${escapeHtml(description)}
                        </div>
                        
                        <div id="screenshotGallery" style="display:none; margin-top: 40px; margin-bottom: 40px;">
                            <h2 class="section-title">Screenshots</h2>
                            <div class="gallery-wrapper">
                                <button class="scroll-btn scroll-left" onclick="scrollGallery(-1)" aria-label="Geser Kiri">â®</button>
                                <div class="screenshots-container" id="screenshotsContainer"></div>
                                <button class="scroll-btn scroll-right" onclick="scrollGallery(1)" aria-label="Geser Kanan">â¯</button>
                            </div>
                        </div>

                        ${getRatingsExplanation(game)}
                    </div>

                    <div class="side-panels">
                        ${getUnifiedRatingCard(game)}
                        ${getInfoCard(game)}
                    </div>
                </div>
            `;

            document.getElementById('content').innerHTML = html;

            // Load Game Cover Asynchronously after rendering
            const coverImg = document.getElementById('gameCoverImage');
            if (coverImg) fetchGameCover(coverImg, name);
        }

        function getUnifiedRatingCard(game) {
            let platformHtml = '';
            if (game.platformsName && game.platformsName.length > 0) {
                const platforms = game.platformsName.map(p => escapeHtml(p.trim())).join(', ');
                platformHtml = `
                    <div style="margin-bottom: 40px;">
                        <div style="font-weight: 600; font-size: 1.2em; color: #FFFFFF; margin-bottom: 12px; letter-spacing: -0.01em;">Platforms</div>
                        <div style="font-size: 1.05em; color: #A1A1AA;">${platforms}</div>
                    </div>
                `;
            }

            let ratingHtml = '';
            if (game.ratings && game.ratings.length > 0) {
                const rating = game.ratings[0];
                let ratingName = rating.name || rating.titleId || 'Belum dinilai';
                let displayRatingName = ratingName === 'RC' ? 'Konten Terlarang' : ratingName;

                let ratingIcon = '';
                if (rating && rating.img) {
                    const imgPath = rating.img.replace(/\\/g, '/');
                    ratingIcon = `<img src="https://igrs.id/${imgPath}" alt="${displayRatingName}" style="display: block; width: 100px; height: auto; object-fit: contain; background: white; padding: 4px; border-radius: 4px;">`;
                } else if (ratingName) {
                    const ratingImages = {
                        '3+': '/images/ratings/3.png',
                        '7+': '/images/ratings/7.png',
                        '13+': '/images/ratings/13.png',
                        '15+': '/images/ratings/15.png',
                        '18+': '/images/ratings/18.png',
                        'RC': '/images/ratings/rc.png'
                    };
                    const imgSrc = ratingImages[ratingName] || '/images/ratings/3plus.svg';
                    ratingIcon = `<img src="${imgSrc}" alt="${displayRatingName}" style="display: block; width: 100px; height: auto; object-fit: contain; background: white; padding: 4px; border-radius: 4px;" onerror="this.parentElement.innerHTML='<div style=\\'color:#FFF;font-weight:bold;\\'>${escapeHtml(displayRatingName)}</div>'">`;
                }

                let regularDescriptors = [];
                let interactiveDescriptors = [];

                if (game.descriptors && game.descriptors.length > 0) {
                    game.descriptors.forEach(desc => {
                        const name = escapeHtml(desc.nameId || desc.nameEn || 'Unknown');
                        const lName = name.toLowerCase();
                        if (lName.includes('interaksi') || lName.includes('pembelian') || lName.includes('internet') || lName.includes('lokasi')) {
                            interactiveDescriptors.push(name);
                        } else {
                            regularDescriptors.push(name);
                        }
                    });
                } else if (game.descId || game.descEn) {
                    const dText = escapeHtml(game.descId || game.descEn);
                    if (dText) regularDescriptors.push(dText);
                }

                let allDescriptors = [...regularDescriptors, ...interactiveDescriptors];
                let combinedDescStr = allDescriptors.length > 0 ? allDescriptors.join(', ') : '';
                
                let descLayout = '';
                if (combinedDescStr) {
                    descLayout = `
                        <div style="color: #A1A1AA; font-size: 1.05em; line-height: 1.6;">
                            ${combinedDescStr}
                        </div>
                    `;
                }

                ratingHtml = `
                    <div style="display: flex; gap: 24px; align-items: flex-start;">
                        <div style="flex-shrink: 0; width: 100px;">
                            ${ratingIcon}
                        </div>
                        <div style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column; justify-content: flex-start; padding-top: 4px;">
                            ${descLayout}
                        </div>
                    </div>
                `;
            } else if (game.descriptors && game.descriptors.length > 0) {
                const descriptorsText = game.descriptors.map(d => escapeHtml(d.nameId || d.nameEn)).join(', ');
                ratingHtml = `
                    <div style="color: #FFFFFF; font-size: 1.05em; line-height: 1.6;">
                        ${descriptorsText}
                    </div>
                `;
            }

            return `
                <div class="side-card" style="padding-top: 8px;">
                    ${platformHtml}
                    ${ratingHtml}
                </div>
            `;
        }

        function getRatingsExplanation(game) {
            if (!game.ratings || game.ratings.length === 0) return '';

            let ratingsHTML = `
                <div class="rating-reasons-container">
                    <h3 style="color: #FFFFFF; font-size: 1.4em; font-weight: 700; margin-bottom: 8px;">Mengapa mendapat rating ini?</h3>
            `;
            
            // --- Custom ESRB Style Summary ---
            const firstRating = game.ratings[0];
            const ratingName = firstRating.name || firstRating.titleId || 'Belum dinilai';
            const gameName = game.name || game.title || 'Gim ini';
            let descriptorsText = '';
              let summaryParagraph = '';
              
              if (game.descriptors && game.descriptors.length > 0) {
                  descriptorsText = game.descriptors.map(d => (d.nameId || d.nameEn).toLowerCase()).join(', ');
            } else if (game.descId || game.descEn) {
                descriptorsText = (game.descId || game.descEn).toLowerCase();
            }

            if (descriptorsText && ratingName) {
                summaryParagraph = `<strong>${escapeHtml(gameName)}</strong> diklasifikasikan untuk usia <strong>${escapeHtml(ratingName)}</strong> oleh IGRS karena memuat unsur utama berupa <em>${escapeHtml(descriptorsText)}</em>. `;
            }
            // ------------------------------------

            game.ratings.forEach(rating => {
                let ratingName = rating.name || rating.titleId || 'Belum dinilai';
                if (ratingName === 'RC') ratingName = 'Konten Terlarang';
                
                const ratingTitle = rating.titleId || ratingName;
                const content = rating.contentId || rating.contentEn || '';
            

                ratingsHTML += `
                    <div class="rating-reason-card">
                        <div class="rating-reason-header">
                            <span>${escapeHtml(ratingName)} - ${escapeHtml(ratingTitle)}</span>
                        </div>
                        <div class="rating-reason-content">
                            ${summaryParagraph ? `<div style="margin-bottom: 12px;">${summaryParagraph}</div>` : ''}
                            ${formatRatingContent(content, game.name || game.title)}
                        </div>
                    </div>
                `;
            });

            ratingsHTML += `
                </div>
            `;

            return ratingsHTML;
        }

        function formatRatingContent(content, gameName) {
            if (!content) return 'Tidak ada penjelasan detail yang tersedia untuk kategori ini.';

            const name = gameName ? gameName : 'ini';

            // Ubah format list panjang bernomor menjadi paragraf text utuh yang lebih mengalir
            let cleanText = content.replace(/\n\d+\.\s*/g, ' ').replace(/^\d+\.\s*/, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
            
            // Parafrase kalimat baku IGRS agar lebih mengalir dan kasual bak ulasan:
            cleanText = cleanText
                // Menghilangkan intro kriteria yang terlalu panjang
                .replace(/Kriteria konten gim untuk umur \d+ tahun keatas \(\d+\+\)\s?/i, `Gim ${name} diperuntukkan untuk kelompok usia ini dengan pertimbangan: `)
                .replace(/Boleh\s+/gi, '') // Hilangkan kata "Boleh " yang bikin rancu
                
                // --- KONTEN TERLARANG (RC) ---
                .replace(/Rating RC adalah rating untuk gim yang mengandung konten terlarang\. Adapun kriteria konten pada suatu gim yang dapat membuat gim mendapatkan rating ini mencakup dari:?/gi, `Gim ${name} dilarang beredar luas karena terindikasi muatan negatif akut, seperti: `)
                .replace(/(Memuat|Menampilkan)[^.]*?pornografi\.?/gi, 'Pasti mengandung pornografi eksplisit. ')
                .replace(/Memiliki kegiatan permainan.*?\(cash out\)\.?/gi, 'Terdapat celah perjudian uang/aset sungguhan. ')
                .replace(/Melanggar ketentuan peraturan perundang-undangan di Indonesia\.?/gi, 'Melanggar undang-undang hukum di Indonesia. ')

                // --- YANG BERSIH ("Tidak menampilkan...") ---
                .replace(/Tidak menampilkan tulisan atau gambar yang berhubungan dengan rokok.*?(zat adiktif lainnya)\.?/gi, 'Bebas dari konten rokok, alkohol, atau obat terlarang. ')
                .replace(/Tidak menampilkan darah, mutilasi, dan\/atau kanibalisme\.?/gi, 'Sama sekali tidak ada visual sadis/berdarah. ')
                .replace(/Tidak menampilkan tokoh menyerupai manusia yang memperlihatkan alat vital, payudara, dan\/atau bokong\.?/gi, 'Karakternya berpakaian sopan (bebas ketelanjangan). ')
                .replace(/Tidak (mengandung|menampilkan) horor yang berusaha menimbulkan perasaan ngeri dan\/atau takut yang amat sangat\.?/gi, 'Bebas dari elemen horor atau mistis seram. ')
                .replace(/Tidak memiliki (fasilitas )?interaksi dalam jaringan berupa percakapan\.?/gi, 'Tanpa fitur obrolan/chat online. ')
                .replace(/Tidak mengandung simulasi dan\/atau kegiatan judi\.?/gi, 'Bebas dari segala jenis perjudian. ')
                .replace(/Tidak memuat pornografi\.?/gi, 'Bersih dari muatan pornografi. ')
                .replace(/Tidak menggunakan bahasa kasar, umpatan, dan\/atau humor dewasa\.?/gi, 'Bahasa sangat aman (tanpa umpatan/candaan vulgar). ')
                .replace(/Tidak menampilkan kekerasan\.?/gi, 'Sama sekali tidak ada unsur kekerasan. ')

                // --- UNTUK USIA 7+, 13+, 15+, 18+ (YANG MENGANDUNG / MENAMPILKAN) ---
                
                // Kekerasan & Sadisme
                .replace(/Menampilkan kekerasan pada tokoh animasi yang dapat menyerupai manusia\.?/gi, 'Hanya berisi kekerasan kartun atau laga aksi animasi. ')
                .replace(/Menampilkan kekerasan pada tokoh yang menyerupai manusia tetapi tidak menyerupai kekerasan dalam kehidupan nyata\.?/gi, 'Ada pertarungan/kekerasan pada karakter manusia, tapi wujudnya fiksi/fantasi. ')
                .replace(/Menampilkan kekerasan animasi atau khayal berskala sedang.*?(agresif)\.?/gi, 'Kekerasan tarungnya masih di level menengah. ')
                .replace(/Menampilkan adegan kekerasan yang (tidak )?menimbulkan kemarahan dan\/atau sadis\.?/gi, function(match, p1) { return p1 ? 'Ada adegan kekerasan fisik, namun tidak terlalu brutal/sadis. ' : 'Menampilkan kekerasan tingkat tinggi yang intens. '; })
                .replace(/Menampilkan (darah|kekerasan).*?(menimbulkan kemarahan|sadis).*?\.?/gi, 'Sangat sarat kekerasan brutal dan sadis. ')
                .replace(/(Menampilkan|Mengandung) unsur atau konten darah, mutilasi, dan\/atau kanibalisme\.?/gi, 'Berisi visual darah, mutilasi, daging manusia, atau adegan gore ekstrim. ')
                .replace(/Menampilkan darah, mutilasi, dan\/atau kanibalisme\.?/gi, 'Menampilkan adegan ekstrim berdarah, mutilasi, atau gore. ')

                // Zat Adiktif (Rokok, Minuman, Narkotika)
                .replace(/Memuat gambar atau properti terkait rokok.*?(zat adiktif lainnya)\.?/gi, 'Menampilkan rokok, alkohol, atau benda terlarang sebagai properti visual. ')
                .replace(/Menampilkan tulisan atau gambar yang berhubungan dengan rokok.*?(zat adiktif lainnya)\.?/gi, 'Memuat gambar atau teks terkait rokok, alkohol, maupun obat terlarang. ')
                .replace(/Menampilkan tokoh.*yang menggunakan.*?(rokok).*?(zat adiktif lainnya)\.?/gi, 'Karakter terlihat mengonsumsi rokok, alkohol, atau obat-obatan. ')

                // Seksualitas & Ketelanjangan
                .replace(/Menampilkan tokoh menyerupai manusia yang memperlihatkan sebagian anggota tubuh seperti alat vital, payudara, dan\/atau bokong\.?/gi, 'Ada karakter berpakaian minim atau ketat yang mengekspos bentuk tubuh. ')
                .replace(/Menampilkan tokoh menyerupai manusia tetapi tidak memperlihatkan alat vital, payudara, atau bokong\.?/gi, 'Ada karakter berpakaian terbuka, tapi tanpa mengekspos secara eksplisit area sensitif. ')
                .replace(/Menampilkan (kegiatan|aktivitas) seksual\.?/gi, 'Menampilkan tema dan nuansa interaksi seksual eksplisit. ')
                .replace(/Pakaian karakter beserta peralatannya menampilkan lekuk tubuh, payudara, dan\/atau bokong\.?/gi, 'Desain pakaian karakternya menonjolkan lekuk kemolekan tubuh. ')

                // Horor
                .replace(/Mengandung horor yang (tidak )?berusaha menimbulkan perasaan ngeri.*?(amat sangat)\.?/gi, function(match, p1) { return p1 ? 'Ada nuansa horor/mistis ringan yang sekadar kaget-mengagetkan. ' : 'Menampilkan nuansa horor yang kental, mencekam, dan sangat menyeramkan. '; })

                // Bahasa Kasar & Perjudian & Interaksi
                .replace(/Menampilkan produk Berfokus pada elemen horor/gi, 'Berfokus pada elemen horor')
                .replace(/Mengandung unsur humor dewasa yang berkonotasi seksual\.?/gi, 'Sering menggunakan lelucon khas orang dewasa berbau seksual. ')
                .replace(/Menggunakan bahasa kasar, umpatan, dan\/atau humor dewasa\.?/gi, 'Mengandung umpatan, kata-kata kasar, atau candaan vulgar yang jelas bagi orang dewasa. ')
                .replace(/Memperlihatkan kegiatan permainan yang didasarkan pada peruntungan belaka.*?(alat pembayaran yang sah)\.?/gi, 'Mengandung konten atau mekanisme mini-game serupa judi/kasino, namun tidak menggunakan uang asli. ')
                .replace(/Mengandung simulasi dan\/atau kegiatan judi\.?/gi, 'Mendukung permainan atau simulasi taruhan\/perjudian. ')
                .replace(/Menyediakan fasilitas interaksi dalam jaringan berupa percakapan\.?/gi, 'Pemain dapat berinteraksi langsung (chat\/suara) secara daring. ')
                .replace(/Memiliki fasilitas interaksi dalam jaringan berupa percakapan\.?/gi, 'Menyediakan fitur live-chat\/obrolan bersama para pemain daring. ')

                // Hapus pengubah dan pembersih titik/spasi agar kalimat indah
                .replace(/\s+/g, ' ')
                .replace(/,\./g, '.')
                .replace(/\.{2,}/g, '.')
                .trim();
            
            // Format ulang huruf besar setelah titik agar paragraf membacanya enak
            cleanText = cleanText.split('. ')
                .filter(s => s.length > 0)
                .map(sentence => sentence.charAt(0).toUpperCase() + sentence.slice(1))
                .join('. ');

            // Inject the proper bolded name without breaking escape logic
            let finalHtml = escapeHtml(cleanText);
            if (gameName) {
                // Re-bold the raw game name text if it exists
                let escapedName = escapeHtml(gameName);
                let regexName = new RegExp(`Gim ${escapedName}`, 'g');
                finalHtml = finalHtml.replace(regexName, `Gim <strong style="font-size: 1.05em; color: #fff;">${escapedName}</strong>`);
            }

            return `
                <span>${finalHtml}</span>
            `;
        }

        function getInfoCard(game) {
            let infoRows = '';

            if (game.releaseYear) {
                infoRows += `
                    <div class="info-row">
                        <div class="info-label">Tahun Rilis</div>
                        <div class="info-value">${escapeHtml(String(game.releaseYear))}</div>
                    </div>
                `;
            }

            if (game.publisherName) {
                infoRows += `
                    <div class="info-row">
                        <div class="info-label">Penerbit</div>
                        <div class="info-value">${escapeHtml(game.publisherName)}</div>
                    </div>
                `;
            }

            if (game.developerName) {
                infoRows += `
                    <div class="info-row">
                        <div class="info-label">Developer</div>
                        <div class="info-value">${escapeHtml(game.developerName)}</div>
                    </div>
                `;
            }

            if (game.price) {
                infoRows += `
                    <div class="info-row">
                        <div class="info-label">Harga</div>
                        <div class="info-value">${escapeHtml(game.price)}</div>
                    </div>
                `;
            }

            if (game.language) {
                infoRows += `
                    <div class="info-row">
                        <div class="info-label">Bahasa</div>
                        <div class="info-value">${escapeHtml(game.language)}</div>
                    </div>
                `;
            }

            if (!infoRows) return '';

            return `
                <div class="side-card">
                    <div class="info-divider"></div>
                    <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 12px;">
                        ${infoRows}
                    </div>
                </div>
            `;
        }

        function scrollGallery(direction) {
            const container = document.getElementById('screenshotsContainer');
            if (container) {
                const scrollAmount = 336; // 320px lebar gambar + 16px gap
                container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
            }
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        async function fetchGameCover(imgElement, gameName) {
            try {
                const response = await fetch(`/api/game-assets?name=${encodeURIComponent(gameName)}`);
                const data = await response.json();
                
                if (data.success) {
                    imgElement.src = data.cover;
                    imgElement.style.display = 'block';
                    imgElement.style.border = 'none';

                    if (data.source === 'steam') {
                        imgElement.style.objectFit = 'cover';
                    }

                    // Tampilkan screenshots
                    if (data.screenshots && data.screenshots.length > 0) {
                        const galleryArea = document.getElementById('screenshotGallery');
                        const screenContainer = document.getElementById('screenshotsContainer');
                        
                        let screenHtml = '';
                        data.screenshots.forEach(url => {
                            screenHtml += `<img src="${escapeHtml(url)}" class="screenshot-img" onclick="window.open(this.src, '_blank')" alt="Screenshot Game" />`;
                        });
                        
                        screenContainer.innerHTML = screenHtml;
                        galleryArea.style.display = 'block';
                    }
                    return;
                }
                
                // Pakai generate thumbnail jika tidak ketemu
                imgElement.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(gameName)}&background=333333&color=FFFFFF&size=256&font-size=0.33&length=2`;
                imgElement.style.display = 'block';
                
            } catch (error) {
                imgElement.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(gameName)}&background=333333&color=FFFFFF&size=256&font-size=0.33&length=2`;
                imgElement.style.display = 'block';
            }
        }

        // Load game detail saat page selesai
        window.addEventListener('DOMContentLoaded', loadGameDetail);
    
