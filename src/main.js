import { mountChrome } from './chrome.js'
import './style.css'

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

export function setupOrder() {
  const qtyInput = document.querySelector('#qty')
  if (!qtyInput) return

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

  form?.addEventListener('submit', (e) => {
    e.preventDefault()
    const qty = Number(qtyInput.value)
    const unit = qty >= BULK_THRESHOLD ? PRICE_BULK : PRICE_SINGLE
    const total = unit * qty + SHIPPING
    alert(
      `Order ready: ${qty} book${qty > 1 ? 's' : ''} — ${money(total)} including shipping.\n\nPayPal checkout will open here once the merchant account is connected.`,
    )
  })
}

export function setupSample() {
  const img = document.querySelector('#sample-page')
  if (!img) return

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

  prev?.addEventListener('click', () => show(index - 1))
  next?.addEventListener('click', () => show(index + 1))
  show(0)
}

export function setupContact() {
  const form = document.querySelector('#contact-form')
  if (!form) return
  const status = document.querySelector('#contact-status')
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    status.hidden = false
    status.textContent =
      'Thanks — your message is ready. Email delivery will be wired when hosting is live.'
    form.reset()
  })
}

export function setupHeroSlideshow() {
  const root = document.querySelector('[data-hero-slides]')
  if (!root) return

  const slides = [...root.querySelectorAll('.hero-slide')]
  const dotsWrap = document.querySelector('[data-hero-dots]')
  if (slides.length < 2) return

  let index = 0
  const show = (i) => {
    index = (i + slides.length) % slides.length
    slides.forEach((slide, si) => slide.classList.toggle('is-active', si === index))
    if (dotsWrap) {
      ;[...dotsWrap.children].forEach((dot, di) => {
        if (di === index) dot.setAttribute('aria-current', 'true')
        else dot.removeAttribute('aria-current')
      })
    }
  }

  if (dotsWrap) {
    slides.forEach((_, i) => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.setAttribute('aria-label', `Show hero image ${i + 1}`)
      btn.addEventListener('click', () => show(i))
      dotsWrap.appendChild(btn)
    })
  }

  show(0)
  window.setInterval(() => show(index + 1), 5500)
}

export function setupReveals() {
  const items = document.querySelectorAll('.reveal')
  if (!items.length) return

  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'))
    return
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in')
          io.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.16, rootMargin: '0px 0px -40px 0px' },
  )

  items.forEach((el) => io.observe(el))
}

export function setupButtonEffects() {
  document.querySelectorAll('.btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const rect = btn.getBoundingClientRect()
      const ripple = document.createElement('span')
      const size = Math.max(rect.width, rect.height)
      ripple.className = 'btn-ripple'
      ripple.style.width = ripple.style.height = `${size}px`
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`
      btn.appendChild(ripple)
      window.setTimeout(() => ripple.remove(), 650)
    })
  })
}

export function boot(active) {
  mountChrome(active)
  setupHeroSlideshow()
  setupReveals()
  setupButtonEffects()
  setupOrder()
  setupSample()
  setupContact()
}
