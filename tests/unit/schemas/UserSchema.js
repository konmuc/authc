/* global intern */
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import UserSchema from '../../../src/schemas/UserSchema';
import User from '../../../src/models/User';

const { assert } = intern.getPlugin('chai');
const { registerSuite } = intern.getInterface('object');

registerSuite('user schema tests', () => {
    const USERNAME = 'testuser';
    const REFRESH_TOKEN = 'testtoken';
    const CLIENT_ID = 'testclientid';
    var PASSWORD = 'testpassword';

    return {
        
        async before() {
            await mongoose.connect('mongodb://localhost/authctest');
            

            // first try to fetch the test user.
            let user = await User.findOne({ username: USERNAME }).exec();

            // if the user exists, remove the user.
            if (user) {
                await user.remove();
                user = null;
            }

            let password = await bcrypt.hash(PASSWORD, 10);

            // then create a new one.
            user = new User({
                username: USERNAME,
                password: password,
                clients: [
                    {
                        clientId: CLIENT_ID,
                        refreshToken: REFRESH_TOKEN,
                        invalidated: false
                    }
                ]
            });

            console.info('Save test user.');
            return user.save();
        },


        async after() {
            console.info('Fetch user to remove.');
            let user = await User.findOne({ username: USERNAME }).exec();
    
            console.info('Remove user.');
            return user.remove();
        },


        tests: {
            'configure user schema': () => {
                const Schema = UserSchema.create();
    
                UserSchema.configure({
                    address: {
                        type: String,
                    }
                });
    
                const ModifiedSchema = UserSchema.create();
    
                assert.notDeepEqual(Schema.obj, ModifiedSchema.obj);
            },
    
    
            'get user by username': async() => {
                let { user } = await User.getByUsername({ username: USERNAME });
    
                assert.isNotNull(user);
            },
    
    
            'get user by refereshToken': async() => {
                let { user } = await User.getByToken({ refreshToken: REFRESH_TOKEN });
    
                assert.isNotNull(user);
            },


            'authenticate by username and password': async() => {
                let { user } = await User.authenticateByPassword({ username: USERNAME, password: PASSWORD });

                assert.isNotNull(user);
            },


            'authenticate with wrong username and correct password': async() => {
                let error;
                
                try {
                    await User.authenticateByPassword({ username: 'invalid', password: PASSWORD });
                } catch (err) {
                    error = err;
                }

                assert.isNotNull(error);
            },


            'authenticate with correct username and wrong password': async() => {
                let error;
                
                try {
                    await User.authenticateByPassword({ username: USERNAME, password: PASSWORD });
                } catch (err) {
                    error = err;
                }

                assert.isNotNull(error);
            },


            'authenticate by refreshToken and clientId': async() => {
                let { user } = await User.authenticateByToken({ refreshToken: REFRESH_TOKEN, clientId: CLIENT_ID });

                assert.isNotNull(user);
            },


            'authenticate by wrong refreshToken and correct clientId': async() => {
                let error; 

                try {
                    await User.authenticateByToken({ refreshToken: 'invalid', clientId: CLIENT_ID });
                } catch (err) {
                    error = err;
                }

                assert.isNotNull(error);
            },


            'authenticate by correct refreshToken and wrong clientId': async() => {
                let error; 

                try {
                    await User.authenticateByToken({ refreshToken: REFRESH_TOKEN, clientId: 'invalid' });
                } catch (err) {
                    error = err;
                }

                assert.isNotNull(error);
            }
        }
    }; 
});