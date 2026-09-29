const links = [
  { href: '/', label: 'Home', id: 'home' },
  { href: '/book.html', label: 'The Book', id: 'book' },
  { href: '/catalog.html', label: 'Catalog', id: 'catalog' },
  { href: '/sample.html', label: 'Sample', id: 'sample' },
  { href: '/reviews.html', label: 'Reviews', id: 'reviews' },
  { href: '/author.html', label: 'Author', id: 'author' },
  { href: '/contact.html', label: 'Contact', id: 'contact' },
]

export function mountChrome(active = 'home') {
  const header = document.querySelector('[data-chrome="header"]')
  const footer = document.querySelector('[data-chrome="footer"]')

  if (header) {
    header.innerHTML = `
      <a class="brand" href="/" aria-label="Dominion Books home">
        <img class="brand-mark" src="/assets/brand-mark.png" alt="" width="36" height="36" />
        <span class="brand-name">Dominion Books</span>
      </a>
      <nav class="nav" aria-label="Primary">
        ${links
          .map(
            (l) =>
              `<a href="${l.href}" class="${l.id === active ? 'is-active' : ''}">${l.label}</a>`,
          )
          .join('')}
      </nav>
      <a class="header-cta" href="/order.html">Order</a>
      <button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false">
        <span></span><span></span>
      </button>
    `
    const toggle = header.querySelector('.nav-toggle')
    toggle?.addEventListener('click', () => {
      const open = header.classList.toggle('is-open')
      toggle.setAttribute('aria-expanded', String(open))
    })
    header.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        header.classList.remove('is-open')
        toggle?.setAttribute('aria-expanded', 'false')
      })
    })
  }

  if (footer) {
    footer.innerHTML = `
      <div class="footer-inner">
        <div class="footer-brand">
          <img src="/assets/brand-mark.png" alt="" width="40" height="40" />
          <div>
            <p class="brand-name">Dominion Books</p>
            <p>Hope-filled titles for the church that longs to wake.</p>
          </div>
        </div>
        <div class="footer-meta">
          <p>US shipping · Media Mail · Printed paperback</p>
          <p>© <span data-year></span> Howard Williams. All rights reserved.</p>
        </div>
      </div>
    `
    footer.querySelector('[data-year]').textContent = String(new Date().getFullYear())
  }
}
