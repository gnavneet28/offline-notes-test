
// export default async function handler(req, res) {
//   if (req.method === 'POST') {
//     try {
//       const noteData = req.body;

//       // Basic validation (optional, but good practice)
//       if (!noteData || !noteData.title || !noteData.localId || !noteData.createdAt) {
//         return res.status(400).json({ error: 'Invalid note data' });
//       }

//       // TODO: Implement logic to save the note to your chosen data store.
//       // - Connect to the database/data source.
//       // - Save the noteData object.
//       // - Retrieve the unique identifier assigned by the data store (e.g., MongoDB _id, SQL primary key).
//       // - Replace the example response below with the actual assigned identifier.
      
//       const insertedId = noteData.localId; // Placeholder: Use localId as temporary example ID

//       // Respond with the identifier the client expects
//       res.status(200).json({ insertedId: insertedId });
//     } catch (error) {
//       console.error('Error saving note:', error);
//       res.status(500).json({ error: 'Failed to save note' });
//     }
//   } else {
//     res.status(405).json({ error: 'Method not allowed' });
//   }
// }

import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../lib/db';
import Note, { INote } from '../../models/Notes';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const noteData = req.body;

      if (!noteData || !noteData.title || !noteData.localId || !noteData.createdAt) {
        return res.status(400).json({ error: 'Invalid note data' });
      }

      await connectDB();

      const note = new Note({
        localId: noteData.localId,
        title: noteData.title,
        createdAt: new Date(noteData.createdAt),
        localDeleteSynced: noteData.localDeleteSynced ?? true, 
        localEditSynced: noteData.localEditSynced ?? true, 
        updatedAt: new Date(), 
        tags: noteData.tags
      });

      const savedNote: INote = await note.save();

      res.status(200).json({ id: savedNote._id.toString() });
    } catch (error) {
      console.error('Error saving note:', error);
      res.status(500).json({ error: 'Failed to save note' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}