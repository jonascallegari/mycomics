// utils/render-page.js
const fs = require('fs');
const path = require('path');
const { makeSlug } = require('./slug');

function escapeAttr(str) {
    return String(str || '').replace(/"/g, '&quot;');
}

// ============================
// COMIC
// ============================

function resolveImagePath(image, folder) {
    if (!image) return null;
    if (image.startsWith('/uploads')) return `${process.env.BASE_URL}${image}`;
    if (!image.includes('/')) return `${process.env.BASE_URL}/uploads/${folder}/${image}`;
    return `${process.env.BASE_URL}/${image}`;
}

function renderComicPage(pages, comic, correctSlug) {
    let html = fs.readFileSync(path.join(pages, 'comic.html'), 'utf8');

    const issueLabel = comic.display_issue !== 'Edição Única' ? ` ${comic.display_issue}` : '';
    const title = `${comic.title}${issueLabel} | My Comics`;
    const description = (comic.synopsis || `Confira detalhes de ${comic.title}, publicado por ${comic.publisher_name || 'editora desconhecida'}.`).slice(0, 155);
    const image = comic.cover ? `${process.env.BASE_URL}${comic.cover}` : `${process.env.BASE_URL}/assets/img/placeholder-comic.png`;
    const url = `https://mycomics.com.br/quadrinho/${correctSlug}`;
    const coverAlt = escapeAttr(`Capa de ${comic.title}${issueLabel}`);

    html = html
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
        .replace(/<meta name="description"[\s\S]*?content=".*?">/, `<meta name="description" content="${description}">`)
        .replace(/<link rel="canonical"[\s\S]*?href=".*?">/, `<link rel="canonical" href="${url}">`)
        .replace(/<meta property="og:type"[\s\S]*?content=".*?">/, `<meta property="og:type" content="book">`)
        .replace(/<meta property="og:title"[\s\S]*?content=".*?">/, `<meta property="og:title" content="${title}">`)
        .replace(/<meta property="og:description"[\s\S]*?content=".*?">/, `<meta property="og:description" content="${description}">`)
        .replace(/<meta property="og:image"[\s\S]*?content=".*?">/, `<meta property="og:image" content="${image}">`)
        .replace(/<meta property="og:url"[\s\S]*?content=".*?">/, `<meta property="og:url" content="${url}">`);

    html = html
        .replace('<span id="comicTitle"></span>', `<span id="comicTitle">${comic.title}</span>`)
        .replace(
            '<div id="comicSynopsis" class="text-white synopsis-box"></div>',
            `<div id="comicSynopsis" class="text-white synopsis-box">${comic.synopsis || ''}</div>`
        )
        .replace(
            '<img id="comicCover" class="comic-image img-fluid rounded shadow">',
            `<img id="comicCover" class="comic-image img-fluid rounded shadow" alt="${coverAlt}" title="${coverAlt}">`
        );

    // === HISTÓRIAS (storiesList) ===
    if (comic.stories?.length) {
        const storiesHtml = comic.stories.map(story => {
            const chars = story.characters?.map(c => c.alias).join(', ') || '—';
            const creators = story.creators?.map(c => c.name).join(', ') || '—';
            return `
      <li class="list-group-item">
        <h6 class="mb-1">${story.title}</h6>
        <small><strong>Personagens:</strong> ${chars}</small><br>
        <small><strong>Criadores:</strong> ${creators}</small>
      </li>`;
        }).join('');

        html = html.replace(
            '<ul id="storiesList" class="list-group"></ul>',
            `<ul id="storiesList" class="list-group">${storiesHtml}</ul>`
        );
    }

    // === PERSONAGENS (charactersGrid) ===
    if (comic.characters?.length) {
        const charactersHtml = comic.characters.map(character => {
            const charSlug = makeSlug(character.id, character.alias || character.name);
            const imgSrc = resolveImagePath(character.image, 'characters') || '/assets/img/placeholder-character.png';
            const alt = escapeAttr(character.alias || character.name);
            return `
      <div class="col-6 col-md-4">
        <div class="row g-2 mb-3">
          <div class="col-4">
            <a href="/personagem/${charSlug}">
              <img src="${imgSrc}" class="img-fluid rounded-circle" alt="${alt}">
            </a>
          </div>
          <div class="col-8 align-content-center">
            <h5 class="mb-0">${character.alias || ''}</h5>
            <p class="text-muted">${character.name}</p>
          </div>
        </div>
      </div>`;
        }).join('');

        html = html.replace(
            '<div id="charactersGrid" class="row mb-2"></div>',
            `<div id="charactersGrid" class="row mb-2">${charactersHtml}</div>`
        );
    }

    // === CRIADORES (creatorsGrid) ===
    if (comic.creators?.length) {
        const creatorsHtml = comic.creators.map(creator => {
            const creatorSlug = makeSlug(creator.id, creator.name);
            const imgSrc = resolveImagePath(creator.image, 'creators') || '/assets/img/placeholder-creator.png';
            const alt = escapeAttr(creator.name);
            return `
      <div class="col-6 col-md-4">
        <div class="row g-2 mb-3">
          <div class="col-4">
            <a href="/criador/${creatorSlug}">
              <img src="${imgSrc}" class="img-fluid rounded-circle" alt="${alt}">
            </a>
          </div>
          <div class="col-8 align-content-center">
            <h5 class="mb-0">${creator.name}</h5>
            <p class="text-muted">${creator.role || ''}</p>
          </div>
        </div>
      </div>`;
        }).join('');

        html = html.replace(
            '<div id="creatorsGrid" class="row"></div>',
            `<div id="creatorsGrid" class="row">${creatorsHtml}</div>`
        );
    }

    // === ARCOS (comicArcsList) ===
    if (comic.arcs?.length) {
        const arcsHtml = comic.arcs.map(arc => {
            const arcSlug = makeSlug(arc.id, arc.name);
            return `<li><a href="/arco/${arcSlug}" class="text-decoration-none link-warning">${arc.name}</a></li>`;
        }).join('');

        html = html
            .replace(
                '<div class="mt-3" id="comicArcsContainer" style="display:none;">',
                '<div class="mt-3" id="comicArcsContainer">'
            )
            .replace(
                '<ul id="comicArcsList"></ul>',
                `<ul id="comicArcsList">${arcsHtml}</ul>`
            );
    }

    // === JSON-LD enriquecido (personagens e criadores) ===
    const characterLd = (comic.characters || []).map(c => `{
        "@type": "Person",
        "name": ${JSON.stringify(c.alias || c.name)}
    }`).join(',');

    const contributorLd = (comic.creators || []).map(c => `{
        "@type": "Person",
        "name": ${JSON.stringify(c.name)},
        "jobTitle": ${JSON.stringify(c.role || '')}
    }`).join(',');

    const jsonLd = `
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Book",
        "name": ${JSON.stringify(comic.title)},
        "image": ${JSON.stringify(image)},
        "datePublished": ${JSON.stringify(String(comic.year || ''))},
        "publisher": { "@type": "Organization", "name": ${JSON.stringify(comic.publisher_name || '')} },
        ${comic.average_rating ? `"aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": ${comic.average_rating},
            "ratingCount": ${comic.rating_count},
            "bestRating": "5"
        },` : ''}
        ${characterLd ? `"character": [${characterLd}],` : ''}
        ${contributorLd ? `"contributor": [${contributorLd}],` : ''}
        "description": ${JSON.stringify(description)}
    }
    </script>`;

    html = html.replace('</head>', `${jsonLd}\n</head>`);

    return html;
}

// ============================
// CHARACTER
// ============================
function renderCharacterPage(pages, character, correctSlug) {
    let html = fs.readFileSync(path.join(pages, 'character.html'), 'utf8');

    const displayName = character.alias || character.name;
    const title = `${displayName} | My Comics`;
    const description = (character.history
        ? character.history.slice(0, 155)
        : `Conheça ${displayName}, personagem de ${character.publisher_name || 'quadrinhos'}. Veja aparições, história e quadrinhos relacionados.`
    ).slice(0, 155);
    const image = character.image
        ? `${process.env.BASE_URL}${character.image}`
        : `${process.env.BASE_URL}/assets/img/placeholder-character.png`;
    const url = `https://mycomics.com.br/personagem/${correctSlug}`;
    const imageAlt = escapeAttr(`${displayName}${character.publisher_name ? ` - ${character.publisher_name}` : ''}`);

    html = html
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
        .replace(/<meta name="description"[\s\S]*?content=".*?">/, `<meta name="description" content="${description}">`)
        .replace(/<link rel="canonical"[\s\S]*?href=".*?">/, `<link rel="canonical" href="${url}">`)
        .replace(/<meta property="og:type"[\s\S]*?content=".*?">/, `<meta property="og:type" content="profile">`)
        .replace(/<meta property="og:title"[\s\S]*?content=".*?">/, `<meta property="og:title" content="${title}">`)
        .replace(/<meta property="og:description"[\s\S]*?content=".*?">/, `<meta property="og:description" content="${description}">`)
        .replace(/<meta property="og:image"[\s\S]*?content=".*?">/, `<meta property="og:image" content="${image}">`)
        .replace(/<meta property="og:url"[\s\S]*?content=".*?">/, `<meta property="og:url" content="${url}">`);

    html = html
    .replace('<h1 id="characterName"></h1>', `<h1 id="characterName">${displayName}</h1>`)
    .replace(
        '<div id="characterHistory" class="text-justify"></div>',
        `<div id="characterHistory" class="text-justify">${character.history || ''}</div>`
    )
        .replace(
            '<img id="characterImage" class="character-image">',
            `<img id="characterImage" class="character-image" alt="${imageAlt}" title="${imageAlt}">`
        );

    const jsonLd = `
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": ${JSON.stringify(displayName)},
        "alternateName": ${JSON.stringify(character.name)},
        "image": ${JSON.stringify(image)},
        "description": ${JSON.stringify(description)}
    }
    </script>`;

    html = html.replace('</head>', `${jsonLd}\n</head>`);

    return html;
}

// ============================
// ARC
// ============================
function renderArcPage(pages, arc, correctSlug) {
    let html = fs.readFileSync(path.join(pages, 'arco.html'), 'utf8');

    const title = `${arc.name} | My Comics Database`;
    const description = (arc.description
        ? arc.description.slice(0, 155)
        : `Veja a ordem de leitura completa do arco ${arc.name}.`
    ).slice(0, 155);
    const image = arc.cover
        ? `${process.env.BASE_URL}${arc.cover}`
        : `${process.env.BASE_URL}/assets/img/placeholder-comic.png`;
    const url = `https://mycomics.com.br/arco/${correctSlug}`;
    const coverAlt = escapeAttr(`Capa do arco ${arc.name}`);

    html = html
        .replace(/<title id="pageTitle">[\s\S]*?<\/title>/, `<title id="pageTitle">${title}</title>`)
        .replace(/(<meta name="description"\s+id="metaDescription"\s+content=")[^"]*(")/, `$1${description}$2`)
        .replace(/(<meta property="og:title"\s+id="ogTitle"\s+content=")[^"]*(")/, `$1${title}$2`)
        .replace(/(<meta property="og:description"\s+id="ogDescription"\s+content=")[^"]*(")/, `$1${description}$2`)
        .replace(/<meta property="og:image"[\s\S]*?content=".*?">/, `<meta property="og:image" content="${image}">`)
        .replace(/<meta property="og:url"[\s\S]*?content=".*?">/, `<meta property="og:url" content="${url}">`);

    html = html.replace('</head>', `    <link rel="canonical" href="${url}">\n</head>`);

    html = html
        .replace('<h1 id="arcName"></h1>', `<h1 id="arcName">${arc.name}</h1>`)
        .replace(
            '<p id="arcDescription"></p>',
            `<p id="arcDescription">${arc.description || ''}</p>`
        )
        .replace(
            '<img id="arcCover" class="img-fluid shadow rounded" alt="">',
            `<img id="arcCover" class="img-fluid shadow rounded" alt="${coverAlt}" title="${coverAlt}">`
        );

    const jsonLd = `
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        "name": ${JSON.stringify(arc.name)},
        "description": ${JSON.stringify(description)},
        "image": ${JSON.stringify(image)},
        "url": ${JSON.stringify(url)}
    }
    </script>`;

    html = html.replace('</head>', `${jsonLd}\n</head>`);

    return html;
}

// ============================
// SERIE
// ============================
function renderSeriePage(pages, serie, correctSlug) {
    let html = fs.readFileSync(path.join(pages, 'serie.html'), 'utf8');

    const title = `${serie.name} | My Comics`;
    const description = (serie.description
        ? serie.description.slice(0, 155)
        : `Confira todas as edições da série ${serie.name}${serie.original_publisher_name ? `, publicada por ${serie.original_publisher_name}` : ''}.`
    ).slice(0, 155);
    const image = serie.cover
        ? `${process.env.BASE_URL}${serie.cover}`
        : `${process.env.BASE_URL}/assets/img/placeholder-comic.png`;
    const url = `https://mycomics.com.br/serie/${correctSlug}`;
    const coverAlt = escapeAttr(`Capa da série ${serie.name}`);

    html = html
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
        .replace(/<meta name="description"[\s\S]*?content=".*?">/, `<meta name="description" content="${description}">`)
        .replace(/<link rel="canonical"[\s\S]*?href=".*?">/, `<link rel="canonical" href="${url}">`)
        .replace(/<meta property="og:type"[\s\S]*?content=".*?">/, `<meta property="og:type" content="website">`)
        .replace(/<meta property="og:title"[\s\S]*?content=".*?">/, `<meta property="og:title" content="${title}">`)
        .replace(/<meta property="og:description"[\s\S]*?content=".*?">/, `<meta property="og:description" content="${description}">`)
        .replace(/<meta property="og:image"[\s\S]*?content=".*?">/, `<meta property="og:image" content="${image}">`)
        .replace(/<meta property="og:url"[\s\S]*?content=".*?">/, `<meta property="og:url" content="${url}">`);

    html = html
        .replace('<h2 id="seriesName"></h2>', `<h1 id="seriesName">${serie.name}</h1>`)
        .replace(
            '<p id="seriesDescription"></p>',
            `<p id="seriesDescription">${serie.description || ''}</p>`
        )
        .replace(
            '<img id="seriesCover" class="img-fluid d-none" />',
            `<img id="seriesCover" class="img-fluid d-none" alt="${coverAlt}" title="${coverAlt}" />`
        );

    const jsonLd = `
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "CreativeWorkSeries",
        "name": ${JSON.stringify(serie.name)},
        "description": ${JSON.stringify(description)},
        "image": ${JSON.stringify(image)},
        "publisher": { "@type": "Organization", "name": ${JSON.stringify(serie.original_publisher_name || serie.publisher_name || '')} },
        "url": ${JSON.stringify(url)}
    }
    </script>`;

    html = html.replace('</head>', `${jsonLd}\n</head>`);

    return html;
}

// ============================
// CREATOR
// ============================
function renderCreatorPage(pages, creator, correctSlug) {
    let html = fs.readFileSync(path.join(pages, 'creator.html'), 'utf8');

    const title = `${creator.name} | My Comics`;
    const description = (creator.bio
        ? creator.bio.slice(0, 155)
        : `Conheça ${creator.name}${creator.role ? `, ${creator.role}` : ''} de quadrinhos. Veja obras e histórico.`
    ).slice(0, 155);
    const image = creator.image
        ? `${process.env.BASE_URL}${creator.image}`
        : `${process.env.BASE_URL}/assets/img/placeholder-character.png`;
    const url = `https://mycomics.com.br/criador/${correctSlug}`;
    const imageAlt = escapeAttr(`${creator.name}${creator.role ? ` - ${creator.role}` : ''}`);

    html = html
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
        .replace(/<meta name="description"[\s\S]*?content=".*?">/, `<meta name="description" content="${description}">`)
        .replace(/<link rel="canonical"[\s\S]*?href=".*?">/, `<link rel="canonical" href="${url}">`)
        .replace(/<meta property="og:type"[\s\S]*?content=".*?">/, `<meta property="og:type" content="profile">`)
        .replace(/<meta property="og:title"[\s\S]*?content=".*?">/, `<meta property="og:title" content="${title}">`)
        .replace(/<meta property="og:description"[\s\S]*?content=".*?">/, `<meta property="og:description" content="${description}">`)
        .replace(/<meta property="og:image"[\s\S]*?content=".*?">/, `<meta property="og:image" content="${image}">`)
        .replace(/<meta property="og:url"[\s\S]*?content=".*?">/, `<meta property="og:url" content="${url}">`);

    html = html
        .replace('<h1 id="creatorName"></h1>', `<h1 id="creatorName">${creator.name}</h1>`)
        .replace(
            '<div id="creatorBio" class="text-justify"></div>',
            `<div id="creatorBio" class="text-justify">${creator.bio || ''}</div>`
        )
        .replace(
            '<img id="creatorImage" class="creator-image">',
            `<img id="creatorImage" class="creator-image" alt="${imageAlt}" title="${imageAlt}">`
        );

    const jsonLd = `
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": ${JSON.stringify(creator.name)},
        "jobTitle": ${JSON.stringify(creator.role || '')},
        "image": ${JSON.stringify(image)},
        "description": ${JSON.stringify(description)}
    }
    </script>`;

    html = html.replace('</head>', `${jsonLd}\n</head>`);

    return html;
}

// ============================
// PUBLISHER
// ============================
function renderPublisherPage(pages, publisher, correctSlug) {
    let html = fs.readFileSync(path.join(pages, 'publisher.html'), 'utf8');

    const title = `${publisher.name} | My Comics`;
    const description = (publisher.description
        ? publisher.description.slice(0, 155)
        : `Confira os quadrinhos publicados pela editora ${publisher.name}.`
    ).slice(0, 155);
    const image = publisher.logo
        ? `${process.env.BASE_URL}${publisher.logo}`
        : `${process.env.BASE_URL}/assets/img/social-cover.png`;
    const url = `https://mycomics.com.br/editora/${correctSlug}`;
    const logoAlt = escapeAttr(`Logo da editora ${publisher.name}`);

    html = html
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
        .replace(/<meta name="description"[\s\S]*?content=".*?">/, `<meta name="description" content="${description}">`)
        .replace(/<link rel="canonical"[\s\S]*?href=".*?">/, `<link rel="canonical" href="${url}">`)
        .replace(/<meta property="og:type"[\s\S]*?content=".*?">/, `<meta property="og:type" content="website">`)
        .replace(/<meta property="og:title"[\s\S]*?content=".*?">/, `<meta property="og:title" content="${title}">`)
        .replace(/<meta property="og:description"[\s\S]*?content=".*?">/, `<meta property="og:description" content="${description}">`)
        .replace(/<meta property="og:image"[\s\S]*?content=".*?">/, `<meta property="og:image" content="${image}">`)
        .replace(/<meta property="og:url"[\s\S]*?content=".*?">/, `<meta property="og:url" content="${url}">`);

    html = html
        .replace('<h1 id="publisherName"></h1>', `<h1 id="publisherName">${publisher.name}</h1>`)
        .replace(
            '<p id="publisherDescription" class="text-justify"></p>',
            `<p id="publisherDescription" class="text-justify">${publisher.description || ''}</p>`
        )
        .replace(
            '<img id="publisherLogo" class="publisher-logo" />',
            `<img id="publisherLogo" class="publisher-logo" alt="${logoAlt}" title="${logoAlt}" />`
        );

    const jsonLd = `
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": ${JSON.stringify(publisher.name)},
        "description": ${JSON.stringify(description)},
        "logo": ${JSON.stringify(image)},
        ${publisher.website ? `"url": ${JSON.stringify(publisher.website)},` : ''}
        "sameAs": ${JSON.stringify(url)}
    }
    </script>`;

    html = html.replace('</head>', `${jsonLd}\n</head>`);

    return html;
}

// ============================
// HOME
// ============================
function renderHomePage(pages, homeData) {
    let html = fs.readFileSync(path.join(pages, 'index.html'), 'utf8');

    const firstFeatured = homeData.featured[0];

    if (firstFeatured) {
        const issue = firstFeatured.issue_number ? ` #${firstFeatured.issue_number}` : '';
        const featuredTitle = `${firstFeatured.title}${issue}`;
        const featuredAlt = escapeAttr(`Capa de ${featuredTitle}`);

        html = html
            .replace(
                /<h1 id="featuredTitle" class="featured-title">[\s\S]*?<\/h1>/,
                `<h1 id="featuredTitle" class="featured-title">${featuredTitle}</h1>`
            )
            .replace(
                /<img\s+id="featuredCover"\s+class="featured-cover"\s+src=""\s+alt="Capa do quadrinho">/,
                `<img id="featuredCover" class="featured-cover" src="" alt="${featuredAlt}" title="${featuredAlt}">`
            );
    }

    if (homeData.popular?.length) {
        const itemListLd = `
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": [
            ${homeData.popular.slice(0, 10).map((c, i) => `{
                "@type": "ListItem",
                "position": ${i + 1},
                "url": "https://mycomics.com.br/quadrinho/${makeSlug(c.id, c.title)}"
            }`).join(',')}
        ]
    }
    </script>`;

        html = html.replace('</head>', `${itemListLd}\n</head>`);
    }

    return html;
}

module.exports = {
    renderComicPage,
    renderCharacterPage,
    renderArcPage,
    renderSeriePage,
    renderCreatorPage,
    renderPublisherPage,
    renderHomePage
};