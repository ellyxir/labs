import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.ts";
import { base } from "../shared/styles.ts";

@customElement("os-fab")
export class OsFab extends LitElement {
  static override styles = [
    base,
    css`
      :host {
        --fab-size: calc(var(--u) * 14);
        width: fit-content;
        height: fit-content;
      }

      .fab {
        background-color: var(--bg-3);
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        width: var(--fab-size);
        height: var(--fab-size);
        overflow: hidden;
        position: relative;
        border-radius: calc(var(--fab-size) / 2);

        &::before {
          content: "";
          background-color: var(--bg-scrim);
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          opacity: 0;
          position: absolute;
          pointer-events: none;
          transition: opacity var(--dur-lg) var(--ease-out-expo);
        }

        &:active::before {
          opacity: 1;
        }

        :host([activated]) &::before {
          opacity: 1;
        }
      }
    `,
  ];

  override render() {
    return html`
      <div class="fab">
        <os-ai-icon class="fab-icon" iconsize="lg"></os-ai-icon>
      </div>
    `;
  }
}

@customElement("os-fabgroup")
export class OsFabgroup extends LitElement {
  static override styles = [
    base,
    css`
      :host {
        display: block;
        width: fit-content;
        height: fit-content;
      }

      .fabgroup {
        display: flex;
        flex-direction: column;
        gap: var(--gap-xsm);
        align-items: end;
        overflow: hidden;
      }

      .bubbles {
        display: flex;
        flex-direction: column;
        gap: var(--gap-xsm);
        align-items: end;
      }
    `,
  ];

  @state()
  private expanded = false;

  override render() {
    const onClick = () => {
      this.expanded = !this.expanded;
    };

    const onSubmit = (ev: CustomEvent) => {
      this.expanded = false;

      this.dispatchEvent(new CustomEvent("submit", { detail: ev.detail }));
    };

    return html`
      <div class="fabgroup material-symbols-rounded">
        <div class="bubbles">
          <slot></slot>
        </div>
        ${
      this.expanded
        ? html`<os-ai-box @submit=${onSubmit}></os-ai-box>`
        : html`<os-fab @click=${onClick}></os-fab>`
    }
      </div>
    `;
  }
}

@customElement("os-bubble")
export class OsBubble extends LitElement {
  static override styles = [
    base,
    css`
      :host {
        --height: calc(var(--u) * 11);
        display: block;
        width: fit-content;
        height: fit-content;
      }

      .bubble {
        background-color: var(--bg-3);
        cursor: pointer;
        width: fit-content;
        height: var(--height);
        border-radius: calc(var(--height) / 2);
        padding: 0 calc(var(--u) * 4);
        position: relative;
        overflow: hidden;

        &::before {
          content: "";
          background-color: var(--bg-scrim);
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          opacity: 0;
          position: absolute;
          pointer-events: none;
          transition: opacity var(--dur-lg) var(--ease-out-expo);
        }

        &:active::before {
          opacity: 1;
        }

        :host([activated]) &::before {
          opacity: 1;
        }

        .bubble-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: calc(var(--u) * 90);
        }
      }
    `,
  ];

  @property({ type: String })
  icon = "";

  @property({ type: String })
  text = "";

  override render() {
    return html`
      <div class="bubble hstack gap-xsm material-symbols-rounded">
        <os-icon class="bubble-icon" icon="${this.icon}"></os-icon>
        <div class="bubble-text">${this.text}</div>
      </div>
    `;
  }
}
