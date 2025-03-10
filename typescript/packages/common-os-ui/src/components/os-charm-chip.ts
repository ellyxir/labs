import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.ts";
import { base } from "../shared/styles.ts";

@customElement("os-charm-chip")
export class OsCharmChip extends LitElement {
  static override styles = [
    base,
    css`
      :host {
        display: block;
      }

      .os-charm-chip {
        cursor: pointer;
        display: flex;
        align-items: center;
        flex-direction: column;
        width: 100%;
        max-width: calc(var(--u) * 24);
        gap: var(--u);

        .os-charm-chip--text {
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }
      }

      .highlight os-charm-icon {
        border-radius: var(--radius);
        outline: 2px solid black;
      }
    `,
  ];

  @property({ type: String })
  text = "";
  @property({ type: String })
  icon = "";
  @property({ type: Boolean })
  highlight = false;

  override render() {
    return html`
      <div class="os-charm-chip ${this.highlight ? "highlight" : ""}">
        <os-charm-icon icon="${this.icon}"></os-charm-icon>
        <div class="os-charm-chip--text sm">${this.text}</div>
      </div>
    `;
  }
}

@customElement("os-charm-chip-group")
export class OsCharmChipGroup extends LitElement {
  static override styles = [
    base,
    css`
      :host {
        display: block;
      }

      .os-charm-chip-group {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
        align-items: center;
        justify-items: center;
        flex-direction: row;
        column-gap: calc(var(--u) * 2);
        row-gap: calc(var(--u) * 6);
        padding: calc(var(--u) * 3) 0;
      }
    `,
  ];

  @property({ type: String })
  text = "";
  @property({ type: String })
  icon = "";

  override render() {
    return html`
      <div class="os-charm-chip-group">
        <slot></slot>
      </div>
    `;
  }
}
