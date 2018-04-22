import { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import { errors } from '../messages';

// The base schema.
var schema = {
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    clients: [
        {
            clientId: {
                type: String,
                required: true
            },
            refreshToken: {
                type: String,
                required: true
            },
            invalidated: Boolean
        }
    ]
};


/**
 * Creates a UserSchema.
 * 
 * @returns {UserSchema}
 */
export function create() {
    
    const UserSchema = new Schema(schema);

    /**
     * Authenticate a user by password.
     * 
     * @param {Object} params
     * @param {String} params.username The username.
     * @param {String} params.password The users password.
     * 
     * @returns {Promise<User>}
     */
    UserSchema.statics.authenticateByPassword = async function({ username, password }) {
        try {
            const { User } = await import('../models');
            const { user } = await User.getByUsername({ username });
    
            // compare the password with the users encrypted password.
            let authenticated = await bcrypt.compare(password, user.password);

            if (!authenticated) {
                let err = new Error(errors.invalid.userOrPassword);
                err.status = 401;
                throw err;
            }

            return { user };
        } catch (err) {
            console.error(err);
            let err2 = new Error(errors.invalid.userOrPassword);
            err2.status = 401;
            throw err2;
        }
    };
    
    /**
     * Authenticate a user by an JWT Access Token.
     * 
     * @param {Object} params
     * @param {String} params.username The username to authenticate
     * @param {String} params.refreshToken The refershToken to get a access token.
     * @param {String} params.clientId The client id which is related to the refresh token.
     * 
     * @returns {Promise<User>}
     */
    UserSchema.statics.authenticateByToken = async function({ refreshToken, clientId }) {
        try {
            const { User } = await import('../models');
            const { user } = await User.getByToken({ refreshToken });
    
            // check if passed clientId and refreshToken are valid for username
            const client = user.clients
                .filter(client => !client.invalidated) // only look at active clients
                .find(client => client.refreshToken === refreshToken && client.clientId === clientId);
            
            // if no client is found, this means wether the requested client was invalidated or
            // there is a missmatch between clientId and refreshToken.
            if (!client) {
                console.warn(`Unknown client=${clientId} for user=${user.username}!`);
    
                throw new Error(errors.client.not.found);
            }
    
            return { user };
        } catch (err) {
            console.error(err);
    
            let err2 = new Error(errors.invalid.token);
            err2.status = 401;
            throw err2;
        }
    };


    /**
     * Verifies if a username already exists.
     * 
     * @param {Object} params
     * @param {String} params.username The username to verify.
     * 
     * @returns {Promise<Boolean>}
     */
    UserSchema.statics.exists = async function({ username }) {
        const { User } = await import('../models');

        return ( await User.findOne({ username }).exec() ) != null;
    };


    /**
     * Fetch a user by its referesh token.
     * 
     * @param {Object} params
     * @param {String} params.refreshToken The user to fetch.
     * 
     * @returns {Promise<User>}
     */
    UserSchema.statics.getByToken = async function({ refreshToken }) {
        try {
            var user;
            try {
                const { User } = await import('../models');
                user = await User.findOne({ 'clients.refreshToken' : refreshToken }).exec();
            } catch (err) {
                console.error(err);
                throw new Error(errors.user.not.found);
            }
    
            if (!user) {
                throw new Error(errors.user.not.found);
            }
    
            return { user };
        } catch (err) {
            err.status = 401;
            throw err;
        }
    };


    /**
     * Fetch a user by its username.
     * 
     * @param {Object} params
     * @param {String} params.username The user to fetch.
     * 
     * @returns {Promise<User>}
     */
    UserSchema.statics.getByUsername = async function({ username }) {
        try {
            var user;
            try {
                const { User } = await import('../models');
                user = await User.findOne({ username }).exec();
            } catch (err) {
                console.error(err);
                throw new Error(errors.user.not.found);
            }
    
            if (!user) {
                throw new Error(errors.user.not.found);
            }
    
            return { user };
        } catch (err) {
            err.status = 401;
            throw err;
        }
    };

    return UserSchema;
}

/**
 * Allows to configure the UserSchema return by create.
 * 
 * @param {Object} config A mongoose schema config, which extends the existing schema.
 * 
 */
export function configure(config = {}) {
    schema = { ...schema, ...config };
}


export default { create, configure };