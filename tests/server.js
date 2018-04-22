import mongoose from 'mongoose';
import express from 'express';
import logger from 'morgan';
import bodyParser from 'body-parser';

import auth from '../src/index';
import authRouter from '../src/router';

const port = 9999;

export default async function run() {
    await mongoose.connect('mongodb://localhost/authctest');

    return new Promise((resolve) => {
        // create an app instance
        const app = express();
        // disable x-powered-by header
        app.disable('x-powered-by');
        // register logging middleware
        app.use(logger('dev', {
            skip: () => app.get('env') === 'test'
        }));

        // register json middleware
        app.use(bodyParser.json());
        // register urlencoded middleware
        app.use(bodyParser.urlencoded({ extended: false }));

        // register the auth routes for signin, signup, etc..
        app.use('/', authRouter);
        
        // register the auth middleware
        app.use(auth({ secret: 'secret' }));

        app.get('/', (req, res) => {
            return res.status(200).json({ status: 200 , secured: true });
        });

        // Catch 404 and forward to error handler
        app.use((req, res, next) => {
            const err = new Error('Resource not Found');
            err.status = 404;
            next(err);
        });

        // Error handler
        app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
            let { status = 500, message } = err;
            console.error(err);
            if (status === 500) message = 'An internal server error occured.';
            res.status(status).send({ status, message });
        });

        app.listen(port, () => { console.info(`Listening on port ${port}`); resolve() });
    });
}