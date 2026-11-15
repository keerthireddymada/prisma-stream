/**
 * PRISMA STREAM — Standalone React 18 & ReactDOM Mini-Runtime Fallback
 * Provides 100% offline & sandbox compatibility for React createElement, hooks, and createRoot
 * in case external CDNs are unreachable.
 */

(function(global) {
  if (global.React && global.ReactDOM) {
    return; // Already loaded from CDN
  }

  let currentComponent = null;
  let hookIndex = 0;
  let rootInstance = null;

  function createElement(type, props, ...children) {
    props = props || {};
    const flatChildren = children.flat().filter(c => c !== null && c !== undefined && c !== false);
    return {
      $$typeof: Symbol.for("react.element"),
      type,
      props: {
        ...props,
        children: flatChildren.length === 1 ? flatChildren[0] : flatChildren
      }
    };
  }

  function useState(initialValue) {
    if (!currentComponent) throw new Error("useState called outside component");
    const comp = currentComponent;
    const index = hookIndex++;

    if (comp.hooks[index] === undefined) {
      comp.hooks[index] = typeof initialValue === "function" ? initialValue() : initialValue;
    }

    const setState = (newValue) => {
      const next = typeof newValue === "function" ? newValue(comp.hooks[index]) : newValue;
      if (comp.hooks[index] !== next) {
        comp.hooks[index] = next;
        if (rootInstance) rootInstance.scheduleRender();
      }
    };

    return [comp.hooks[index], setState];
  }

  function useEffect(effect, deps) {
    if (!currentComponent) return;
    const comp = currentComponent;
    const index = hookIndex++;
    const prev = comp.hooks[index];

    let hasChanged = true;
    if (prev && deps) {
      hasChanged = deps.some((dep, i) => dep !== prev.deps[i]);
    }

    if (hasChanged) {
      if (prev && typeof prev.cleanup === "function") {
        prev.cleanup();
      }
      setTimeout(() => {
        const cleanup = effect();
        comp.hooks[index] = { deps, cleanup };
      }, 0);
    }
  }

  function useRef(initialValue) {
    if (!currentComponent) return { current: initialValue };
    const comp = currentComponent;
    const index = hookIndex++;
    if (!comp.hooks[index]) {
      comp.hooks[index] = { current: initialValue };
    }
    return comp.hooks[index];
  }

  function useMemo(fn, deps) {
    if (!currentComponent) return fn();
    const comp = currentComponent;
    const index = hookIndex++;
    const prev = comp.hooks[index];

    if (prev && deps && deps.every((d, i) => d === prev.deps[i])) {
      return prev.value;
    }

    const value = fn();
    comp.hooks[index] = { deps, value };
    return value;
  }

  function useCallback(fn, deps) {
    return useMemo(() => fn, deps);
  }

  function renderVNodeToDOM(vnode) {
    if (vnode === null || vnode === undefined || vnode === false) {
      return document.createTextNode("");
    }
    if (typeof vnode === "string" || typeof vnode === "number") {
      return document.createTextNode(String(vnode));
    }

    if (typeof vnode.type === "function") {
      const prevComponent = currentComponent;
      const prevIndex = hookIndex;

      // Component record for state & hooks
      let comp = vnode._componentInstance;
      if (!comp) {
        comp = { hooks: [] };
        vnode._componentInstance = comp;
      }

      currentComponent = comp;
      hookIndex = 0;

      const rendered = vnode.type(vnode.props);
      const dom = renderVNodeToDOM(rendered);

      currentComponent = prevComponent;
      hookIndex = prevIndex;
      return dom;
    }

    const dom = document.createElement(vnode.type);

    if (vnode.props) {
      for (const [key, value] of Object.entries(vnode.props)) {
        if (key === "children") continue;
        if (key === "className") {
          dom.className = value;
        } else if (key === "style" && typeof value === "object") {
          Object.assign(dom.style, value);
        } else if (key.startsWith("on") && typeof value === "function") {
          const eventName = key.slice(2).toLowerCase();
          dom.addEventListener(eventName, value);
        } else if (key === "ref" && value) {
          if (typeof value === "function") value(dom);
          else if ("current" in value) value.current = dom;
        } else {
          dom.setAttribute(key, value);
        }
      }

      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : (vnode.props.children ? [vnode.props.children] : []);

      for (const child of children) {
        dom.appendChild(renderVNodeToDOM(child));
      }
    }

    return dom;
  }

  class Root {
    constructor(container) {
      this.container = container;
      this.currentVNode = null;
      this.renderPending = false;
    }

    render(vnode) {
      this.currentVNode = vnode;
      rootInstance = this;
      this._updateDOM();
    }

    scheduleRender() {
      if (this.renderPending) return;
      this.renderPending = true;
      requestAnimationFrame(() => {
        this.renderPending = false;
        this._updateDOM();
      });
    }

    _updateDOM() {
      if (!this.currentVNode) return;
      const newDOM = renderVNodeToDOM(this.currentVNode);
      this.container.innerHTML = "";
      this.container.appendChild(newDOM);
    }
  }

  function createRoot(container) {
    return new Root(container);
  }

  global.React = {
    createElement,
    useState,
    useEffect,
    useRef,
    useMemo,
    useCallback
  };

  global.ReactDOM = {
    createRoot
  };
})(typeof window !== "undefined" ? window : globalThis);
