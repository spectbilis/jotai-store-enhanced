import {
  atom,
  createStore as createStoreFunc,
  getDefaultStore,
  useAtom,
  useAtomValue,
  useSetAtom,
  WritableAtom,
} from "jotai";
import { focusAtom } from "jotai-optics";
import { ReactElement, ReactNode, useMemo } from "react";
import { createProvider } from "./createProvider.tsx";
import { useHydrateAtoms } from "jotai/react/utils";
import { capitalizeFirstLetter, cloneDeep } from "./utils.ts";

export type Store = ReturnType<typeof createStoreFunc>;

export type StoreRecordKey = string | number | symbol;

export type StoreState = Record<StoreRecordKey, unknown>;

type GetStateFn<T> = <F extends (keyof T)[]>(keys?: F) => Pick<T, F[number]>;

type SetStateFn<T> = (state: Partial<T>) => void;

type ResetStateFn<T> = <K extends keyof T>(key?: K[]) => void;

type SetStateByKeyFn<T> = <K extends keyof T>(key: K, value: T[K]) => void;

type GetStateByKeyFn<T> = <K extends keyof T>(key: K) => T[K];

type UseStateFn<T> = <F extends (keyof T)[]>(
  keys: F,
) => [Pick<T, F[number]>, (value: Pick<T, F[number]> | ((prev: Pick<T, F[number]>) => Pick<T, F[number]>)) => void];

type UseGetStateFn<T> = <F extends (keyof T)[]>(keys: F) => Pick<T, F[number]>;

type UseSetStateFn<T> = <F extends (keyof T)[]>(
  keys: F,
) => (value: Pick<T, F[number]> | ((prev: Pick<T, F[number]>) => Pick<T, F[number]>)) => void;

type UseStateByKeyFn<T> = <K extends keyof T>(key: K) => [T[K], (value: T[K] | ((prev: T[K]) => T[K])) => void];

type UseGetStateByKeyFn<T> = <K extends keyof T>(key: K) => T[K];

type UseSetStateByKeyFn<T> = <K extends keyof T>(key: K) => (value: T[K] | ((prev: T[K]) => T[K])) => void;

export type CreateStoreReturn<T extends StoreState, N extends string> = {
  [K in `get${Capitalize<N>}State`]: GetStateFn<T>;
} & {
  [K in `set${Capitalize<N>}State`]: SetStateFn<T>;
} & {
  [K in `reset${Capitalize<N>}State`]: ResetStateFn<T>;
} & {
  [K in `set${Capitalize<N>}StateByKey`]: SetStateByKeyFn<T>;
} & {
  [K in `get${Capitalize<N>}StateByKey`]: GetStateByKeyFn<T>;
} & {
  [K in `use${Capitalize<N>}State`]: UseStateFn<T>;
} & {
  [K in `useGet${Capitalize<N>}State`]: UseGetStateFn<T>;
} & {
  [K in `useSet${Capitalize<N>}State`]: UseSetStateFn<T>;
} & {
  [K in `use${Capitalize<N>}StateByKey`]: UseStateByKeyFn<T>;
} & {
  [K in `useGet${Capitalize<N>}StateByKey`]: UseGetStateByKeyFn<T>;
} & {
  [K in `useSet${Capitalize<N>}StateByKey`]: UseSetStateByKeyFn<T>;
} & {
  [K in `${Capitalize<N>}Provider`]: (props: { children: ReactNode }) => ReactElement;
} & {
  [K in `${N}Store`]: Store;
} & {
  [K in `${N}Atom}`]: ReturnType<typeof atom>;
} & {
  [K in `use${Capitalize<N>}Hydrate`]: Function;
};

/**
 * @description 创建 store 状态, 加强原子状态管理, 解决re-render问题,
 * @param initialState
 * @param opts
 */
export const createSliceStore = <T extends StoreState, N extends string>(
  initialState: T,
  opts?: {
    name?: N;
    store?: Store;
  },
): CreateStoreReturn<T, N> => {
  const { name = "", store = getDefaultStore() } = opts || {};

  /**
   * @description 初始化 store
   */
  const sliceAtom = atom(cloneDeep(initialState));

  /**
   * @description 获取 store 当前状态
   */
  const getState = (keys?: (keyof T)[]) => {
    return store.get(focusAtom(sliceAtom, (optic) => (keys ? optic.pick(keys) : optic)));
  };

  /**
   * @description 设置 store 状态
   */
  const setState = (state: Partial<T>) => {
    const keys = Object.keys(state) as (keyof T)[];
    for (const key of keys) {
      setStateByKey(key, state[key] as T[keyof T]);
    }
  };

  /**
   * @description 重置 store 状态
   * @param keys 重置的 key
   */
  const resetState = <K extends keyof T>(keys?: K[]) => {
    const isResetAll = !keys || keys.length === 0 || keys.length === Object.keys(initialState).length;
    if (isResetAll) {
      store.set(sliceAtom, cloneDeep(initialState));
    } else {
      const resetState = keys.reduce((acc, key) => {
        acc[key] = initialState[key];
        return acc;
      }, {} as Partial<T>);
      setState(cloneDeep(resetState));
    }
  };

  /**
   * @description 设置 store 状态
   * @param key
   * @param value
   */
  const setStateByKey = <K extends keyof T>(key: K, value: T[K]) => {
    store.set(propKey(key), value);
  };

  /**
   * @description 通过key 获取 store 状态
   * @param key
   */
  const getStateByKey = <K extends keyof T>(key: K) => {
    return store.get(propKey(key));
  };

  const pickByKeys = (keys: (keyof T)[]) => {
    return focusAtom(sliceAtom, (optic) => optic.pick(keys));
  };

  const propKey = <K extends keyof T>(key: K) => {
    return focusAtom(sliceAtom, (optic) => optic.prop(key));
  };

  /**
   * @description use state hook
   */
  const useState = (keys: (keyof T)[]) => {
    return useAtom<T>(useMemo(() => pickByKeys(keys), []));
  };

  /**
   * @description use get state hook
   */
  const useGetState = (keys: (keyof T)[]) => {
    return useAtomValue(useMemo(() => pickByKeys(keys), []));
  };

  /**
   * @description use set state hook
   */
  const useSetState = (keys: (keyof T)[]) => {
    return useSetAtom(useMemo(() => pickByKeys(keys), []));
  };

  /**
   * @description 单个原子状态的hook
   */
  const useStateByKey = <K extends keyof T>(key: K) => {
    return useAtom<T[K]>(useMemo(() => propKey(key), []));
  };

  /**
   * @description 获取单个的hook
   */
  const useGetStateByKey = <K extends keyof T>(key: K) => {
    return useAtomValue(useMemo(() => propKey(key), []));
  };

  /**
   * @description 设置单个的hook
   */
  const useSetStateByKey = <K extends keyof T>(key: K) => {
    return useSetAtom(useMemo(() => propKey(key), []));
  };

  /**
   * @description provider
   */
  const provider = createProvider(store);

  const capitalizeName = capitalizeFirstLetter(name);

  /**
   * @description SSR hydrate
   */
  const useHydrate = (val: Partial<T>) => {
    const hydrateState = useMemo(() => {
      return Object.keys(val).map((key) => {
        return [propKey(key as keyof T), val[key as keyof T]];
      }) as [WritableAtom<T[keyof T], unknown[], unknown>, T[keyof T]][];
    }, []);
    useHydrateAtoms(hydrateState, { store, dangerouslyForceHydrate: false });
  };

  return {
    [`get${capitalizeName}State`]: getState,
    [`set${capitalizeName}State`]: setState,
    [`reset${capitalizeName}State`]: resetState,
    [`get${capitalizeName}StateByKey`]: getStateByKey,
    [`set${capitalizeName}StateByKey`]: setStateByKey,
    [`use${capitalizeName}State`]: useState,
    [`useGet${capitalizeName}State`]: useGetState,
    [`useSet${capitalizeName}State`]: useSetState,
    [`use${capitalizeName}StateByKey`]: useStateByKey,
    [`useGet${capitalizeName}StateByKey`]: useGetStateByKey,
    [`useSet${capitalizeName}StateByKey`]: useSetStateByKey,
    [`${capitalizeName}Provider`]: provider,
    [`${capitalizeName}Store`]: store,
    [`${name}Atom`]: sliceAtom,
    [`use${capitalizeName}Hydrate`]: useHydrate,
  } as CreateStoreReturn<T, N>;
};
