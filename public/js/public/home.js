document.addEventListener('DOMContentLoaded', () => {

    loadFeatured();

    loadRecentComics();
    loadPopularComics();
    loadTopComics();

    loadPopularCharacters();

});


/**
 * ============================
 * HERO / FEATURED (NETFLIX STYLE)
 * ============================
 */

let featured = [];
let current = 0;
let featuredTimer = null;
let isChanging = false;

function loadFeatured() {

    fetch(`${API_BASE}/public/comics?limit=8&order=recent`)
        .then(r => r.json())
        .then(data => {

            featured = data.data || [];

            if (!featured.length) return;

            renderFeatured(0);
            startFeaturedAutoSlide();

        });
}


/**
 * AUTO SLIDER
 */
function startFeaturedAutoSlide() {

    clearInterval(featuredTimer);

    featuredTimer = setInterval(() => {

        nextFeatured();

    }, 7000);

}

function nextFeatured() {

    if (isChanging) return;

    current++;

    if (current >= featured.length)
        current = 0;

    renderFeatured(current, true);
}


/**
 * RENDER COM FADE
 */
function renderFeatured(index, animate = false) {

    const comic = featured[index];
    if (!comic) return;

    const section = document.querySelector(".featured");
    const backdrop = document.querySelector(".featured-backdrop");
    const cover = document.getElementById("featuredCover");

    // ativa estado de transição (CSS cuida do resto)
    if (animate) {
        section.classList.add("is-changing");
        cover.classList.add("is-changing");
    }

    // troca dados imediatamente (sem delay quebrado)
    backdrop.style.backgroundImage = `url(${
        comic.cover
            ? BASE_URL + comic.cover
            : '/assets/img/placeholder-comic.png'
    })`;

    cover.src = comic.cover
    ? BASE_URL + comic.cover
    : '/assets/img/placeholder-comic.png';

    cover.onerror = () => {
        cover.onerror = null;
        cover.src = '/assets/img/placeholder-comic.png';
    };

    const issue = (
    comic.display_issue &&
    comic.display_issue !== 'Edição Única'
)
    ? ` ${comic.display_issue}`
    : '';

    document.getElementById("featuredTitle").textContent =
        `${comic.title}${issue}`;

    document.getElementById("featuredMeta").innerHTML = `
        <span class="badge bg-warning text-dark">
            ★ ${(comic.average_rating || 0).toFixed(1)}
        </span>

        <span class="ms-2">
            ${comic.publisher_name || ''}
        </span>

        <span class="ms-2">
            ${comic.year || ''}
        </span>
    `;

    document.getElementById("featuredDescription").innerHTML =
        comic.synopsis || '';

    document.getElementById("featuredButton").href =
        Routes.comic(comic);

    renderFeaturedThumbs(index);

    // remove animação depois de um tempo fixo (limpo e previsível)
    if (animate) {
        setTimeout(() => {
            section.classList.remove("is-changing");
            cover.classList.remove("is-changing");
        }, 300);
    }
}


/**
 * THUMBNAILS
 */
function renderFeaturedThumbs(activeIndex) {

    const placeholder = '/assets/img/placeholder-comic.png';

    const thumbs = document.getElementById("featuredThumbs");

    thumbs.innerHTML = featured.map((c, i) => `

        <div class="featured-thumb ${i === activeIndex ? 'active' : ''}"
             onclick="goToFeatured(${i})">

            <img
                src="${c.cover ? BASE_URL + c.cover : placeholder}"
                onerror="this.onerror=null;this.src='${placeholder}'"
                alt="${c.title}">

        </div>

    `).join("");

}


/**
 * CLICK THUMB
 */
function goToFeatured(index) {

    current = index;

    renderFeatured(index, true);

    startFeaturedAutoSlide(); // reinicia timer (UX Netflix)
}


/**
 * NEXT / PREV BUTTONS
 */
document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("featuredNext")
        ?.addEventListener("click", () => nextFeatured());

    document.getElementById("featuredPrev")
        ?.addEventListener("click", () => {

            if (isChanging) return;

            current--;

            if (current < 0)
                current = featured.length - 1;

            renderFeatured(current, true);

            startFeaturedAutoSlide();

        });

});


/**
 * ============================
 * CARD
 * ============================
 */
function createComicCard(comic) {

    const rating = comic.average_rating || 0;
    const percent = Math.round((rating / 5) * 100);

    return `

        <div class="comic-card-home position-relative"
             onclick="location.href='${Routes.comic(comic)}'"
             style="min-width:160px">

            <div class="rating-circle"
                 data-percent="${percent}">

                <svg viewBox="0 0 36 36">

                    <path class="circle-bg"
                        d="M18 2
                           a 16 16 0 0 1 0 32
                           a 16 16 0 0 1 0 -32"/>

                    <path class="circle-progress"
                        stroke-dasharray="${percent}, 100"
                        d="M18 2
                           a 16 16 0 0 1 0 32
                           a 16 16 0 0 1 0 -32"/>

                </svg>

                <div class="circle-text">
                    ${rating.toFixed(1)}
                </div>

            </div>

            <img src="${BASE_URL}${comic.cover}"
                 class="comic-cover w-100"
                 loading="lazy"
                 onerror="this.src='/assets/img/placeholder-comic.png'">

            <div class="p-2">

                <div style="font-size:0.9rem">

                    ${comic.title}

                    ${comic.display_issue
            ? (
                comic.display_issue === 'Edição Única'
                    ? `<span class="badge bg-warning text-dark ms-1">Edição Única</span>`
                    : ` ${comic.display_issue}`
            )
            : ''
        }

                </div>

            </div>

        </div>

    `;
}

function applyRatingColors() {

    document.querySelectorAll('.rating-circle')
        .forEach(circle => {

            const percent =
                parseInt(circle.dataset.percent);

            const progress =
                circle.querySelector('.circle-progress');

            if (percent >= 70)
                progress.style.stroke = '#21d07a';

            else if (percent >= 40)
                progress.style.stroke = '#d2d531';

            else
                progress.style.stroke = '#db2360';

        });

}


/**
 * ============================
 * RECENTES
 * ============================
 */
function loadRecentComics() {

    fetch(`${API_BASE}/public/comics?limit=12&order=recent`)
        .then(res => res.json())
        .then(response => {

            const comics = Array.isArray(response)
                ? response
                : response.data;

            const grid = document.getElementById('recentGrid');

            if (!grid || !comics) return;

            grid.innerHTML =
                comics.map(createComicCard).join('');
            applyRatingColors();

        })
        .catch(console.error);

}


/**
 * ============================
 * POPULARES
 * ============================
 */
function loadPopularComics() {

    fetch(`${API_BASE}/public/comics?limit=12&order=popular`)
        .then(res => res.json())
        .then(response => {

            const comics = Array.isArray(response)
                ? response
                : response.data;

            const grid = document.getElementById('popularGrid');

            if (!grid || !comics) return;

            grid.innerHTML =
                comics.map(createComicCard).join('');
            applyRatingColors();

        })
        .catch(console.error);

}


/**
 * ============================
 * TOP
 * ============================
 */
function loadTopComics() {

    fetch(`${API_BASE}/public/comics?limit=12&order=rating`)
        .then(res => res.json())
        .then(response => {

            const comics = Array.isArray(response)
                ? response
                : response.data;

            const grid = document.getElementById('topGrid');

            if (!grid || !comics) return;

            grid.innerHTML =
                comics.map(createComicCard).join('');
            applyRatingColors();

        })
        .catch(console.error);

}


/**
 * ============================
 * PERSONAGENS POPULARES
 * ============================
 */
function loadPopularCharacters() {

    fetch(`${API_BASE}/public/characters?limit=12`)
        .then(res => res.json())
        .then(response => {

            const characters = Array.isArray(response)
                ? response
                : response.data;

            const grid = document.getElementById('charactersGrid');

            if (!grid || !characters) return;

            grid.innerHTML = characters.map(c => `

                <div class="comic-card-home"
                     onclick="location.href='${Routes.character(c)}'"
                     style="min-width:160px">

                    <img src="${BASE_URL}${c.image}"
                         class="comic-cover w-100"
                         loading="lazy"
                         onerror="this.src='/assets/img/placeholder-character.png'">

                    <div class="p-2">

                        <div style="font-size:0.9rem">
                           <strong> ${c.alias}</strong>
                        </div>

                        <small class="text-white">
                            ${c.publisher_name || ''}
                        </small>

                    </div>

                </div>

            `).join('');

        })
        .catch(console.error);

}