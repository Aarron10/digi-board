import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model with role-based access
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["student", "teacher", "admin"] }).notNull().default("student"),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  authorId: integer("author_id").notNull(),
  important: boolean("important").default(false),
  category: text("category"),
  audience: text("audience"),
});

export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dueDate: timestamp("due_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  teacherId: integer("teacher_id").notNull(),
  classId: text("class_id"),
  status: text("status").default("active"),
});

export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  fileUrl: text("file_url"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  teacherId: integer("teacher_id").notNull(),
  classId: text("class_id"),
  category: text("category"),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  location: text("location"),
  createdBy: integer("created_by").notNull(),
  important: boolean("important").default(false),
  category: text("category"),
});

// Schema for insert operations
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).pick({
  title: true,
  content: true,
  authorId: true,
  important: true,
  category: true,
  audience: true,
});

export const insertAssignmentSchema = createInsertSchema(assignments)
  .pick({
    title: true,
    description: true,
    dueDate: true,
    teacherId: true,
    classId: true,
    status: true,
  })
  .extend({
    dueDate: z.union([z.date(), z.string()]).transform((val) => {
      if (typeof val === 'string') {
        return new Date(val);
      }
      return val;
    }),
  })
  .transform((data) => {
    // Ensure dueDate is properly converted to Date object if it's a string
    const dueDate = typeof data.dueDate === 'string' ? new Date(data.dueDate) : data.dueDate;
    
    return {
      ...data,
      dueDate,
    };
  });

export const insertMaterialSchema = createInsertSchema(materials).pick({
  title: true,
  description: true,
  fileUrl: true,
  teacherId: true,
  classId: true,
  category: true,
}).extend({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  fileUrl: z.string().min(1, "File is required"),
  teacherId: z.number().int().positive(),
  classId: z.string().optional(),
  category: z.string().optional(),
});

export const insertEventSchema = createInsertSchema(events)
  .pick({
    title: true,
    description: true,
    startDate: true,
    endDate: true,
    location: true,
    createdBy: true,
    important: true,
    category: true,
  })
  .transform((data) => {
    // Ensure dates are properly converted to Date objects if they're strings
    const startDate = typeof data.startDate === 'string' ? new Date(data.startDate) : data.startDate;
    const endDate = typeof data.endDate === 'string' ? new Date(data.endDate) : data.endDate;
    
    return {
      ...data,
      startDate,
      endDate,
    };
  });

// Types for insert operations
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;

// Types for select operations
export type User = typeof users.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type Material = typeof materials.$inferSelect;
export type Event = typeof events.$inferSelect;
