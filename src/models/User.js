import mongoose from 'mongoose';
import UserSchema from '../schemas/UserSchema';

const schema = UserSchema.create();


const User = mongoose.model('User', schema);

export default User;