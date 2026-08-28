export function syncSidebarAria(root: ParentNode = document) {
  const links = root.querySelectorAll<HTMLAnchorElement>(
    '.VPSidebarItem a.link',
  );

  links.forEach(link => {
    const item = link.closest('.VPSidebarItem');
    const active =
      link.classList.contains('active') ||
      item?.classList.contains('is-active');

    if (active) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  root
    .querySelectorAll<HTMLElement>('.VPSidebarItem [role="button"]')
    .forEach(control => {
      const item = control.closest('.VPSidebarItem');
      if (!item?.querySelector('.caret')) {
        control.removeAttribute('role');
        control.removeAttribute('tabindex');
        control.removeAttribute('aria-expanded');
        return;
      }
      control.setAttribute(
        'aria-expanded',
        String(!item?.classList.contains('collapsed')),
      );
    });
}

export function observeSidebarAria() {
  const sidebar = document.querySelector('.VPSidebar');
  if (!sidebar) return () => {};

  syncSidebarAria(sidebar);
  const observer = new MutationObserver(() => syncSidebarAria(sidebar));
  observer.observe(sidebar, {
    attributes: true,
    attributeFilter: ['class'],
    childList: true,
    subtree: true,
  });

  return () => observer.disconnect();
}
