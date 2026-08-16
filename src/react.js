/* React comes from vendor/react.js, which puts the two module namespaces on
   window.__MX_REACT. Bundling React into app.js as well would ship it twice. */
const ns = window.__MX_REACT;

const React = ns.react.default;
export default React;

export const useState = ns.react.useState;
export const useEffect = ns.react.useEffect;
export const useLayoutEffect = ns.react.useLayoutEffect;
export const useReducer = ns.react.useReducer;
export const useRef = ns.react.useRef;
export const useMemo = ns.react.useMemo;
export const useCallback = ns.react.useCallback;
export const useContext = ns.react.useContext;
export const createContext = ns.react.createContext;
export const createRoot = ns.dom.createRoot;
