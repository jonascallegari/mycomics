// utils/render-page.js
const fs = require('fs');
const path = require('path');

function renderComicPage(pages, comic, correctSlug) {
    let html = fs.readFileSync(path.join(pages, 'comic.html'), 'utf8');

    const issueLabel = comic.display_issue !== 'Edição Única' ? ` ${comic.display_issue}` : '';
    const title = `${comic.title}${issueLabel} | My Comics`;
    const description = (comic.synopsis || `Confira detalhes de ${comic.title}, publicado por ${comic.publisher_name || 'editora desconhecida'}.`).slice(0, 155);
    const image = comic.cover ? `${process.env.BASE_URL}${comic.cover}` : `${process.env.BASE_URL}/assets/img/placeholder-comic.png`;
    const url = `https://mycomics.com.br/quadrinho/${correctSlug}`;

    html = html
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
        .replace(/<meta name="description"[\s\S]*?content=".*?">/, `<meta name="description" content="${description}">`)
        .replace(/<link rel="canonical"[\s\S]*?href=".*?">/, `<link rel="canonical" href="${url}">`)
        .replace(/<meta property="og:type"[\s\S]*?content=".*?">/, `<meta property="og:type" content="book">`)
        .replace(/<meta property="og:title"[\s\S]*?content=".*?">/, `<meta property="og:title" content="${title}">`)
        .replace(/<meta property="og:description"[\s\S]*?content=".*?">/, `<meta property="og:description" content="${description}">`)
        .replace(/<meta property="og:image"[\s\S]*?content=".*?">/, `<meta property="og:image" content="${image}">`)
        .replace(/<meta property="og:url"[\s\S]*?content=".*?">/, `<meta property="og:url" content="${url}">`);

    // Pré-preenche título e sinopse no HTML (o JS sobrescreve depois, sem conflito)
    html = html
        .replace('<span id="comicTitle"></span>', `<span id="comicTitle">${comic.title}</span>`)
        .replace('<div id="comicSynopsis" class="text-white synopsis-box"></div>',
            `<div id="comicSynopsis" class="text-white synopsis-box">${comic.synopsis || ''}</div>`);    

    // JSON-LD estruturado
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
        "description": ${JSON.stringify(description)}
    }
    </script>`;

    html = html.replace('</head>', `${jsonLd}\n</head>`);

    return html;
}

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

    html = html
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
        .replace(/<meta name="description"[\s\S]*?content=".*?">/, `<meta name="description" content="${description}">`)
        .replace(/<link rel="canonical"[\s\S]*?href=".*?">/, `<link rel="canonical" href="${url}">`)
        .replace(/<meta property="og:type"[\s\S]*?content=".*?">/, `<meta property="og:type" content="profile">`)
        .replace(/<meta property="og:title"[\s\S]*?content=".*?">/, `<meta property="og:title" content="${title}">`)
        .replace(/<meta property="og:description"[\s\S]*?content=".*?">/, `<meta property="og:description" content="${description}">`)
        .replace(/<meta property="og:image"[\s\S]*?content=".*?">/, `<meta property="og:image" content="${image}">`)
        .replace(/<meta property="og:url"[\s\S]*?content=".*?">/, `<meta property="og:url" content="${url}">`);

    // Pré-preenche H1 (o characterDetail.js sobrescreve depois sem conflito)
    html = html.replace('<h1 id="characterName"></h1>', `<h1 id="characterName">${displayName}</h1>`);

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

    html = html
        .replace(/<title id="pageTitle">[\s\S]*?<\/title>/, `<title id="pageTitle">${title}</title>`)
        .replace(/(<meta name="description"\s+id="metaDescription"\s+content=")[^"]*(")/, `$1${description}$2`)
        .replace(/(<meta property="og:title"\s+id="ogTitle"\s+content=")[^"]*(")/, `$1${title}$2`)
        .replace(/(<meta property="og:description"\s+id="ogDescription"\s+content=")[^"]*(")/, `$1${description}$2`)
        .replace(/<meta property="og:image"[\s\S]*?content=".*?">/, `<meta property="og:image" content="${image}">`)
        .replace(/<meta property="og:url"[\s\S]*?content=".*?">/, `<meta property="og:url" content="${url}">`);

    // canonical: essa página não tem nenhum <link rel="canonical"> — vou inserir
    html = html.replace('</head>', `    <link rel="canonical" href="${url}">\n</head>`);

    // pré-preenche H1 (arco.js sobrescreve depois sem conflito)
    html = html.replace('<h1 id="arcName"></h1>', `<h1 id="arcName">${arc.name}</h1>`);

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

module.exports = { renderComicPage, renderCharacterPage, renderArcPage };