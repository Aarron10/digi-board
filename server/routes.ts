import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertAnnouncementSchema, insertAssignmentSchema, insertMaterialSchema, insertEventSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { hashPassword } from "./auth";
import { upload, getFileUrl } from "./file-upload";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Announcements routes
  app.get("/api/announcements", async (req, res, next) => {
    try {
      const announcements = await storage.getAllAnnouncements();
      res.json(announcements);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/announcements", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const user = req.user as Express.User;
      
      // Only teachers and admins can create announcements
      if (user.role !== "teacher" && user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized role" });
      }
      
      const validatedData = insertAnnouncementSchema.parse({
        ...req.body,
        authorId: user.id,
      });
      
      const announcement = await storage.createAnnouncement(validatedData);
      res.status(201).json(announcement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/announcements/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const announcement = await storage.getAnnouncement(id);
      
      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      
      res.json(announcement);
    } catch (error) {
      next(error);
    }
  });

  // Assignments routes
  app.get("/api/assignments", async (req, res, next) => {
    try {
      const assignments = await storage.getAllAssignments();
      res.json(assignments);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/assignments", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const user = req.user as Express.User;
      
      // Only teachers and admins can create assignments
      if (user.role !== "teacher" && user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized role" });
      }
      
      const validatedData = insertAssignmentSchema.parse({
        ...req.body,
        teacherId: user.id,
      });
      
      const assignment = await storage.createAssignment(validatedData);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/assignments/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const assignment = await storage.getAssignment(id);
      
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      res.json(assignment);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/assignments/teacher/:teacherId", async (req, res, next) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      const assignments = await storage.getAssignmentsByTeacher(teacherId);
      res.json(assignments);
    } catch (error) {
      next(error);
    }
  });

  // Materials routes
  app.get("/api/materials", async (req, res, next) => {
    try {
      const materials = await storage.getAllMaterials();
      res.json(materials);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/materials", upload.single("file"), async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const user = req.user as Express.User;
      
      // Only teachers and admins can create materials
      if (user.role !== "teacher" && user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized role" });
      }

      // Get file URL if file was uploaded
      const fileUrl = req.file ? getFileUrl(req.file.filename) : undefined;
      
      const validatedData = insertMaterialSchema.parse({
        ...req.body,
        teacherId: user.id,
        fileUrl,
      });
      
      const material = await storage.createMaterial(validatedData);
      res.status(201).json(material);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/materials/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const material = await storage.getMaterial(id);
      
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      
      res.json(material);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/materials/teacher/:teacherId", async (req, res, next) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      const materials = await storage.getMaterialsByTeacher(teacherId);
      res.json(materials);
    } catch (error) {
      next(error);
    }
  });

  // Delete routes
  app.delete("/api/announcements/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const user = req.user as Express.User;
      
      // Only teachers and admins can delete announcements
      if (user.role !== "teacher" && user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized role" });
      }
      
      const id = parseInt(req.params.id);
      await storage.deleteAnnouncement(id);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/assignments/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const user = req.user as Express.User;
      
      // Only teachers and admins can delete assignments
      if (user.role !== "teacher" && user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized role" });
      }
      
      const id = parseInt(req.params.id);
      await storage.deleteAssignment(id);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/materials/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const user = req.user as Express.User;
      
      // Only teachers and admins can delete materials
      if (user.role !== "teacher" && user?.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized role" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid material ID" });
      }
      
      // Get the material first to get the file path
      const material = await storage.getMaterial(id);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      
      // Delete the file if it exists
      if (material.fileUrl) {
        const filename = material.fileUrl.split('/').pop();
        if (filename) {
          const filePath = path.join(__dirname, 'fileuploads', filename);
          try {
            // Check if file exists before trying to delete
            if (fs.existsSync(filePath)) {
              await fs.promises.unlink(filePath);
            }
          } catch (error) {
            console.error('Error deleting file:', error);
            // Continue with material deletion even if file deletion fails
          }
        }
      }
      
      // Delete the material record
      await storage.deleteMaterial(id);
      
      // Send a proper response with no content
      res.setHeader('Content-Length', '0');
      res.status(204).end();
    } catch (error) {
      console.error('Error in material deletion:', error);
      res.status(500).json({ 
        message: "An error occurred while deleting the material",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Events routes
  app.get("/api/events", async (req, res, next) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/events", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const user = req.user as Express.User;
      
      // Only teachers and admins can create events
      if (user.role !== "teacher" && user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized role" });
      }
      
      const validatedData = insertEventSchema.parse({
        ...req.body,
        createdBy: user.id,
      });
      
      const event = await storage.createEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/events/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getEvent(id);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      next(error);
    }
  });
  
  // User management routes (admin only)
  app.get("/api/users", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const user = req.user as Express.User;
      
      // Only admins can list all users
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized role" });
      }
      
      const users = await storage.getAllUsers();
      // Remove passwords before sending
      const sanitizedUsers = users.map(({ password, ...userWithoutPassword }) => userWithoutPassword);
      res.json(sanitizedUsers);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/users", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const currentUser = req.user as Express.User;
      
      // Only admins can create users
      if (currentUser.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized role" });
      }
      
      // Validate the new user data
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(validatedData.password);
      
      // Create the user
      const newUser = await storage.createUser({
        ...validatedData,
        password: hashedPassword
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });
  
  // Delete user (admin only)
  app.delete("/api/users/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const currentUser = req.user as Express.User;
      
      // Only admins can delete users
      if (currentUser.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized role" });
      }
      
      const userId = parseInt(req.params.id);
      
      // Prevent deleting your own account
      if (userId === currentUser.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const result = await storage.deleteUser(userId);
      
      if (!result) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      next(error);
    }
  });
  
  // Update user (admin only)
  app.patch("/api/users/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const currentUser = req.user as Express.User;
      
      // Only admins can update users
      if (currentUser.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized role" });
      }
      
      const userId = parseInt(req.params.id);
      const userData = req.body;
      
      // If password is being updated, hash it
      if (userData.password) {
        userData.password = await hashPassword(userData.password);
      }
      
      const updatedUser = await storage.updateUser(userId, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
