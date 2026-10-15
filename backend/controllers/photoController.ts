import { type Request, type Response } from "express";
import fs from "fs/promises";
import path from "path";
import Photo from "../models/Photo";

export const uploadPhoto = async (
    req: Request,
    res: Response
): Promise<void> => {
    let savedFilePath: string | undefined;

    try {
        const { title, description } = req.body;
        
        // Check that all required fields exist
        if (typeof title !== "string" || !title.trim() || typeof description !== "string" || !description.trim()) {
            res.status(400).json({
                message: "Title and description are required.",
            });
            return;
        }

        // Check whether a photo was uploaded
        if (!req.file) {
            res.status(400).json({
                message: "Please select a photo to upload.",
            });
            return;
        }

        savedFilePath = req.file.path;

        // Create the URL used to access the image
        const imageUrl = `/uploads/${req.file.filename}`;

        // Save photo details in MongoDB
        const photo = await Photo.create({
            title: title.trim(),
            description: description.trim(),
            imageUrl,
        });

        res.status(201).json({
            message: "Photo uploaded successfully.",
            photo,
        });
    } catch (error) {
        // Remove the uploaded file if saving its details fails
        if (savedFilePath) {
            try {
                await fs.unlink(savedFilePath);
            } catch (cleanupError) {
                console.error("Could not remove uploaded file:", cleanupError);
            }
        }
        console.error("Photo upload error:", error);

        res.status(500).json({
            message: "Could not upload the photo.",
        });
    }
};