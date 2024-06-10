import { Store } from "./slice.ts";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { capitalizeFirstLetter } from "./utils.ts";
import { getDefaultStore } from "jotai/index";
import { ReactElement, ReactNode, useMemo } from "react";
import { focusAtom } from "jotai-optics";
import { useHydrateAtoms } from "jotai/react/utils";
import { createProvider } from "./createProvider.tsx";

type VecStore<T extends unknown[], N extends string> = {
  [K in `get${Capitalize<N>}State`]: () => T;
} & {
  [K in `set${Capitalize<N>}State`]: (state: T) => void;
} & {
  [K in `use${Capitalize<N>}State`]: () => [T, (value: T | ((prev: T) => T)) => void];
} & {
  [K in `useGet${Capitalize<N>}State`]: () => T;
} & {
  [K in `useSet${Capitalize<N>}State`]: (value: T | ((prev: T) => T)) => void;
} & {
  [K in `use${Capitalize<N>}Item`]: (index: number) => [T[typeof index], (value: T[typeof index]) => void];
} & {
  [K in `useGet${Capitalize<N>}Item`]: (index: number) => T[typeof index];
} & {
  [K in `useSet${Capitalize<N>}Item`]: (index: number) => (value: T[typeof index]) => void;
} & {
  [K in `set${Capitalize<N>}Item`]: (index: number, value: T[typeof index]) => void;
} & {
  [K in `get${Capitalize<N>}Item`]: (index: number) => T[typeof index];
} & {
  [K in `use${Capitalize<N>}Hydrate`]: (value: T) => void;
} & {
  [K in `reset${Capitalize<N>}State`]: () => void;
} & {
  [K in `${Capitalize<N>}Provider`]: (props: { children: ReactNode }) => ReactElement;
} & {
  [K in `${N}Store`]: Store;
} & {
  [K in `${N}Atom}`]: ReturnType<typeof atom>;
};

export const createVecStore = <T extends unknown, N extends string>(
  initialState: T[],
  opts?: {
    name?: N;
    store?: Store;
  },
): VecStore<T[], N> => {
  const { name = "", store = getDefaultStore() } = opts || {};

  const vec = atom([...initialState]);
  const capitalizeName = capitalizeFirstLetter(name);

  const getState = () => store.get(vec);

  const setState = (state: T[]) => store.set(vec, state);

  const useVecState = () => useAtom(vec);

  const useGetVecState = () => useAtomValue(vec);

  const useSetVecState = () => useSetAtom(vec);

  const atIndex = (index: number) => focusAtom(vec, (optic) => optic.at(index));

  const useVecItem = (index: number) => {
    return useAtom(useMemo(() => atIndex(index), [index]));
  };

  const useGetVecItem = (index: number) => {
    return useAtomValue(atIndex(index));
  };

  const useSetVecItem = (index: number) => {
    return useSetAtom(atIndex(index));
  };

  const setVecItem = (index: number, value: T) => {
    store.set(atIndex(index), value);
  };

  const getVecItem = (index: number) => {
    return store.get(atIndex(index));
  };

  const useVecHydrate = (value: T[]) => useHydrateAtoms([[vec, value]]);

  const resetVecState = () => {
    setState([...initialState]);
  };

  const provider = createProvider(store);

  return {
    [`get${capitalizeName}State`]: getState,
    [`set${capitalizeName}State`]: setState,
    [`use${capitalizeName}State`]: useVecState,
    [`useGet${capitalizeName}State`]: useGetVecState,
    [`useSet${capitalizeName}State`]: useSetVecState,
    [`use${capitalizeName}Item`]: useVecItem,
    [`useGet${capitalizeName}Item`]: useGetVecItem,
    [`useSet${capitalizeName}Item`]: useSetVecItem,
    [`set${capitalizeName}Item`]: setVecItem,
    [`get${capitalizeName}Item`]: getVecItem,
    [`use${capitalizeName}Hydrate`]: useVecHydrate,
    [`reset${capitalizeName}State`]: resetVecState,
    [`${capitalizeName}Provider`]: provider,
    [`${name}Store`]: store,
    [`${name}Atom`]: vec,
  } as VecStore<T[], N>;
};
