import { h } from "@commontools/common-html";
import {
  recipe,
  lift,
  UI,
  OpaqueRef,
  render,
  NAME,
  cell,
} from "@commontools/common-builder";
import { z } from "zod";

const compute: <T>(fn: () => T) => OpaqueRef<T> = (fn: () => any) =>
  lift(fn)(undefined);

// This currently breaks because below we call this with `counter({ count: 0 })`
// and that is static data in the generated recipe. The issue is that by
// treating the lift as a recipe, we're now breaking the assumption that (non
// reference) inputs are immutable.
//
// Should we break that assumption in general? That means a lot of extra cells
// that capture static inputs that are otherwise unncessary: Essentially all
// input cells become part of the (internal?) state.
//
// Should we instead create a new type of node? Arguably handler cells that get
// passed an initial cell like this would like to behave this way, and we want
// to differentiate them anyway. But that also assumed they only get called with
// events! Are we going to violate an invariant? Here we don't because the
// change will happen in an event handler, but this is difficult to extract.
//
// Maybe event handlers should copy state then? The tricky part is that this is
// input state that will be referred to elsewhere. We can't just copy it, we
// need to modify it upstream.
//
// And we don't even know statically that this could happen.
//
// So maybe we just make all input cells mutable, but otherwise disallow writing
// in the default case. The logic is essentially that references to the state
// can be sent out, and might be writeable.
//
// Let's do that (copy all this into the learnings doc).
//
// So at recipe creation time, if there is any static data, move it to
// internal/initial and set the input to just be a reference to that. This will
// mix query and data still, but let's live with it for now. Solving it requires
// deciding whether the other things are cell references or aliases. I.e. if a
// reference to parent state is passed down, should changes propagate or do we
// overwrite the state. That's another example for the learnings doc. Let's see
// what we conclude on writing. Read-only I think references and aliases work
// the same way, so I feel that maybe it should just be references then? Hmm!
export const counter = lift<{ count: number }>(state => {
  return render(() => (
    <div>
      [
      <button
        onclick={() => {
          console.log("clicked", state.count);
          state.count = state.count + 1;
        }}
      >
        #{`${state.count}`} - {state.count}
      </button>
      ]
    </div>
  ));
});

export default lift(
  z
    .object({ test: z.string().default("Test string") })
    .describe("Closures experiment"),
  z.object({}),
  ({ test }) => {
    // Just test data
    const list = compute(() => [1, 2, 3]);

    // Closure to compute
    const concat = compute(() => "Hello " + test);

    // Closure using something generated by another closure
    const ui = compute(() => <div>{`${concat}`}!</div>);

    // The inner function is a recipe, so this worked before
    const listUI = list.map(item => <li>#{item}</li>);

    // Now let's do a computation closure inside the recipe closure!
    const listUI2 = list.map(item => (
      <li>
        {compute(() => (
          <span>#{item * 2}</span>
        ))}
      </li>
    ));

    const counterUI = counter(cell({ count: 0 })); // cell() so that it's mutable

    return {
      [NAME]: `closures with ${test}`,
      [UI]: (
        <div>
          <div>Test string:{ui}</div>
          <div>List 1:</div>
          <ul>{listUI}</ul>
          <div>List 2:</div>
          <ul>{listUI2}</ul>
          <div>Counter:</div>
          <div>{counterUI}</div>
        </div>
      ),
    };
  },
);
