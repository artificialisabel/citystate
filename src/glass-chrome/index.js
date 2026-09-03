// Optional vanilla-DOM builders for glass-chrome. The visual system itself is
// index.css; these helpers only remove the repeated control-panel boilerplate.

export const GLASS_CHROME_THEMES = Object.freeze(['paper', 'void']);

const make = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const optionRecord = (option) => (
  typeof option === 'object'
    ? { label: option.label ?? String(option.value), value: option.value }
    : { label: String(option), value: option }
);

const defaultNumberFormat = (step) => {
  const fraction = String(step).split('.')[1];
  const digits = Math.min(fraction?.length ?? 0, 3);
  return digits ? (value) => Number(value).toFixed(digits) : (value) => String(Math.round(value));
};

export function setGlassTheme(root, theme = 'paper') {
  if (!GLASS_CHROME_THEMES.includes(theme)) {
    throw new RangeError(`Unknown glass-chrome theme: ${theme}`);
  }
  root.classList.add('gc-ui');
  root.dataset.gcTheme = theme;
  return root;
}

export function createGlassPanel({
  mount = document.body,
  title = 'Controls',
  meta = '',
  theme = 'paper',
  className = '',
} = {}) {
  if (!mount?.append) throw new TypeError('createGlassPanel requires a DOM mount node');

  const root = make('aside', ['gc-ui', 'gc-panel', className].filter(Boolean).join(' '));
  setGlassTheme(root, theme);

  const header = make('header', 'gc-panel-head');
  const titleNode = make('div', 'gc-panel-title', title);
  const metaNode = make('div', 'gc-panel-meta', meta);
  header.append(titleNode, metaNode);

  const body = make('div', 'gc-panel-body');
  root.append(header, body);
  mount.append(root);

  function section(label, { open = true } = {}) {
    const element = make('details', 'gc-section');
    element.open = open;
    const summary = make('summary', '', label);
    const content = make('div', 'gc-section-body');
    element.append(summary, content);
    body.append(element);

    function range({
      label: controlLabel,
      min = 0,
      max = 1,
      step = 0.01,
      value = min,
      format = defaultNumberFormat(step),
      onInput = () => {},
    }) {
      const wrap = make('label', 'gc-control');
      const head = make('span', 'gc-control-head');
      const labelNode = make('span', 'gc-label', controlLabel);
      const valueNode = make('span', 'gc-value', format(value));
      const input = make('input', 'gc-range');
      input.type = 'range';
      input.min = String(min);
      input.max = String(max);
      input.step = String(step);
      input.value = String(value);
      head.append(labelNode, valueNode);
      wrap.append(head, input);
      content.append(wrap);

      const set = (next, { emit = false } = {}) => {
        input.value = String(next);
        const numeric = Number(input.value);
        valueNode.textContent = format(numeric);
        if (emit) onInput(numeric, input);
        return numeric;
      };
      input.addEventListener('input', () => set(input.value, { emit: true }));
      return { element: wrap, input, value: valueNode, set };
    }

    function segmented({
      label: controlLabel,
      options,
      value = typeof options?.[0] === 'object' ? options[0].value : options?.[0],
      onChange = () => {},
    }) {
      if (!options?.length) throw new TypeError('segmented requires at least one option');
      const wrap = make('div', 'gc-control');
      if (controlLabel) wrap.append(make('div', 'gc-label', controlLabel));
      const group = make('div', 'gc-segmented');
      group.setAttribute('role', 'group');
      const records = options.map(optionRecord);
      const buttons = records.map((option) => {
        const button = make('button', 'gc-chip', option.label);
        button.type = 'button';
        button.addEventListener('click', () => set(option.value, { emit: true }));
        group.append(button);
        return button;
      });
      wrap.append(group);
      content.append(wrap);

      const set = (next, { emit = false } = {}) => {
        value = next;
        records.forEach((option, index) => {
          const active = Object.is(option.value, value);
          buttons[index].classList.toggle('is-active', active);
          buttons[index].setAttribute('aria-pressed', String(active));
        });
        if (emit) onChange(value, group);
        return value;
      };
      set(value);
      return { element: wrap, group, buttons, set, get value() { return value; } };
    }

    function select({
      label: controlLabel,
      options,
      value = typeof options?.[0] === 'object' ? options[0].value : options?.[0],
      onChange = () => {},
    }) {
      if (!options?.length) throw new TypeError('select requires at least one option');
      const wrap = make('label', 'gc-control');
      wrap.append(make('div', 'gc-label', controlLabel));
      const input = make('select', 'gc-select');
      for (const raw of options) {
        const record = optionRecord(raw);
        const option = make('option', '', record.label);
        option.value = String(record.value);
        input.append(option);
      }
      input.value = String(value);
      input.addEventListener('change', () => {
        const record = options.map(optionRecord).find((entry) => String(entry.value) === input.value);
        value = record?.value ?? input.value;
        onChange(value, input);
      });
      wrap.append(input);
      content.append(wrap);
      return { element: wrap, input };
    }

    function toggle(labelText, initial = false, onChange = () => {}) {
      let value = Boolean(initial);
      const button = make('button', 'gc-chip is-wide', labelText);
      button.type = 'button';
      const set = (next, { emit = false } = {}) => {
        value = Boolean(next);
        button.classList.toggle('is-active', value);
        button.setAttribute('aria-pressed', String(value));
        if (emit) onChange(value, button);
        return value;
      };
      button.addEventListener('click', () => set(!value, { emit: true }));
      content.append(button);
      set(value);
      return { element: button, set, get value() { return value; } };
    }

    function button(labelText, onClick, { danger = false, wide = false } = {}) {
      const classNames = ['gc-chip', danger && 'is-danger', wide && 'is-wide'].filter(Boolean).join(' ');
      const control = make('button', classNames, labelText);
      control.type = 'button';
      control.addEventListener('click', onClick);
      content.append(control);
      return control;
    }

    function note(text) {
      const node = make('p', 'gc-note', text);
      content.append(node);
      return node;
    }

    return { element, summary, body: content, range, segmented, select, toggle, button, note };
  }

  return {
    root,
    header,
    title: titleNode,
    meta: metaNode,
    body,
    section,
    setTheme: (next) => setGlassTheme(root, next),
    destroy: () => root.remove(),
  };
}
