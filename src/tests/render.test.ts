import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderState } from '../ui/render';

const makeRoot = (): HTMLElement => {
  const root = document.createElement('div');
  document.body.append(root);
  return root;
};

describe('renderState', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = makeRoot();
  });

  it('renders nothing in idle state', () => {
    renderState({ kind: 'idle' }, root);
    expect(root.childElementCount).toBe(0);
  });

  it('renders a loading indicator in loading state', () => {
    renderState({ kind: 'loading', query: 'japan' }, root);
    const status = root.querySelector('[role="status"]');
    expect(status).not.toBeNull();
    expect(status?.textContent).toContain('Searching');
  });

  it('renders a list of country cards in results state', () => {
    renderState(
      {
        kind: 'results',
        query: 'japan',
        countries: [
          {
            name: 'Japan',
            flagUrl: 'https://flagcdn.com/w320/jp.png',
            capital: 'Tokyo',
            region: 'Asia',
            population: 125836021,
            languages: ['Japanese'],
          },
          {
            name: 'Spain',
            flagUrl: 'https://flagcdn.com/w320/es.png',
            capital: 'Madrid',
            region: 'Europe',
            population: 47351567,
            languages: ['Spanish'],
          },
        ],
      },
      root
    );

    const cards = root.querySelectorAll('li');
    expect(cards).toHaveLength(2);

    const first = cards[0];
    expect(first?.textContent).toContain('Japan');
    expect(first?.textContent).toContain('Tokyo');
    expect(first?.textContent).toContain('Asia');
    expect(first?.textContent).toContain('125');

    const img = first?.querySelector('img');
    expect(img?.getAttribute('src')).toBe('https://flagcdn.com/w320/jp.png');
    expect(img?.getAttribute('alt')).toBe('Japan flag');
  });

  it('renders a friendly empty message (not an error) in empty state', () => {
    renderState({ kind: 'empty', query: 'zzz' }, root);
    expect(root.textContent).toContain('No matches');
    expect(root.querySelector('[role="alert"]')).toBeNull();
  });

  it('renders an error message with a working retry button', () => {
    const retry = vi.fn();
    renderState(
      {
        kind: 'error',
        query: 'japan',
        message: 'Network down',
        retry,
      },
      root
    );

    expect(root.textContent).toContain('Network down');
    const alert = root.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();

    const button = root.querySelector('button');
    expect(button).not.toBeNull();
    expect(button?.textContent).toMatch(/retry/i);

    button?.click();
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
