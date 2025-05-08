

import React, { useState, ChangeEvent, KeyboardEvent } from 'react';
import styled from 'styled-components';
import { LoadingSpinner } from './LoadingSpinner';
import { Button } from '../styles/styled';

const NoteFormContainer = styled.form`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
`;

const NoteInput = styled.textarea`
  flex: 1;
  height: 40px;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.95rem;
  resize: none;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #007AFF;
  }

  &::placeholder {
    color: #999;
  }
`;

const TagInput = styled.input`
  flex: 1;
  height: 40px;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #007AFF;
  }

  &::placeholder {
    color: #999;
  }
`;

const TagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  background-color: #e6f0ff;
  color: #007AFF;
  border-radius: 4px;
  font-size: 0.85rem;
`;

const RemoveTagButton = styled.button`
  margin-left: 0.25rem;
  background: none;
  border: none;
  color: #007AFF;
  font-size: 0.85rem;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: #005BB5;
  }

  &:disabled {
    color: #999;
    cursor: not-allowed;
  }
`;

const AddNoteButton = styled(Button)`
  height: 40px;
  padding: 0 1.25rem;
  border-radius: 6px;
  font-size: 0.95rem;
  background-color: #007AFF;
  color: white;
  transition: opacity 0.2s;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

interface NoteFormProps {
  onNoteSubmit: (noteTitle: string, tags: string[]) => Promise<void>;
}

const NoteForm: React.FC<NoteFormProps> = ({ onNoteSubmit }) => {
  const [isSyncing, setSyncing] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const handleNoteTitleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setNoteTitle(event.target.value);
  };

  const handleTagInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTagInput(event.target.value);
  };

  const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && tagInput.trim()) {
      event.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (noteTitle.trim() === '') return;

    try {
      setSyncing(true);
     
      await onNoteSubmit(noteTitle, [...new Set(tags.map((t: string) => t.trim().toLowerCase()))].filter((t) => t));
      setNoteTitle('');
      setTags([]);
      setTagInput('');
    } catch (error) {
      console.error('Failed to submit note:', error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <NoteFormContainer onSubmit={handleSubmit}>
      <NoteInput
        value={noteTitle}
        onChange={handleNoteTitleChange}
        placeholder="Write a note..."
        disabled={isSyncing}
      />
      <TagInput
        value={tagInput}
        onChange={handleTagInputChange}
        onKeyDown={handleTagKeyDown}
        placeholder="Add tag and press Enter"
        disabled={isSyncing}
      />
      <TagContainer>
        {tags.map((tag) => (
          <Tag key={tag}>
            {tag}
            <RemoveTagButton
              type="button"
              onClick={() => removeTag(tag)}
              disabled={isSyncing}
            >
              ×
            </RemoveTagButton>
          </Tag>
        ))}
      </TagContainer>
      <AddNoteButton type="submit" disabled={isSyncing || !noteTitle.trim()}>
        {isSyncing ? <LoadingSpinner /> : 'Add'}
      </AddNoteButton>
    </NoteFormContainer>
  );
};

export default NoteForm;