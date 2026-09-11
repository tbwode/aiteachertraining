import { useState } from 'react';
import type { AvatarWizardDraft } from '../../avatarStorage';

export function useDigitalTextbook(
  updateDraft: (updater: (current: AvatarWizardDraft) => AvatarWizardDraft) => void
) {
  const [editingTextbookId, setEditingTextbookId] = useState<string | null>(null);
  const [textbookInput, setTextbookInput] = useState('');

  const startCreateTextbook = (chapterId: string, currentName = '') => {
    setEditingTextbookId(chapterId);
    setTextbookInput(currentName);
  };

  const submitTextbook = (chapterId: string) => {
    const name = textbookInput.trim();
    if (!name) {
      return;
    }

    updateDraft((current) => {
      const existing = current.digitalTextbooks.find((item) => item.chapterId === chapterId);
      const nextItems = existing
        ? current.digitalTextbooks.map((item) =>
            item.chapterId === chapterId ? { ...item, name, createdAt: item.createdAt } : item
          )
        : [
            ...current.digitalTextbooks,
            {
              id: `tb-${chapterId}-${Date.now()}`,
              chapterId,
              name,
              createdAt: new Date().toISOString().slice(0, 10)
            }
          ];

      return {
        ...current,
        digitalTextbooks: nextItems,
        updatedAt: new Date().toISOString()
      };
    });

    setEditingTextbookId(null);
    setTextbookInput('');
  };

  const deleteTextbook = (chapterId: string) => {
    updateDraft((current) => ({
      ...current,
      digitalTextbooks: current.digitalTextbooks.filter((item) => item.chapterId !== chapterId),
      updatedAt: new Date().toISOString()
    }));
  };

  return {
    editingTextbookId,
    textbookInput,
    setTextbookInput,
    startCreateTextbook,
    submitTextbook,
    deleteTextbook
  };
}
