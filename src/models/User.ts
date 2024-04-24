// src/models/User.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    telegram_id: string;
    username: string;
    address: string;
    pkey: string;
}

const UserSchema: Schema<IUser> = new Schema({
    telegram_id: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    address: { type: String, required: true },
    pkey: { type: String, required: true }
});

export const User = mongoose.model<IUser>('users', UserSchema);
