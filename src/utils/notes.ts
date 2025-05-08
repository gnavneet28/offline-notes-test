

import axios from 'axios';
import {
  storeOfflineNote,
  getOfflineNote,
  getOfflineNotes,
  deleteOfflineNote,
  editOfflineNote,
} from '../../public/indexeddb';

export interface Note {
  _id?: string;
  localId?: string;
  localDeleteSynced?: boolean;
  localEditSynced?: boolean;
  title: string;
  createdAt: Date;
  updatedAt?: Date;
  tags?: string[];
}

function createServerNote(note: Note): Note {
  const serverNote: Note = {
    title: note.title,
    localId: note.localId,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt || new Date(), 
    tags: note.tags || [],
  };
  return serverNote;
}

export function createNote(noteTitle: string, tags: string[]): Note {
  const now = new Date();
  const note: Note = {
    title: noteTitle,
    localId: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now, 
    tags: tags || [],
  };
  return note;
}

export async function submitNote(note: Note): Promise<void> {
  note.updatedAt = new Date();
  await storeOfflineNote(note);

  if (navigator.onLine) {
    try {
      const response = await fetch('/api/save-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createServerNote(note)),
      });

      if (response.ok) {
        console.log('Note submitted successfully (API responded)');
        const data = await response.json();
        note._id = data.id;
        await editOfflineNote(note);
      } else {
        console.error('Failed to submit note');
      }
    } catch (error) {
      console.error('Failed to submit note:', error);
    }
  }
}

export async function deleteNote(noteId: string): Promise<void> {
  try {
    const note = await getOfflineNote(noteId);
    if (note !== undefined) {
      if (note._id === undefined) {
        await deleteOfflineNote(noteId);
      } else {
        if (navigator.onLine) {
          try {
            await deleteOfflineNote(noteId);
            await axios.delete(`/api/delete-note?id=${note._id}`);
          } catch (error) {
            console.error('Error deleting note:', error);
          }
        } else {
          note.localDeleteSynced = false;
          note.updatedAt = new Date();
          await editOfflineNote(note);
        }
      }
    }
  } catch (error) {
    console.error('Failed to delete note:', error);
  }
}

export async function editNote(noteId: string, updatedTitle: string, updatedTags?: string[]): Promise<void> {
  try {
    console.log(updatedTags,"updated tags")
    const note = await getOfflineNote(noteId);
    if (note !== undefined) {
      if (note._id === undefined) {
        note.title = updatedTitle;
        note.tags = updatedTags || note.tags || [];
        note.updatedAt = new Date();
        await editOfflineNote(note);
      } else {
        note.localEditSynced = false;
        if (navigator.onLine) {
          try {
            await axios.put(`/api/edit-note?id=${note._id}`, { title: updatedTitle, tags: updatedTags || note.tags });
            note.title = updatedTitle;
            note.tags = updatedTags || note.tags || [];
            note.localEditSynced = undefined;
            note.updatedAt = new Date();
            await editOfflineNote(note);
          } catch (error) {
            console.error('Error editing note:', error);
          }
        } else {
          note.title = updatedTitle;
          note.tags = updatedTags || note.tags || [];
          note.updatedAt = new Date();
          await editOfflineNote(note);
        }
      }
    }
  } catch (error) {
    console.error('Failed to edit note:', error);
  }
}

export async function updateSavedNote(serverNote: Note, localNotes: Note[]): Promise<void> {
  const matchingSyncedLocalNote = localNotes.find((localNote: Note) => localNote._id === serverNote._id);
  if (matchingSyncedLocalNote === undefined) {
    const matchingUnsyncedLocalNote = localNotes.find(
      (localNote: Note) => localNote.localId === serverNote.localId
    );
    if (matchingUnsyncedLocalNote !== undefined) {
      matchingUnsyncedLocalNote._id = serverNote._id;
      matchingUnsyncedLocalNote.tags = serverNote.tags || [];
      matchingUnsyncedLocalNote.updatedAt = serverNote.updatedAt;
      await editOfflineNote(matchingUnsyncedLocalNote);
    } else {
      serverNote.localId = crypto.randomUUID();
      serverNote.tags = serverNote.tags || [];
      serverNote.updatedAt = serverNote.updatedAt || new Date();
      await storeOfflineNote(serverNote);
    }
  }
}

export async function updateEditedNote(serverNote: Note, localNotes: Note[]): Promise<void> {
  const matchingLocalNote = localNotes.find((localNote: Note) => localNote._id === serverNote._id);
  if (matchingLocalNote !== undefined) {
    if (matchingLocalNote.localEditSynced === false) {
      await axios.put(`/api/edit-note?id=${matchingLocalNote._id}`, {
        title: matchingLocalNote.title,
        tags: matchingLocalNote.tags,
      });
      matchingLocalNote.localEditSynced = undefined;
      matchingLocalNote.updatedAt = new Date();
      await editOfflineNote(matchingLocalNote);
    } else if (matchingLocalNote.localEditSynced === undefined) {
      matchingLocalNote.title = serverNote.title;
      matchingLocalNote.tags = serverNote.tags || [];
      matchingLocalNote.updatedAt = serverNote.updatedAt;
      await editOfflineNote(matchingLocalNote);
    }
  }
}

export async function updateDeletedNote(serverId: string, localNotes: Note[]): Promise<void> {
  const matchingLocalNote = localNotes.find((localNote: Note) => localNote._id === serverId);
  if (matchingLocalNote !== undefined) {
    await deleteOfflineNote(matchingLocalNote.localId!);
  }
}

function arraysEqualIgnoreOrder(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size !== setB.size) return false;
  return [...setA].every((item) => setB.has(item));
}

function detectConflict(localNote: Note, serverNote: Note): boolean {
  if (!localNote.updatedAt || !serverNote.updatedAt) return false;

  const isContentDifferent =
    localNote.title !== serverNote.title ||
    !arraysEqualIgnoreOrder(localNote.tags || [], serverNote.tags || [])

  
  const isConflict =
    localNote.localEditSynced === false &&
    isContentDifferent &&
    Math.abs(localNote.updatedAt.getTime() - serverNote.updatedAt.getTime()) < 1000; // Within 1 second

  if (isConflict) {
    console.warn('Conflict detected for note:', {
      _id: localNote._id,
      local: {
        title: localNote.title,
        tags: localNote.tags,
        updatedAt: localNote.updatedAt,
      },
      server: {
        title: serverNote.title,
        tags: serverNote.tags,
        updatedAt: serverNote.updatedAt,
      },
    });
  }

  return isConflict;
}

export async function refreshNotes(): Promise<void> {
  if (navigator.onLine) {
    try {
      const localNotes = await getOfflineNotes();
      const response = await axios.get('/api/notes');
      const serverNotes: Note[] = response.data;

      for (const localNote of localNotes) {
        const matchingServerNote = serverNotes.find((serverNote) => serverNote._id === localNote._id);

        // Check for conflicts
        if (matchingServerNote && localNote._id && localNote.localEditSynced === false) {
          detectConflict(localNote, matchingServerNote);
        }

        // Handle deleted notes
        if (localNote.localDeleteSynced === false && matchingServerNote) {
          await deleteOfflineNote(localNote.localId!);
          await axios.delete(`/api/delete-note?id=${localNote._id}`);
        }
        // Handle unsynced notes
        else if (localNote._id === undefined) {
          try {
            const submittedNoteResponse = await fetch('/api/save-note', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(createServerNote(localNote)),
            });

            if (submittedNoteResponse.ok) {
              console.log(`Synced local note ${localNote.localId} during refresh.`);
              const data = await submittedNoteResponse.json();
              localNote._id = data.id;
              localNote.updatedAt = new Date();
              await editOfflineNote(localNote);
            } else {
              console.error(`Failed to sync local note ${localNote.localId} during refresh:`, submittedNoteResponse.statusText);
            }
          } catch (error) {
            console.error(`Error syncing local note ${localNote.localId} during refresh:`, error);
          }
        }
      }

      const updatedLocalNotes = await getOfflineNotes();
      const updatedResponse = await axios.get('/api/notes');
      const updatedServerNotes: Note[] = updatedResponse.data;

      for (const serverNote of updatedServerNotes) {
        await updateSavedNote(serverNote, updatedLocalNotes);
        await updateEditedNote(serverNote, updatedLocalNotes);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  }
}

export async function getNotes(): Promise<Note[]> {
  const notes = await getOfflineNotes();
  notes.sort((a: Note, b: Note) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  return notes;
}