import { h, behavior, Reference, select, $ } from "@commontools/common-system";
import { event, events, set, addTag, field, isEmpty } from "../sugar.js";
import { Description } from "./stickers/describe.jsx";
import { mixin } from "../sugar/mixin.js";

export const genImage = (prompt: string) =>
  `/api/img/?prompt=${encodeURIComponent(prompt)}`;

export function generateDescription({
  time,
  hunger,
  size,
  color,
  description,
}: {
  time: number;
  hunger: number;
  size: number;
  color: string;
  description: string;
}) {
  const ageDesc =
    time < 5
      ? "very young"
      : time < 10
        ? "young"
        : time < 20
          ? "mature"
          : "old";
  const hungerDesc =
    hunger < 2
      ? "satisfied"
      : hunger < 4
        ? "peckish"
        : hunger < 6
          ? "hungry"
          : "starving";
  const sizeDesc =
    size < 3
      ? "tiny"
      : size < 6
        ? "medium-sized"
        : size < 10
          ? "large"
          : "huge";

  return (
    `Your ${color} ${sizeDesc} ${description} is ${ageDesc} and feeling ${hungerDesc}. ` +
    `They've been around for ${time} time units and have grown to size ${size}.`
  );
}
function TamagotchiView({
  self,
  time,
  size,
  color,
  description,
  hunger,
}: {
  self: Reference;
  time: number;
  size: number;
  color: string;
  description: string;
  hunger: number;
}) {
  const frameStyle = `
    background: #ff3232;
    border-radius: 35px;
    padding: 40px 30px 80px 30px;
    max-width: 400px;
    box-shadow:
      inset -2px -2px 10px rgba(0,0,0,0.3),
      inset 2px 2px 10px rgba(255,255,255,0.2),
      5px 5px 20px rgba(0,0,0,0.3);
    position: relative;
  `;

  const screenStyle = `
    background: #707070;
    border-radius: 8px;
    padding: 20px;
    border: 8px solid #404040;
    margin-bottom: 20px;
    position: relative;
    box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
  `;

  const statsStyle = `
    font-family: "LCD", monospace;
    font-size: 16px;
    color: #111;
    margin-bottom: 10px;
    text-align: center;
    font-weight: bold;
    background: #aaa;
    padding: 8px;
    border-radius: 4px;
  `;

  const bubbleStyle = `
    position: absolute;
    top: -40px;
    left: 50%;
    transform: translateX(-50%);
    background: #111;
    color: #0f0;
    padding: 10px;
    border-radius: 15px;
    box-shadow: inset 0 0 5px rgba(0,255,0,0.5);
  `;

  const bubbleArrowStyle = `
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    border-width: 10px 10px 0;
    border-style: solid;
    border-color: #111 transparent;
  `;

  const buttonContainerStyle = `
    position: absolute;
    bottom: 20px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-around;
    padding: 0 30px;
  `;

  const buttonStyle = `
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #cc0000;
    border: none;
    color: white;
    font-size: 10px;
    cursor: pointer;
    box-shadow:
      inset 2px 2px 5px rgba(255,255,255,0.3),
      inset -2px -2px 5px rgba(0,0,0,0.3),
      2px 2px 5px rgba(0,0,0,0.2);
    &:active {
      box-shadow:
        inset -2px -2px 5px rgba(255,255,255,0.3),
        inset 2px 2px 5px rgba(0,0,0,0.3);
    }
  `;

  const speechBubbleStyle = `
    position: relative;
    background: #111;
    color: #0f0;
    padding: 10px;
    border-radius: 15px;
    box-shadow: inset 0 0 5px rgba(0,255,0,0.5);
    margin-top: -32px;
    margin-left: 16px;
    margin-right: 16px;
    font-size: 12px;
  `;

  return (
    <div title={"Tamagotchi"} entity={self} style={frameStyle}>
      <div style={screenStyle}>
        <div style={bubbleStyle}>
          {description}
        </div>
        <div style={statsStyle}>
          TIME: {time} | HUNGER: {hunger} | SIZE: {size}
        </div>
        <img
          style="width: 100%; aspect-ratio: 1; border-radius: 8px; box-shadow: inset 0 0 10px rgba(0,0,0,0.5);"
          src={genImage(
            generateDescription({ time, size, color, description, hunger }),
          )}
        />
        <div style={speechBubbleStyle}>
          {generateDescription({ time, size, color, description, hunger })}
        </div>
      </div>
      <div style={buttonContainerStyle}>
        <button style={buttonStyle} onclick={TamagotchiEvents.onAdvanceTime}>Wait</button>
        <button style={buttonStyle} onclick={TamagotchiEvents.onGiveFood}>Feed</button>
        <button style={buttonStyle} onclick={TamagotchiEvents.onExercise}>Move</button>
        <button style={buttonStyle} onclick={TamagotchiEvents.onBroadcast}>Send</button>
      </div>
    </div>
  );
}

function Footer({ }: {}) {
  return null;
}

// queries can be declared in piecemeal fashion and composed together later

export const hunger = field("hunger", 0);
export const size = field("size", 1);
export const time = field("time", 0);
export const description = field("description", "lizard bunny");
export const color = field("color", "blue");

export const Creature = description
  .with(hunger)
  .with(size)
  .with(time)
  .with(color);

const TamagotchiEvents = events({
  onAdvanceTime: "~/on/advanceTime",
  onGiveFood: "~/on/giveFood",
  onExercise: "~/on/exercise",
  onBroadcast: "~/on/broadcast",
});

export const tamagotchi = behavior({
  ...mixin(
    Description(
      ["hunger", "size", "time", "color", "description"],
      (self: any) =>
        `Come up with a cool description for this creature in one sentence: ${generateDescription(self)}`,
    ),
  ),

  emptyRule: select({ self: $.self })
    .clause(isEmpty($.self, 'hunger'))
    .clause(isEmpty($.self, 'size'))
    .clause(isEmpty($.self, 'time'))
    .update(({ self }) =>
      set(self, {
        hunger: 0,
        size: 1,
        time: 0,
        color: "blue",
        description: "lizard bunny",
      })
    )
    .commit(),

  view: Creature.render(TamagotchiView).commit(),

  // NOTE(ja): is there a way to only have this advance time - and
  // all the other events should only deal with non-time related changes?
  advanceTime: event(TamagotchiEvents.onAdvanceTime)
    .with(time)
    .update(({ self, time }) => set(self, { time: time + 1 }))
    .commit(),

  tickHunger: event(TamagotchiEvents.onAdvanceTime)
    .with(hunger)
    .update(({ self, hunger }) => set(self, { hunger: hunger + 1 }))
    .commit(),

  feed: event(TamagotchiEvents.onGiveFood)
    .with(hunger)
    .with(time)
    .update(({ self, hunger, time }) =>
      set(self, {
        hunger: Math.max(0, hunger - 1),
        time: time + 1,
      }),
    )
    .commit(),

  exercise: event(TamagotchiEvents.onExercise)
    .with(hunger)
    .with(time)
    .with(size)
    .update(({ self, hunger, time, size }) =>
      set(self, {
        hunger: hunger + 1,
        time: time + 1,
        size: size + 1,
      }),
    )
    .commit(),

  broadcast: event(TamagotchiEvents.onBroadcast)
    .update(({ self }) => addTag(self, "#tamagotchi"))
    .commit(),
});

console.log(tamagotchi);

export const spawn = (source: {} = { tamagotchi: 1 }) =>
  tamagotchi.spawn(source, "Tamagotchi");
