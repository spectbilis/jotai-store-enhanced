import "./main.css";
import reactLogo from "./assets/react.svg";
import FarmLogo from "./assets/logo.png";
import { createSliceStore, createVecStore } from "./libs/jotai-store";
import { FC, memo, useEffect } from "react";

const vec = createVecStore([1, 2, 3, 4, 5, "haha"], {
  name: "vec",
});

const VecItem: FC<{ index: number }> = memo((props) => {
  const [item] = vec.useVecItem(props.index);
  console.log("render VecItem");
  return (
    <li>
      <input
        value={item}
        onChange={(e) => {
          vec.setVecItem(props.index, e.target.value);
        }}
      />
    </li>
  );
});

function VecNode() {
  const [list] = vec.useVecState();

  return (
    <div>
      <h1>Vec</h1>
      <ul>
        {list.map((_, index) => (
          <VecItem key={index} index={index} />
        ))}
      </ul>
    </div>
  );
}

const test = createSliceStore(
  {
    count: 0,
    key: 123,
    time: 0,
  },
  {
    name: "test",
  },
);

function Timer() {
  const [time] = test.useTestStateByKey("time");

  useEffect(() => {
    const interval = setInterval(() => {
      test.setTestStateByKey("time", test.getTestStateByKey("time") + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h1>Time: {time}</h1>
    </div>
  );
}

function Counter() {
  test.useTestHydrate({
    count: 100,
  });
  const [count] = test.useTestStateByKey("count");

  console.log("counter render~~~");

  return <button onClick={() => test.setTestStateByKey("count", count + 1)}>count is {count}</button>;
}

export function Main() {
  return (
    <test.TestProvider>
      <div>
        <a href="https://farmfe.org/" target="_blank">
          <img src={FarmLogo} className="logo" alt="Farm logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Farm + React</h1>
      <Counter />
      <Timer />
      <VecNode />
    </test.TestProvider>
  );
}
