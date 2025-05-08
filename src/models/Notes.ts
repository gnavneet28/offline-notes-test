import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INote extends Document {
  _id: string; 
  localId?: string;
  localDeleteSynced?: boolean;
  localEditSynced?: boolean;
  title: string;
  createdAt: Date;
  tags? : [],
  updatedAt: Date
}

const noteSchema: Schema<INote> = new Schema({
  localId: { type: String },
  localDeleteSynced: { type: Boolean },
  localEditSynced: { type: Boolean },
  title: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  tags: [{ type: String, trim: true, lowercase: true }],
});

noteSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
  });
  
  noteSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updatedAt: new Date() });
    next();
  });

  noteSchema.path('tags').validate(function (tags: string[]) {
    const uniqueTags = new Set(tags);
    return tags.length > 0 ? uniqueTags.size === tags.length : true; 
  }, 'Tags must be unique');
  noteSchema.path('tags').validate(function (tags: string[]) {
    return tags.every((tag) => tag.length > 0);
  }, 'Tags cannot be empty');

noteSchema.index({ tags: 1 });

const Note: Model<INote> = mongoose.models.Note || mongoose.model<INote>('Note', noteSchema);

export default Note;