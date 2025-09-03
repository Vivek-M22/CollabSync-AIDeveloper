import mongoose from "mongoose";


function connect() {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => {
            console.log("Connected to MongoDB");
        })
        .catch(err => {
            console.log(err);
        })
}

export default connect;


/*
**`db/db.js`**:
    - **Database Connection Logic**: Contains the function to connect to the MongoDB
     database using Mongoose. Handles connection events (success, error). 
     Reads the database connection string from environment variables

*/