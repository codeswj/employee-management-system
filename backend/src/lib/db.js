import mongoose from "mongoose";

export async function connectToDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected successfully to MONGODB", conn.connection.host);
  } catch (error) {
    console.log("Error connecting to the Database", error.message);
  }
}
