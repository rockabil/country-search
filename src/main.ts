import { createSearchController } from './ui/searchController.js';
import type { SearchState } from './ui/searchController.js';
import { renderState } from './ui/render.js';
import { searchCountries } from './core/searchCountries.js';

const app = document.createElement('main');
app.className = 'app';

const title = document.createElement('h1');
title.textContent = 'Country Search';

const input = document.createElement('input');
input.type = 'search';
input.placeholder = 'Type a country name…';
input.setAttribute('aria-label', 'Search for a country');

const results = document.createElement('section');
results.className = 'results';

app.append(title, input, results);
document.body.append(app);

const onStateChange = (state: SearchState): void => {
  renderState(state, results);
};

const controller = createSearchController({
  search: searchCountries,
  onStateChange,
  debounceMs: 300,
});

input.addEventListener('input', () => {
  controller.setQuery(input.value);
});

window.addEventListener('beforeunload', () => {
  controller.dispose();
});
