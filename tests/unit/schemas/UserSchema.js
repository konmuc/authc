/* global intern */
const { assert } = intern.getPlugin('chai');
const { registerSuite } = intern.getInterface('object');

import UserSchema from '../../../src/schemas/UserSchema'

registerSuite('user schema tests', () => {
    return {
        'configure user': async () => {

            const User = UserSchema.create();

            UserSchema.configure({
                address: {
                    type: String,
                }
            });

            const UserModified = UserSchema.create();

            assert.notDeepEqual(User.obj, UserModified.obj);
        }
    }; 
});