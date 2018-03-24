import mongoose from 'mongoose';
import { UserSchema } from '../schemas';

const schema = UserSchema.create();

const User = mongoose.model('User', schema);

export default User;