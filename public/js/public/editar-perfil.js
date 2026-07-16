let cropper = null;

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (!user || !token) {
        alert('Você precisa estar logado');
        window.location.href = 'login.html';
        return;
    }

    const bioInput = document.getElementById('bio');
    const avatarFileInput = document.getElementById('avatarFile');
    const avatarPreview = document.getElementById('avatarPreview');
    const cropSaveBtn = document.getElementById('cropSaveBtn');
    const form = document.getElementById('editProfileForm');
    const favoriteSelect = document.getElementById('favoriteCharacter');

    let currentFavoriteCharacterId = null;

    // ===============================
    // 🔹 Carregar dados do perfil
    // ===============================
    fetch(`${API_BASE}/users/${user.username}`)
        .then(res => res.json())
        .then(data => {
            bioInput.value = data.bio || '';
            avatarPreview.src = data.avatar
                ? `${BASE_URL}${data.avatar}`
                : './assets/img/placeholder-character.png';

            currentFavoriteCharacterId = data.character_id || null;

            loadCharacters(data.character_id);
            loadComics(data.comic_id);
        });

    // ===============================
    // 🔹 Carregar personagens
    // ===============================
    async function loadCharacters(selectedId) {
        try {

            const res = await fetch(
                `${API_BASE}/characters?limit=1000`
            );

            const response = await res.json();

            const characters = response.data || response;

            favoriteSelect.innerHTML =
                `<option value="">Selecione um personagem</option>`;

            characters.forEach(char => {

                const option = document.createElement('option');
                option.value = char.id;
                option.textContent = char.alias;

                if (Number(selectedId) === Number(char.id)) {
                    option.selected = true;
                }

                favoriteSelect.appendChild(option);

            });

        } catch (err) {
            console.error('Erro ao carregar personagens', err);
        }
    }

    // ===============================
    // 🔹 Carregar quadrinhos
    // ===============================
    async function loadComics(selectedId) {

        try {

            const res = await fetch(
                `${API_BASE}/comics?limit=10000`
            );

            const response = await res.json();

            const comics = response.data || response;

            const select = document.getElementById('favoriteComic');

            select.innerHTML =
                `<option value="">Selecione um quadrinho</option>`;

            comics.forEach(comic => {

                const option = document.createElement('option');
                option.value = comic.id;

                option.textContent = comic.display_issue
                    ? `${comic.title} ${comic.display_issue}`
                    : comic.title;

                if (Number(selectedId) === Number(comic.id)) {
                    option.selected = true;
                }

                select.appendChild(option);

            });

        } catch (err) {
            console.error('Erro ao carregar quadrinhos', err);
        }

    }   

    // ===============================
    // 🔹 Selecionou imagem → inicia crop
    // ===============================
    avatarFileInput.addEventListener('change', () => {
        const file = avatarFileInput.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            avatarPreview.src = reader.result;

            if (cropper) cropper.destroy();

            cropper = new Cropper(avatarPreview, {
                aspectRatio: 1,
                viewMode: 1,
                dragMode: 'move',
                autoCropArea: 1,
                responsive: true,
                background: false,
                zoomOnTouch: true,
                zoomOnWheel: false,
                movable: true,
                scalable: false,
                rotatable: false,
                guides: false,
                center: true
            });

            cropSaveBtn.style.display = 'inline-block';
        };

        reader.readAsDataURL(file);
    });

    // ===============================
    // 🔹 Salvar avatar cortado
    // ===============================
    cropSaveBtn.addEventListener('click', async () => {
        if (!cropper) return;

        const canvas = cropper.getCroppedCanvas({
            width: 400,
            height: 400
        });

        canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('avatar', blob, 'avatar.png');

            try {
                const res = await fetch(
                    `${API_BASE}/users/me/avatar`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData
                    }
                );

                const data = await res.json();

                if (!res.ok) {
                    alert(data.error || 'Erro ao salvar avatar');
                    return;
                }

                avatarPreview.src = `${BASE_URL}${data.avatar}`;
                cropSaveBtn.style.display = 'none';

                cropper.destroy();
                cropper = null;

                alert('Avatar atualizado!');
            } catch (err) {
                console.error(err);
                alert('Erro ao enviar avatar');
            }
        });
    });

    // ===============================
    // 🔹 Salvar perfil (BIO + personagem)
    // ===============================
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const bio = bioInput.value;
        const character_id = favoriteSelect.value || null;

        console.log('Enviando:', { bio, character_id });

        const res = await fetch(
            `${API_BASE}/users/me`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    bio,
    character_id: favoriteSelect.value || null,
    comic_id: document.getElementById('favoriteComic').value || null
                })
            }
        );

        if (!res.ok) {
            alert('Erro ao salvar perfil');
            return;
        }

        const data = await res.json();

        const oldUser = JSON.parse(localStorage.getItem('user'));

        const updatedUser = {
            ...oldUser,
            avatar: data.avatar || oldUser.avatar
        };

        localStorage.setItem('user', JSON.stringify(updatedUser));

        if (window.initNavbar) {
            window.initNavbar();
        }

        window.location.href = `perfil?user=${data.username}`;
    });

});