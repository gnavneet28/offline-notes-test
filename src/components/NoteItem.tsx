import React, { useEffect, useRef, useState, ChangeEvent, KeyboardEvent } from 'react';
import styled from 'styled-components';
import SyncIndicator from './SyncIndicator';
import { Note } from '../utils/notes';
import { Button } from '../styles/styled';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle, faTrash, faEdit, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

const NoteItemWrapper = styled.div`
  margin-bottom: 1rem;
  width: 100%;
  max-width: 600px;
`;

const NoteFrame = styled.li<{ isSubmitted?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: ${(props) => (!props.isSubmitted ? '#f8f9fa' : 'white')};
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
`;

const NoteContent = styled.div`
  width: 100%;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #333;
`;

const NoteTimestamp = styled.p`
  font-size: 0.75rem;
  color: #888;
  margin: 0 0 0.5rem;
`;

const ActionButton = styled(Button)`
  padding: 0.5rem;
  font-size: 0.8rem;
  background: none;
  color: #666;
  transition: all 0.2s ease;

  &:hover {
    color: #007AFF;
    background: none;
  }
`;

const ButtonContainer = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.25rem;
`;

const DeleteButton = styled(ActionButton)`
  /* Removed absolute positioning, now in ButtonContainer */
`;

const EditButton = styled(ActionButton)`
  /* Removed absolute positioning, now in ButtonContainer */
`;

const EditTextarea = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.95rem;
  line-height: 1.5;
  resize: none;
  margin-bottom: 0.5rem;

  &:focus {
    outline: none;
    border-color: #007AFF;
  }
`;

const TagInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
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
  margin-bottom: 0.5rem;
`;

const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  background-color: #e6f0ff;
  color: #007AFF;
  border-radius: 12px;
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

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
`;

const OfflineIndicatorWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-top: 0.5rem;
  gap: 0.25rem;
`;

const OfflineIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #dc3545;
`;

interface NoteItemProps {
  note: Note;
  onDeleteNote: (noteId: string) => Promise<void>;
  onEditNote: (noteId: string, updatedTitle: string, updatedTags?: string[]) => Promise<void>;
}

const NoteItem: React.FC<NoteItemProps> = ({ note, onDeleteNote, onEditNote }) => {
  const [isSyncing, setSyncing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [tags, setTags] = useState<string[]>(note.tags || []);
  const [tagInput, setTagInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleDelete = async () => {
    if (!note.localId) return;
    setSyncing(true);
    try {
      await onDeleteNote(note.localId);
    } catch (error) {
      console.error('Error deleting note:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setTitle(note.title);
    setTags(note.tags || []);
    setTagInput('');
  };

  const handleSave = async () => {
    if (!note.localId) return;
    setSyncing(true);
    try {
      await onEditNote(note.localId, title, [...new Set(tags.map((t: string) => t.trim().toLowerCase()))].filter((t) => t));
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTitle(note.title);
    setTags(note.tags || []);
    setTagInput('');
  };

  const handleTitleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setTitle(e.target.value);
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

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing, title]);

  return (
    <NoteItemWrapper>
      <NoteFrame isSubmitted={note._id !== undefined}>
        {isSyncing && <SyncIndicator />}
        <ButtonContainer>
          <DeleteButton onClick={handleDelete} aria-label="Delete note" disabled={isSyncing}>
            <FontAwesomeIcon icon={faTrash} />
          </DeleteButton>
          {!isEditing && (
            <EditButton onClick={handleEdit} aria-label="Edit note" disabled={isSyncing}>
              <FontAwesomeIcon icon={faEdit} />
            </EditButton>
          )}
        </ButtonContainer>
        <NoteTimestamp>{new Date(note.createdAt).toLocaleString()}</NoteTimestamp>
        {isEditing ? (
          <>
            <EditTextarea
              ref={textareaRef}
              value={title}
              onChange={handleTitleChange}
              autoFocus
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
                <Chip key={tag}>
                  {tag}
                  <RemoveTagButton
                    type="button"
                    onClick={() => removeTag(tag)}
                    disabled={isSyncing}
                    aria-label={`Remove tag ${tag}`}
                  >
                    ×
                  </RemoveTagButton>
                </Chip>
              ))}
            </TagContainer>
            <ButtonGroup>
              <ActionButton onClick={handleSave} aria-label="Save changes" disabled={isSyncing}>
                <FontAwesomeIcon icon={faCheck} />
              </ActionButton>
              <ActionButton onClick={handleCancel} aria-label="Cancel editing" disabled={isSyncing}>
                <FontAwesomeIcon icon={faTimes} />
              </ActionButton>
            </ButtonGroup>
          </>
        ) : (
          <>
            <NoteContent>{note.title}</NoteContent>
            <TagContainer>
              {note.tags?.map((tag) => (
                <Chip key={tag}>{tag}</Chip>
              ))}
            </TagContainer>
          </>
        )}
      </NoteFrame>
      {(note.localDeleteSynced === false || note.localEditSynced === false || note._id === undefined) && (
        <OfflineIndicatorWrapper>
          {note.localDeleteSynced === false && (
            <OfflineIndicator>
              <FontAwesomeIcon icon={faExclamationCircle} />
              <span>Deletion pending sync</span>
            </OfflineIndicator>
          )}
          {note.localEditSynced === false && (
            <OfflineIndicator>
              <FontAwesomeIcon icon={faExclamationCircle} />
              <span>Edit pending sync</span>
            </OfflineIndicator>
          )}
          {note._id === undefined && (
            <OfflineIndicator>
              <FontAwesomeIcon icon={faExclamationCircle} />
              <span>Note pending sync</span>
            </OfflineIndicator>
          )}
        </OfflineIndicatorWrapper>
      )}
    </NoteItemWrapper>
  );
};

export default NoteItem;