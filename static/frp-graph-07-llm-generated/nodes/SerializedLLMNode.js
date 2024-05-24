import {
  mergeMap,
  map,
  fromEvent,
  distinct,
  distinctUntilChanged,
  from,
  of,
  filter,
  combineLatest,
  debounceTime,
  share,
  switchMap,
  tap,
  Subject,
  BehaviorSubject,
} from "https://cdn.jsdelivr.net/npm/rxjs@7.8.1/+esm";
import { render, html, debug, log, state, ui } from "../render.js";
import { connect, ground } from "../connect.js";

import { doLLM, extractResponse, generateImage, grabJson } from "../llm.js";
import { imagine } from "../imagine.js";

function LLMNode(input$, inputPromptFn, inputSystemPromptFn) {
  return {
    out: {
      result: input$.pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        switchMap((data) => {
          console.log("data", data);
          return from(doLLM(inputPromptFn(data), inputSystemPromptFn(data)));
        }),
        map(extractResponse),
        map(grabJson),
        share(),
      ),
    },
  };
}

function templateText(template, data) {
  return template.replace(/{{\s*([^{}\s]+)\s*}}/g, (match, key) => {
    return key in data ? data[key] : match;
  });
}

export function SerializedLLMNode({ inputs, outputs }) {
  const inputs$ = Object.keys(inputs).reduce((acc, key) => {
    acc[key] = new BehaviorSubject(inputs[key].shape.default);
    return acc;
  }, {});

  const result$ = new BehaviorSubject({});

  const $llm = combineLatest(Object.values(inputs$))
    .pipe(
      debounceTime(1000),
      distinctUntilChanged(),
      switchMap((_) => {
        const snapshotInputs = Object.keys(inputs$).reduce((acc, key) => {
          acc[key] = inputs$[key].getValue();
          return acc;
        }, {});
        console.log("LLM", snapshotInputs);

        return from(
          doLLM(
            templateText(snapshotInputs.uiPrompt, snapshotInputs),
            templateText(snapshotInputs.systemPrompt, snapshotInputs),
          ),
        );
      }),
      map(extractResponse),
      map(grabJson),
      tap((result) => result$.next(result)),
      share(),
    )
    .subscribe();

  return {
    in: inputs$,
    out: {
      result: result$,
    },
  };
}
