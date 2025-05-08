// export default async function handler(req, res) {
//   if (req.method === 'GET') {
//     try {
//       // TODO: Implement logic to fetch notes from your chosen data store (e.g., MongoDB, PostgreSQL, JSON file).
//       // - Connect to the database/data source.
//       // - Fetch all notes.
//       // - Consider sorting notes, e.g., by creation date (descending).
//       // - Replace the example response below with the actual notes.

//       const notes = []; // Example empty array

//       res.status(200).json(notes);
//     } catch (error) {
//       console.error('Error fetching notes:', error);
//       res.status(500).json({ error: 'Failed to fetch notes' });
//     }
//   } else {
//     res.status(405).json({ error: 'Method not allowed' });
//   }
// }

import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../lib/db';
import Note, { INote } from '../../models/Notes';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {

      await connectDB();

    
      const notes: INote[] = await Note.find({}).sort({ createdAt: -1 }).lean()


      const responseNotes = notes.map((note) => ({
        _id: note._id.toString(), 
        localId: note.localId,
        localDeleteSynced: note.localDeleteSynced,
        localEditSynced: note.localEditSynced,
        title: note.title,
        createdAt: note.createdAt,
        tags: note.tags,
      }));

      res.status(200).json(responseNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      res.status(500).json({ error: 'Failed to fetch notes' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}