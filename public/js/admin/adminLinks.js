async function loadSelects() {
    const [comics, characters, creators] = await Promise.all([
        fetch(`${API_BASE}/comics`).then(r => r.json()),
        fetch(`${API_BASE}/characters`).then(r => r.json()),
        fetch(`${API_BASE}/creators`).then(r => r.json())
    ]);


    fillSelect('comicSelectChar', comics);
    fillSelect('comicSelectCreator', comics);
    fillSelect('characterSelect', characters);
    fillSelect('creatorSelect', creators);
}


function fillSelect(id, items) {
    const select = document.getElementById(id);
    select.innerHTML = '';
    items.forEach(i => {
        select.innerHTML += `<option value="${i.id}">${i.title || i.name}</option>`;
    });
}


async function linkCharacter() {
    await fetch(`${API_BASE}/comic-characters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            comic_id: document.getElementById('comicSelectChar').value,
            character_id: document.getElementById('characterSelect').value
        })
    });


    alert('Personagem vinculado com sucesso');
}


async function linkCreator() {
    await fetch(`${API_BASE}/comic-creators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            comic_id: document.getElementById('comicSelectCreator').value,
            creator_id: document.getElementById('creatorSelect').value,
            role: document.getElementById('roleInput').value
        })
    });


    alert('Criador vinculado com sucesso');
}


loadSelects();