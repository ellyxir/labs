export const prefillHtml = `<html>
<head>
<script src="https://cdn.tailwindcss.com"></script>
<script crossorigin src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script>
window.onerror = function (message, source, lineno, colno, error) {
  window.parent.postMessage(
    {
      type: "error",
      data: {
        description: message,
        source: source,
        lineno: lineno,
        colno: colno,
        stacktrace: error && error.stack ? error.stack : new Error().stack,
      },
    },
    "*",
  );
  return false;
};

function useDoc(key) {
  const [doc, setDoc] = React.useState(undefined);

  React.useEffect(() => {
    function handleMessage(event) {
      if (
        event.data &&
        event.data.type === "update" &&
        Array.isArray(event.data.data) &&
        event.data.data[0] === key
      ) {
        setDoc(event.data.data[1] === undefined ? null : event.data.data[1]);
      }
    }

    window.addEventListener("message", handleMessage);
    window.parent.postMessage({ type: "subscribe", data: key }, "*");

    return () => {
      window.removeEventListener("message", handleMessage);
      window.parent.postMessage({ type: "unsubscribe", data: key }, "*");
    };
  }, [key]);

  const updateDoc = (newValue) => {
    if (typeof newValue === "function") {
      newValue = newValue(doc);
    }
    window.parent.postMessage({ type: "write", data: [key, newValue] }, "*");
  };

  return [doc, updateDoc];
}

window.llm = (() => {
  const inflight = [];

  async function llm(payload) {
    return new Promise((resolve, reject) => {
      let stringified = JSON.stringify(payload);
      inflight.push([stringified, resolve, reject]);
      window.parent.postMessage({
        type: "llm-request",
        data: stringified,
      }, "*");
    });
  };

  window.addEventListener("message", e => {
    if (e.data.type !== "llm-response") {
      return;
    }
    let { request, data, error } = e.data;
    let index = inflight.findIndex(([payload, res, rej]) => request === payload);
    if (index !== -1) {
      let [_, res, rej] = inflight[index];
      inflight.splice(index, 1);
      if (data) {
        res(data);
      } else {
        rej(data);
      }
    }
  });
  return llm;
})();

window.generateImage = function(prompt) {
  return '/api/ai/img?prompt=' + encodeURIComponent(prompt);
}
</script>
<title>`;

export const systemMd = `generate a complete HTML document within a html block.

<rules>
1. Your output must be a valid, self-contained HTML document that uses complete React components.
2. React and Tailwind are already imported by the host. Do not import them again.
3. Use Tailwind for styling with tasteful, minimal defaults, customizable per user request.
4. No additional libraries unless explicitly requested by the user; if so, load them via CDN.
5. Use the provided SDK (\`useDoc\`, \`llm\`, \`generateImage\`) to handle data, AI requests, and image generation.  Do not use form post or get requests to fetch user data.
6. Handle any data as potentially undefined or changing at any time. Always code defensively (e.g., conditional checks, loading states).
7. When using React refs, handle \`null\` or \`undefined\` cases, and include them in \`useEffect\` dependencies if used for setup.
8. All react code must be contained within a function component.
</rules>

<guide>
# SDK Usage Guide

This guide explains how to integrate the provided SDK functions into your React app. All communication between your iframe app and the parent happens through window messages.

## 1. \`useDoc\` Hook

The \`useDoc\` hook subscribes to real-time updates for a given key and returns a tuple \`[doc, setDoc]\`:

- **\`doc\`**: The current data (which may initially be \`undefined\` while loading, or \`null\` if the data is not found / needs to be initialized).
- **\`setDoc\`**: A function used to update the document data.

The returned \`setDoc\` supports both direct values and updater functions. This means that, similar to how React's \`useState\` works, you can pass a function to compute the new state based on the previous state. If a function is provided, it will be called with the current state (\`doc\`) and its return value will be used as the updated value.

**Example:**

For this schema:

\`\`\`json
{
  "type": "object",
  "properties": {
    "counter": {
      "type": "number",
      "default": 0
    },
    "title": {
      "type": "string",
      "default": "My Counter App"
    }
  }
}
\`\`\`

\`\`\`jsx
function CounterComponent() {
  const [counter, setCounter] = useDoc("counter");
  const [title, setTitle] = useDoc("title");

  // Show loading state when counter is undefined
  if (counter === undefined || title === undefined) {
    return <div>Loading...</div>;
  }

  // Initialize to 0 if counter is null
  if (counter === null) {
    setCounter(0);
    return <div>Initializing...</div>;
  }

  // Initialize to "My Counter App" if title is null
  if (title === null) {
    setTitle("My Counter App");
    return <div>Initializing...</div>;
  }

  return (
    <div>
      <h2>{title}</h2>
      <button onClick={() => setTitle(Math.random().toString(36).substring(2, 15))}>
        Randomize Title
      </button>
      <button onClick={() => setCounter(counter + 1)}>
        Increment
      </button>
      <button onClick={() => setCounter(prev => prev - 1)}>
        Decrement
      </button>
    </div>
  );
}
\`\`\`

## 2. llm Function

**What It Does**

Sends a request to the parent window with a payload object.
Waits for an "llm-response" message from the parent.
You pass a payload with alternating user/assistant content in the "messages" key.
Returns a Promise that resolves with the language model's response or rejects on error.

**Example**:

\`\`\`jsx
async function fetchLLMResponse() {
  const promptPayload = { messages: ['Hi', 'How can I help you today?', 'tell me a joke']};
  try {
    const result = await llm(promptPayload);
    console.log('LLM responded:', result);
  } catch (error) {
    console.error('LLM error:', error);
  }
}
\`\`\`

## 3. generateImage Function

**What It Does**

Accepts a text prompt.
Returns a URL that fetches a dynamically generated image from /api/ai/img.

**Example**:

\`\`\`jsx
function BlogPost(title: string, content: string, prompt: string) {

  return (
    <div>
      <h2>{title}</h2>
      <img src={generateImage(prompt)} />
      <p>{content}</p>
    </div>
  );
}
\`\`\`

## Additional Tips

**Conditional Rendering**: Always check if data is available before rendering. Show a loading state or fallback UI if doc or other data is undefined.

**Message Handling**: You can set up custom postMessage handlers if needed; just remember to remove them on component unmount to avoid memory leaks.

**Reactivity**: When data updates, your components should re-render smoothly. Ensure your state management and effects don't cause unwanted double-renders or race conditions.

By adhering to these guidelines, you'll create a robust, reactive iframe application that integrates seamlessly with the parent environment.
</guide>

<view-model-schema>
SCHEMA
</view-model-schema>`;
