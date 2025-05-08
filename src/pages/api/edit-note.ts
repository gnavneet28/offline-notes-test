
// export default async function handler(req, res) {
//   if (req.method === 'PUT') {
//     try {
//       const { id } = req.query; // ID of the note to edit (likely localId stored as _id by client)
//       const { title: noteTitle } = req.body; // New title

//       if (!id || typeof noteTitle !== 'string') {
//         return res.status(400).json({ error: 'Missing note ID or title' });
//       }

//       // TODO: Implement logic to update the note in your chosen data store.
//       // - Connect to the database/data source.
//       // - Find the note by its unique identifier (`id`).
//       // - Update the note's title to `noteTitle`.
//       // - Handle the case where the note is not found.
//       // - Replace the example response below.

//       const noteFound = true; // Placeholder

//       if (noteFound) {
//         res.status(200).json({ message: 'Note edited successfully' });
//       } else {
//         res.status(404).json({ error: 'Note not found' });
//       }
//     } catch (error) {
//       console.error('Error editing note:', error);
//       res.status(500).json({ error: 'Failed to edit note' });
//     }
//   } else {
//     res.status(405).json({ error: 'Method not allowed' });
//   }
// }

import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../lib/db';
import Note, { INote } from '../../models/Notes';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'PUT') {
    try {
      const { id } = req.query; 
      const { title: noteTitle, tags } = req.body; // New title

      if (!id || typeof noteTitle !== 'string') {
        return res.status(400).json({ error: 'Missing note ID or title' });
      }

      await connectDB();

      const note: INote | null = await Note.findByIdAndUpdate(
        id,
        { title: noteTitle,tags, updatedAt: new Date() }, 
        { new: true } 
      );

      if (note) {
        res.status(200).json({ message: 'Note edited successfully' });
      } else {
        res.status(404).json({ error: 'Note not found' });
      }
    } catch (error) {
      console.error('Error editing note:', error);
      res.status(500).json({ error: 'Failed to edit note' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}