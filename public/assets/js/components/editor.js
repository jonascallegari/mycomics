function createSimpleEditor(selector) {
    return new Quill(selector, {
        theme: 'snow',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline'],
                ['link']
            ]
        }
    });
}