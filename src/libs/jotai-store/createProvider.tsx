import { Provider } from "jotai";
import { ReactNode } from "react";
import { Store } from "./slice.ts";

export const createProvider = (store: Store) => {
  return (props: { children: ReactNode }) => {
    const { children } = props;
    return <Provider store={store}>{children}</Provider>;
  };
};
