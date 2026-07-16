const Routes = {

    comic(comic) {
        return `/quadrinho/${comic.id}-${slugify(comic.title)}`;
    },

    character(character) {
        return `/personagem/${character.id}-${slugify(character.alias)}`;
    },

    creator(creator) {
        return `/criador/${creator.id}-${slugify(creator.name)}`;
    },

    publisher(publisher) {
        return `/editora/${publisher.id}-${slugify(publisher.name)}`;
    },

    serie(serie) {
    return `/serie/${serie.id}-${slugify(serie.name)}`;
    },

    arc(arc) {
        return `/arco/${arc.id}-${slugify(arc.name)}`;
    }

};

window.Routes = Routes;