// This is all you need to import/register the @commontools/ui web components
import "@commontools/ui";
import { setIframeContextHandler } from "@commontools/iframe-sandbox";
import { Action, ReactivityLog, addAction, removeAction } from "@commontools/runner";
import { CharmRunner } from "@/components/CharmRunner";
import { useState } from "react";

// FIXME(ja): perhaps this could be in common-charm?  needed to enable iframe with sandboxing
setIframeContextHandler({
  read(context: any, key: string): any {
    return context?.getAsQueryResult ? context?.getAsQueryResult([key]) : context?.[key];
  },
  write(context: any, key: string, value: any) {
    context.getAsQueryResult()[key] = value;
  },
  subscribe(context: any, key: string, callback: (key: string, value: any) => void): any {
    const action: Action = (log: ReactivityLog) =>
      callback(key, context.getAsQueryResult([key], log));

    addAction(action);
    return action;
  },
  unsubscribe(_context: any, receipt: any) {
    removeAction(receipt);
  },
});

export default function Shell() {
  const [count, setCount] = useState(0);

  const incrementCount = () => {
    setCount((c) => c + 1);
  };

  return (
    <div className="h-full relative">
      <button onClick={incrementCount} className="mb-4 px-4 py-2 bg-blue-500 text-white rounded">
        Increment Count ({count})
      </button>

      <CharmRunner
        charmImport={() => import("@/recipes/smol.tsx")}
        argument={{ count }}
        className="border border-red-500 mt-4 p-2"
        autoLoad
      />
    </div>
  );
}
