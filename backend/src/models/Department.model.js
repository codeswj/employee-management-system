import mongoose from "mongoose";
// Define the Department schema
const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        default: "", // Add a description field
    },
    employees: [{ // Array of employee IDs in this department
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
}, { timestamps: true });


export const Department = mongoose.model("Department", departmentSchema);