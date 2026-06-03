'use client';
import { useEffect } from 'react';

export default function ClientEffects() {
  useEffect(() => {
    // Header scroll
    const header = document.getElementById('siteHeader');
    let onScroll;
    if (header) {
      onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    // Scroll reveal
    const reveals = [...document.querySelectorAll('.reveal')];
    reveals.forEach((el) => {
      const sibs = [...el.parentNode.children].filter((c) => c.classList?.contains('reveal'));
      el.style.animationDelay = Math.min(sibs.indexOf(el), 6) * 0.08 + 's';
    });

    const revealEl = (el) => el.classList.add('in');
    const inView = (el) => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight * 0.92 && r.bottom > 0;
    };

    let io = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) { revealEl(e.target); io.unobserve(e.target); }
          });
        },
        { threshold: 0.08, rootMargin: '0px 0px -6% 0px' }
      );
    }

    function initReveals() {
      reveals.forEach((el) => {
        if (el.classList.contains('in')) return;
        if (inView(el)) revealEl(el);
        else if (io) io.observe(el);
        else revealEl(el);
      });
    }
    requestAnimationFrame(initReveals);
    window.addEventListener('load', initReveals);
    const fallback = setTimeout(() => reveals.forEach(revealEl), 2200);

    // Route line animations
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('.route-line path').forEach((p) => {
      try {
        const len = p.getTotalLength();
        p.style.strokeDasharray = len;
        p.style.strokeDashoffset = reduce ? 0 : len;
        if (!reduce) {
          p.style.transition = 'stroke-dashoffset 1.8s cubic-bezier(.4,0,.2,1)';
          requestAnimationFrame(() => requestAnimationFrame(() => { p.style.strokeDashoffset = 0; }));
        }
      } catch (_) {}
    });
    document.querySelectorAll('.route-line .node').forEach((n, i) => {
      if (reduce) return;
      n.style.transformBox = 'fill-box';
      n.style.transformOrigin = 'center';
      n.style.transform = 'scale(0)';
      n.style.transition = 'transform 0.5s cubic-bezier(.2,1.4,.4,1)';
      setTimeout(() => { n.style.transform = 'scale(1)'; }, 700 + i * 450);
    });

    return () => {
      if (onScroll) window.removeEventListener('scroll', onScroll);
      window.removeEventListener('load', initReveals);
      if (io) io.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  return null;
}
