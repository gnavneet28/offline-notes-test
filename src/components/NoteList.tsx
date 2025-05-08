import { useCallback, useEffect, useState, ChangeEvent } from 'react';
import { Container, Heading } from '../styles/styled';
import { SpinnerContainer } from './LoadingSpinner';
import {
  Note,
  createNote,
  submitNote,
  deleteNote,
  editNote,
  refreshNotes,
  getNotes,
} from '../utils/notes';
import styled from 'styled-components';
import NoteForm from './NoteForm';
import NoteItem from './NoteItem';
import OfflineIndicator from './OfflineIndicator';

const NotesContainer = styled(Container)`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  max-width: 800px;
  margin: 0 auto;
`;

const NoteListWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
`;

const NotesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 1rem;
`;

const NoteListLoadingSpinner = styled(SpinnerContainer)`
  margin: 2rem 0;
`;

const StyledHeading = styled(Heading)`
  margin-bottom: 1.5rem;
  color: #333;
  font-size: 2rem;
  font-weight: 600;
`;

const FilterContainer = styled.div`
  width: 100%;
  max-width: 600px;
  margin-bottom: 1.5rem;
`;

const TagFilterInput = styled.input`
  width: 100%;
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

const TagFilterList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const TagFilterChip = styled.span<{ selected: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  background-color: ${(props) => (props.selected ? '#007AFF' : '#e6f0ff')};
  color: ${(props) => (props.selected ? 'white' : '#007AFF')};
  border-radius: 12px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${(props) => (props.selected ? '#005BB5' : '#d0e0ff')};
  }
`;

const RemoveTagButton = styled.button`
  margin-left: 0.25rem;
  background: none;
  border: none;
  color: inherit;
  font-size: 0.85rem;
  cursor: pointer;
`;

const ClearFiltersButton = styled.button`
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: none;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #007AFF;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #e6f0ff;
  }

  &:disabled {
    color: #999;
    cursor: not-allowed;
  }
`;

export default function NoteList() {
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const getAvailableTags = useCallback(() => {
    const tags = new Set<string>();
    allNotes.forEach((note) => {
      note.tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [allNotes]);

  const filteredNotes = allNotes.filter((note) =>
    filterTags.length === 0 || filterTags.every((tag) => note.tags?.includes(tag))
  );

  const handleNoteSubmit = useCallback(async (noteTitle: string, tags: string[]) => {
    const note: Note = createNote(noteTitle, tags);
    await submitNote(note);
    await fetchNotes();
  }, []);

  const handleNoteDelete = useCallback(async (noteId: string) => {
    await deleteNote(noteId);
    await fetchNotes();
  }, []);

  const handleEditNote = useCallback(
    async (noteId: string, updatedTitle: string, updatedTags?: string[]) => {
      await editNote(noteId, updatedTitle, updatedTags);
      await fetchNotes();
    },
    []
  );

  const fetchNotes = useCallback(async () => {
    if (loading) return; // Prevent concurrent fetches
    setLoading(true);
    try {
      await refreshNotes();
      const notes = await getNotes();
      setAllNotes(notes); // Replace, don’t append
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTagInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTagInput(event.target.value);
  };

  const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && tagInput.trim()) {
      event.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!filterTags.includes(newTag) && getAvailableTags().includes(newTag)) {
        setFilterTags([...filterTags, newTag]);
      }
      setTagInput('');
    }
  };

  const toggleTagFilter = (tag: string) => {
    setFilterTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setFilterTags([]);
    setTagInput('');
  };

  useEffect(() => {
    fetchNotes();

    if ('serviceWorker' in navigator) {
    
      const handleSync = async () => {
        if (!navigator.onLine) {
          console.log('Offline, skipping sync registration');
          return;
        }
        try {
          const registration = await navigator.serviceWorker.ready;
          console.log('Registering sync-notes...');
          await registration.sync.register('sync-notes');
          console.log('Sync event registered successfully');
          await fetchNotes();
        } catch (error) {
          console.error('Sync event registration failed:', error);
        }
      };

      const handleServiceWorkerMessage = (event: MessageEvent) => {
        if (event.data.type === 'SYNC_COMPLETE') {
          console.log('Received SYNC_COMPLETE, refreshing notes');
          fetchNotes(); // Refresh UI after sync
        }
      };

      navigator.serviceWorker
        .register('/sw.js', { type: 'module' })
        .then((registration) => {
          console.log('Service Worker registered:', registration);

         
          if (navigator.onLine) {
            handleSync();
          }

      
          window.addEventListener('online', handleSync);
          navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });


      return () => {
       
        window.removeEventListener('online', handleSync);
        navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
      };
    }
  }, [fetchNotes]);

  return (
    <NotesContainer>
      <StyledHeading>Notes</StyledHeading>
      <NoteListWrapper>
        <NoteForm onNoteSubmit={handleNoteSubmit} />
        <FilterContainer>
          <TagFilterInput
            value={tagInput}
            onChange={handleTagInputChange}
            onKeyDown={handleTagKeyDown}
            placeholder="Filter by tag (press Enter)"
          />
          <TagFilterList>
            {getAvailableTags().map((tag) => (
              <TagFilterChip
                key={tag}
                selected={filterTags.includes(tag)}
                onClick={() => toggleTagFilter(tag)}
              >
                {tag}
                {filterTags.includes(tag) && (
                  <RemoveTagButton
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTagFilter(tag);
                    }}
                  >
                    ×
                  </RemoveTagButton>
                )}
              </TagFilterChip>
            ))}
          </TagFilterList>
          {filterTags.length > 0 && (
            <ClearFiltersButton onClick={clearFilters}>Clear Filters</ClearFiltersButton>
          )}
        </FilterContainer>
        {loading ? (
          <NoteListLoadingSpinner />
        ) : (
          <NotesList>
            {filteredNotes.map((note) => (
              <NoteItem
                key={note.localId}
                note={note}
                onDeleteNote={handleNoteDelete}
                onEditNote={handleEditNote}
              />
            ))}
          </NotesList>
        )}
      </NoteListWrapper>
      <OfflineIndicator />
    </NotesContainer>
  );
}