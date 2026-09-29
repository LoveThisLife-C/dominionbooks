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
  const statusEl = document.querySelector('#paypal-status')
  const buttonsEl = document.querySelector('#paypal-buttons')
  const fallbackBtn = document.querySelector('#checkout-fallback')
  const errorEl = document.querySelector('#checkout-error')

  const showError = (msg) => {
    if (!errorEl) return
    errorEl.hidden = !msg
    errorEl.textContent = msg || ''
  }

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

  const readShipping = () => {
    const get = (id) => document.querySelector(id)?.value?.trim() || ''
    return {
      qty: Number(qtyInput.value) || 1,
      name: get('#ship-name'),
      email: get('#ship-email'),
      phone: get('#ship-phone'),
      address1: get('#ship-address1'),
      address2: get('#ship-address2'),
      city: get('#ship-city'),
      state: get('#ship-state').toUpperCase(),
      zip: get('#ship-zip'),
    }
  }

  const validateForm = () => {
    if (!form?.reportValidity()) return false
    const data = readShipping()
    if (!/^[A-Z]{2}$/.test(data.state)) {
      showError('Please enter a 2-letter US state code (e.g. OR).')
      return false
    }
    if (!/^\d{5}(-\d{4})?$/.test(data.zip)) {
      showError('Please enter a valid US ZIP code.')
      return false
    }
    showError('')
    return true
  }

  const loadScript = (src) =>
    new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve()
      const s = document.createElement('script')
      s.src = src
      s.onload = () => resolve()
      s.onerror = () => reject(new Error('Could not load PayPal SDK'))
      document.head.appendChild(s)
    })

  const initPaypal = async () => {
    try {
      const cfgRes = await fetch('/api/paypal-config')
      const raw = await cfgRes.text()
      let cfg
      try {
        cfg = JSON.parse(raw)
      } catch {
        throw new Error(
          'Checkout API is not running. Use the deployed Vercel site, or restart with npm run dev after the latest update.',
        )
      }
      if (!cfg.configured || !cfg.clientId) {
        if (statusEl) {
          statusEl.textContent =
            'PayPal is not connected yet — waiting for Howard’s Client ID & Secret on Vercel.'
        }
        if (fallbackBtn) {
          fallbackBtn.hidden = false
          fallbackBtn.textContent = 'PayPal credentials not connected yet'
        }
        return
      }

      const sdk = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
        cfg.clientId,
      )}&currency=USD&intent=capture&components=buttons`
      await loadScript(sdk)

      if (!window.paypal) throw new Error('PayPal SDK unavailable')

      if (statusEl) statusEl.hidden = true
      if (buttonsEl) buttonsEl.hidden = false

      window.paypal
        .Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'pill',
            label: 'paypal',
          },
          onClick: (_data, actions) => {
            if (!validateForm()) return actions.reject()
            return actions.resolve()
          },
          createOrder: async () => {
            showError('')
            const payload = readShipping()
            const res = await fetch('/api/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (!res.ok || !data.id) {
              throw new Error(data.error || 'Could not start PayPal checkout')
            }
            sessionStorage.setItem(
              'dominion-last-order',
              JSON.stringify({ ...payload, paypalOrderId: data.id, totals: data.totals }),
            )
            return data.id
          },
          onApprove: async (data) => {
            const saved = JSON.parse(sessionStorage.getItem('dominion-last-order') || '{}')
            const res = await fetch('/api/capture-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderID: data.orderID,
                email: saved.email,
                name: saved.name,
                phone: saved.phone,
              }),
            })
            const result = await res.json()
            if (!res.ok) {
              throw new Error(result.error || 'Payment could not be completed')
            }
            window.location.href = `/order-success.html?orderId=${encodeURIComponent(result.id || data.orderID)}`
          },
          onCancel: () => {
            window.location.href = '/order-cancel.html'
          },
          onError: (err) => {
            console.error(err)
            showError(err?.message || 'PayPal error — please try again.')
          },
        })
        .render('#paypal-buttons')
    } catch (err) {
      console.error(err)
      if (statusEl) {
        statusEl.textContent =
          err.message ||
          'Checkout unavailable until PayPal credentials are added on Vercel.'
      }
      if (fallbackBtn) {
        fallbackBtn.hidden = false
        fallbackBtn.textContent = 'PayPal not connected yet'
      }
      showError(err.message || 'Could not initialize PayPal')
    }
  }

  form?.addEventListener('submit', (e) => e.preventDefault())
  initPaypal()
}

export function setupSample() {
  const img = document.querySelector('#sample-page')
  if (!img) return

  const label = document.querySelector('#sample-label')
  const dots = document.querySelector('#sample-dots')
  const prev = document.querySelector('#sample-prev')
  const next = document.querySelector('#sample-next')
  const stage = document.querySelector('#sample-stage')
  const zoomIn = document.querySelector('#sample-zoom-in')
  const zoomOut = document.querySelector('#sample-zoom-out')
  const zoomReset = document.querySelector('#sample-zoom-reset')
  const zoomLevel = document.querySelector('#sample-zoom-level')

  let index = 0
  let scale = 1
  const MIN_ZOOM = 1
  const MAX_ZOOM = 2.75
  const STEP = 0.25

  const applyZoom = () => {
    scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(scale.toFixed(2))))
    img.style.transform = `scale(${scale})`
    img.classList.toggle('is-zoomed', scale > 1)
    stage?.classList.toggle('is-zoomed', scale > 1)
    if (zoomLevel) zoomLevel.textContent = `${Math.round(scale * 100)}%`
    if (zoomOut) zoomOut.disabled = scale <= MIN_ZOOM
    if (zoomIn) zoomIn.disabled = scale >= MAX_ZOOM
  }

  const setZoom = (next) => {
    scale = next
    applyZoom()
  }

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
    setZoom(1)
    if (stage) stage.scrollTop = 0
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
  zoomIn?.addEventListener('click', () => setZoom(scale + STEP))
  zoomOut?.addEventListener('click', () => setZoom(scale - STEP))
  zoomReset?.addEventListener('click', () => setZoom(1))

  stage?.addEventListener(
    'wheel',
    (e) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      setZoom(scale + (e.deltaY < 0 ? STEP : -STEP))
    },
    { passive: false },
  )

  applyZoom()
  show(0)
}

const HOWARD_EMAIL = 'pastorhlw@gmail.com'

function openMailtoContact({ name, email, message }) {
  const subject = encodeURIComponent(`Dominion Books contact — ${name}`)
  const body = encodeURIComponent(`From: ${name} <${email}>\n\n${message}`)
  window.location.href = `mailto:${HOWARD_EMAIL}?subject=${subject}&body=${body}`
}

export function setupContact() {
  const form = document.querySelector('#contact-form')
  if (!form) return
  const status = document.querySelector('#contact-status')
  const submitBtn = form.querySelector('[type="submit"]')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const data = new FormData(form)
    const payload = {
      name: String(data.get('name') || '').trim(),
      email: String(data.get('email') || '').trim(),
      message: String(data.get('message') || '').trim(),
    }

    status.hidden = false
    status.textContent = 'Sending…'
    if (submitBtn) submitBtn.disabled = true

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const out = await res.json().catch(() => ({}))

      if (res.ok && out.delivered) {
        status.textContent = 'Thank you — your message was sent to Howard.'
        form.reset()
        return
      }

      // No Resend key yet, or API unavailable — open the visitor’s mail app.
      openMailtoContact(payload)
      status.textContent = `Opening your email app to write ${HOWARD_EMAIL}…`
      form.reset()
    } catch {
      openMailtoContact(payload)
      status.textContent = `Opening your email app to write ${HOWARD_EMAIL}…`
    } finally {
      if (submitBtn) submitBtn.disabled = false
    }
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
