import type { SearchState } from './searchController.js';

const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string
): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  if (className !== undefined) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

export function renderState(state: SearchState, root: HTMLElement): void {
  switch (state.kind) {
    case 'idle':
      root.replaceChildren();
      return;

    case 'loading': {
      const status = el('p', 'status', 'Searching…');
      status.setAttribute('role', 'status');
      root.replaceChildren(status);
      return;
    }

    case 'results': {
      const list = el('ul', 'country-list');
      for (const country of state.countries) {
        const item = el('li', 'country-card');

        if (country.flagUrl !== '') {
          const img = el('img', 'country-flag');
          img.src = country.flagUrl;
          img.alt = `${country.name} flag`;
          img.loading = 'lazy';
          item.append(img);
        }

        item.append(el('h3', 'country-name', country.name));
        item.append(
          el(
            'p',
            'country-meta',
            `Capital: ${country.capital} · Region: ${country.region} · Population: ${country.population.toLocaleString('en-US')}`
          )
        );

        list.append(item);
      }
      root.replaceChildren(list);
      return;
    }

    case 'empty': {
      const message = el(
        'p',
        'empty',
        'No matches found. Try another spelling.'
      );
      root.replaceChildren(message);
      return;
    }

    case 'error': {
      const alert = el('div', 'error');
      alert.setAttribute('role', 'alert');
      alert.append(el('p', undefined, state.message));

      const button = el('button', undefined, 'Retry');
      button.type = 'button';
      button.addEventListener('click', () => state.retry());
      alert.append(button);

      root.replaceChildren(alert);
      return;
    }
  }
}
