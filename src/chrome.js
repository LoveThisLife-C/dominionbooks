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
      <div class="footer-glow" aria-hidden="true"></div>
      <div class="footer-inner">
        <div class="footer-top">
          <div class="footer-brand-block">
            <div class="footer-brand">
              <img src="/assets/brand-mark.png" alt="" width="48" height="48" />
              <div>
                <p class="brand-name">Dominion Books</p>
                <p class="footer-tagline">Hope-filled titles for the church that longs to wake.</p>
              </div>
            </div>
            <p class="footer-blurb">
              We publish clear, Christ-centered books for believers who want the everlasting gospel
              at the center — not the margins — of their faith.
            </p>
            <a class="btn btn-primary footer-cta" href="/order.html">Order Adam’s Lost Dominion</a>
          </div>

          <div class="footer-cols">
            <div class="footer-col">
              <h4>Explore</h4>
              <a href="/book.html">The Book</a>
              <a href="/catalog.html">Catalog</a>
              <a href="/sample.html">Sample pages</a>
              <a href="/reviews.html">Reviews</a>
            </div>
            <div class="footer-col">
              <h4>About</h4>
              <a href="/author.html">Howard Williams</a>
              <a href="/contact.html">Contact</a>
              <a href="/order.html">Order &amp; shipping</a>
            </div>
            <div class="footer-col">
              <h4>Ordering</h4>
              <p>Paperback · $19.99</p>
              <p>2+ copies · $12.00 each</p>
              <p>US Media Mail · $4.39</p>
              <p>No international shipping</p>
            </div>
          </div>
        </div>

        <div class="footer-trust">
          <div class="trust-item">
            <img src="/assets/icon-shipping.png" alt="" width="28" height="28" />
            <span>Flat US shipping</span>
          </div>
          <div class="trust-item">
            <img src="/assets/icon-bulk.png" alt="" width="28" height="28" />
            <span>Church bulk pricing</span>
          </div>
          <div class="trust-item">
            <img src="/assets/icon-sample.png" alt="" width="28" height="28" />
            <span>Read before you buy</span>
          </div>
          <div class="trust-item">
            <img src="/assets/icon-usa.png" alt="" width="28" height="28" />
            <span>Ships nationwide</span>
          </div>
        </div>

        <div class="footer-bottom">
          <p>© <span data-year></span> Howard Williams · Dominion Books. All rights reserved.</p>
          <p class="footer-note">Printed paperback · PayPal checkout coming soon</p>
        </div>
      </div>
    `
    footer.querySelector('[data-year]').textContent = String(new Date().getFullYear())
  }
}
