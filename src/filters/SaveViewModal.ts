import { App, Modal, Setting } from 'obsidian';

import { t } from '../lang/helpers';

export function confirmAction(app: App, message: string, confirmLabel: string): Promise<boolean> {
  return new Promise((resolve) => {
    const modal = new (class extends Modal {
      confirmed = false;

      onOpen() {
        this.contentEl.createEl('p', { text: message });
        new Setting(this.contentEl)
          .addButton((b) => b.setButtonText(t('Cancel')).onClick(() => this.close()))
          .addButton((b) =>
            b
              .setButtonText(confirmLabel)
              .setWarning()
              .onClick(() => {
                this.confirmed = true;
                this.close();
              })
          );
      }

      onClose() {
        resolve(this.confirmed);
      }
    })(app);
    modal.open();
  });
}

export function promptViewName(app: App, initial: string, taken: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    const modal = new (class extends Modal {
      value = initial;
      result: string | null = null;

      onOpen() {
        this.titleEl.setText(t('View name'));
        const err = this.contentEl.createDiv({ cls: 'mod-warning' });
        const submit = () => {
          const name = this.value.trim();
          const dup = taken.some((n) => n.toLowerCase() === name.toLowerCase());
          if (!name) return;
          if (dup) {
            err.setText(t('A view with this name already exists.'));
            return;
          }
          this.result = name;
          this.close();
        };
        new Setting(this.contentEl).addText((txt) => {
          txt.setValue(initial).onChange((v) => (this.value = v));
          txt.inputEl.addEventListener('keydown', (e) => e.key === 'Enter' && submit());
          window.setTimeout(() => txt.inputEl.focus(), 0);
        });
        new Setting(this.contentEl).addButton((b) =>
          b.setButtonText(t('Save view')).setCta().onClick(submit)
        );
      }

      onClose() {
        resolve(this.result);
      }
    })(app);
    modal.open();
  });
}
