import { readFile } from 'node:fs/promises';
import { compile, createRenderer } from 'vue';
import { parse, rewriteDefault } from 'vue/compiler-sfc';

const loadedComponents = new Map();

// Compile the real Options API SFCs with Vue's own compiler. The lightweight
// renderer checks component contracts without pretending to model browser layout.
export async function loadComponent(relativePath) {
  const url = new URL(relativePath, new URL('../../', import.meta.url));
  if (loadedComponents.has(url.href)) return loadedComponents.get(url.href);
  const { descriptor, errors } = parse(await readFile(url, 'utf8'), { filename: url.pathname });
  if (errors.length) throw errors[0];
  const dependencies = [];
  const script = descriptor.script.content.replace(/import\s+(.+?)\s+from\s+['"](.+?)['"];?/g, (_statement, bindings, source) => {
    const index = dependencies.length;
    dependencies.push(source.endsWith('.vue')
      ? loadComponent(new URL(source, url).pathname)
      : import(source.startsWith('.') ? new URL(source, url).href : source));
    const declaration = bindings.startsWith('{')
      ? bindings.replace(/\bas\b/g, ':')
      : `{ default: ${bindings} }`;
    return `const ${declaration} = dependencies[${index}];`;
  });
  const component = new Function('dependencies', `${rewriteDefault(script, 'component')}\nreturn component;`)(await Promise.all(dependencies));
  component.render = compile(descriptor.template.content);
  const module = { default: component };
  loadedComponents.set(url.href, module);
  return module;
}

export function mountComponent(component, props = {}) {
  const node = (type, text = '') => ({ type, text, props: {}, children: [], parent: null });
  const renderer = createRenderer({
    createElement: type => node(type),
    createText: text => node('#text', text),
    createComment: text => node('#comment', text),
    setText(element, text) { element.text = text; },
    setElementText(element, text) { element.text = text; element.children = []; },
    patchProp(element, key, _previous, value) { element.props[key] = value; },
    insert(element, parent, anchor = null) {
      if (element.parent) element.parent.children.splice(element.parent.children.indexOf(element), 1);
      const index = anchor ? parent.children.indexOf(anchor) : -1;
      parent.children.splice(index < 0 ? parent.children.length : index, 0, element);
      element.parent = parent;
    },
    remove(element) {
      if (element.parent) element.parent.children.splice(element.parent.children.indexOf(element), 1);
      element.parent = null;
    },
    parentNode: element => element.parent,
    nextSibling: element => element.parent?.children[element.parent.children.indexOf(element) + 1] ?? null,
  });
  const root = node('root');
  const app = renderer.createApp(component, props);
  const warnings = [];
  app.config.warnHandler = message => warnings.push(message);
  const vm = app.mount(root);
  return { root, vm, warnings, unmount: () => app.unmount() };
}

export function findElements(root, predicate) {
  return [root, ...root.children.flatMap(child => findElements(child, () => true))].filter(predicate);
}
