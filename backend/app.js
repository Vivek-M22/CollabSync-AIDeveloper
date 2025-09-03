import express from 'express';
import morgan from 'morgan';
import connect from './db/db.js';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import aiRoutes from './routes/ai.routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
connect();


const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use("/ai", aiRoutes)



app.get('/', (req, res) => {
    res.send('Hello World!');
});

export default app; 



/*
app.js
    - **Express App Initialization**: Creates the main Express application instance.
    - **Middleware**: Configures essential middleware:
        - `cors`: Enables Cross-Origin Resource Sharing, allowing the frontend (on a different origin) to communicate with the backend.
        - `express.json()`: Parses incoming JSON request bodies.
        - `express.urlencoded()`: Parses incoming URL-encoded request bodies.
        - Cookie Parser: Parses cookies attached to requests.
        - (Potentially) Logging middleware (like `morgan`).
    - **API Routes**: Mounts the different route handlers (user, project, AI) defined in the `routes/` directory onto specific base paths (e.g., `/api/users`, `/api/projects`, `/api/ai`).
    - **Error Handling**: (Potentially) Sets up global error handling middleware.
    - **Exports**: Exports the configured Express `app` instance to be used by `server.js`.
*/