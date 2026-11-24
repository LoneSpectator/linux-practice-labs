(() => {
    const page = document.body.dataset.page;
    const active = document.querySelector('[data-key="' + page + '"]');
    if (active) active.setAttribute('aria-current', 'page');
    const top = document.querySelector('[data-nav="' + page + '"]');
    if (top) top.setAttribute('aria-current', 'page');

    const toc = document.querySelector('.toc');
    const nav = toc.querySelector('nav');
    document.querySelectorAll('.reading h2').forEach((heading, index) => {
        if (!heading.id) heading.id = 'section-' + (index + 1);
        const link = document.createElement('a');
        link.href = '#' + encodeURIComponent(heading.id);
        link.textContent = heading.textContent;
        nav.append(link);
    });
    toc.hidden = page === 'home' || !nav.children.length;
    document.querySelectorAll('.reading pre').forEach(pre => {
        const box = document.createElement('div');
        box.className = 'code-wrap';
        pre.before(box);
        box.append(pre);
        if (!navigator.clipboard || !window.isSecureContext) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = '复制';
        button.setAttribute('aria-label', '复制本段代码');
        button.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(pre.textContent.replace(/\n$/, ''));
                button.textContent = '已复制';
            } catch {
                button.textContent = '请手动选择';
            }
            window.setTimeout(() => { button.textContent = '复制'; }, 1800);
        });
        box.prepend(button);
    });
})();
