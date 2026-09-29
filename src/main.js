const PRICE_SINGLE = 19.99
const PRICE_BULK = 12.0
const SHIPPING = 4.39
const BULK_THRESHOLD = 2

const samplePages = [
  { src: '/assets/cover-front.jpg', label: 'Front cover' },
  { src: '/assets/cover-back.jpg', label: 'Back cover' },
  { src: '/assets/sample-001.jpg', label: 'Title page' },
  { src: '/assets/sample-002.jpg', label: 'Copyright' },
  { src: '/assets/sample-003.jpg', label: 'Dedication' },
  { src: '/assets/sample-005.jpg', label: 'Contents' },
  { src: '/assets/sample-007.jpg', label: 'Acknowledgments' },
  { src: '/assets/sample-008.jpg', label: 'Acknowledgments (cont.)' },
  { src: '/assets/sample-009.jpg', label: 'Introduction' },
  { src: '/assets/sample-010.jpg', label: 'Introduction' },
  { src: '/assets/sample-011.jpg', label: 'Introduction' },
  { src: '/assets/sample-012.jpg', label: 'Introduction' },
  { src: '/assets/sample-013.jpg', label: 'Introduction' },
  { src: '/assets/sample-014.jpg', label: 'Introduction' },
]

const money = (n) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

function setupOrder() {
  const qtyInput = document.querySelector('#qty')
  const booksTotal = document.querySelector('#books-total')
  const shipTotal = document.querySelector('#ship-total')
  const grandTotal = document.querySelector('#grand-total')
  const priceNote = document.querySelector('#price-note')
  const form = document.querySelector('#order-form')

  const recalc = () => {
    const qty = Math.max(1, Math.min(50, Number(qtyInput.value) || 1))
    qtyInput.value = String(qty)
    const unit = qty >= BULK_THRESHOLD ? PRICE_BULK : PRICE_SINGLE
    const books = unit * qty
    const total = books + SHIPPING
    booksTotal.textContent = money(books)
    shipTotal.textContent = money(SHIPPING)
    grandTotal.textContent = money(total)
    priceNote.textContent =
      qty >= BULK_THRESHOLD
        ? `Bulk pricing · ${money(PRICE_BULK)} each`
        : `Single-copy price · ${money(PRICE_SINGLE)} each`
  }

  qtyInput.addEventListener('input', recalc)
  recalc()

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const qty = Number(qtyInput.value)
    const unit = qty >= BULK_THRESHOLD ? PRICE_BULK : PRICE_SINGLE
    const total = unit * qty + SHIPPING
    alert(
      `Order ready: ${qty} book${qty > 1 ? 's' : ''} — ${money(total)} including shipping.\n\nPayPal checkout will open here once Howard’s merchant account is connected.`,
    )
  })
}

function setupSample() {
  const img = document.querySelector('#sample-page')
  const label = document.querySelector('#sample-label')
  const dots = document.querySelector('#sample-dots')
  const prev = document.querySelector('#sample-prev')
  const next = document.querySelector('#sample-next')
  let index = 0

  samplePages.forEach((page, i) => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.setAttribute('aria-label', page.label)
    btn.addEventListener('click', () => show(i))
    dots.appendChild(btn)
  })

  const show = (i) => {
    index = (i + samplePages.length) % samplePages.length
    img.classList.add('is-switching')
    window.setTimeout(() => {
      img.src = samplePages[index].src
      img.alt = samplePages[index].label
      label.textContent = `${samplePages[index].label} · ${index + 1} / ${samplePages.length}`
      ;[...dots.children].forEach((dot, di) => {
        dot.setAttribute('aria-current', di === index ? 'true' : 'false')
      })
      img.classList.remove('is-switching')
    }, 180)
  }

  prev.addEventListener('click', () => show(index - 1))
  next.addEventListener('click', () => show(index + 1))

  window.addEventListener('keydown', (e) => {
    if (!document.querySelector('#sample')?.matches(':hover, :focus-within')) return
    if (e.key === 'ArrowLeft') show(index - 1)
    if (e.key === 'ArrowRight') show(index + 1)
  })

  let touchX = null
  img.addEventListener('touchstart', (e) => {
    touchX = e.changedTouches[0].clientX
  })
  img.addEventListener('touchend', (e) => {
    if (touchX == null) return
    const dx = e.changedTouches[0].clientX - touchX
    if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1))
    touchX = null
  })

  show(0)
}

function setupNav() {
  const header = document.querySelector('.site-header')
  const toggle = document.querySelector('.nav-toggle')
  toggle?.addEventListener('click', () => {
    const open = header.classList.toggle('is-open')
    toggle.setAttribute('aria-expanded', String(open))
  })

  header.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      header.classList.remove('is-open')
      toggle?.setAttribute('aria-expanded', 'false')
    })
  })
}

function setupContact() {
  const form = document.querySelector('#contact-form')
  const status = document.querySelector('#contact-status')
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    status.hidden = false
    status.textContent =
      'Thanks — your message is ready to send. Email delivery will be wired to Howard’s inbox when hosting is live.'
    form.reset()
  })
}

document.querySelector('#year').textContent = String(new Date().getFullYear())
setupNav()
setupOrder()
setupSample()
setupContact()
