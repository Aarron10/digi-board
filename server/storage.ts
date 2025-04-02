import { users, type User, type InsertUser } from "@shared/schema";
import { announcements, type Announcement, type InsertAnnouncement } from "@shared/schema";
import { assignments, type Assignment, type InsertAssignment } from "@shared/schema";
import { materials, type Material, type InsertMaterial } from "@shared/schema";
import { events, type Event, type InsertEvent } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import connectPg from "connect-pg-simple";
import { eq } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  
  // Announcement operations
  getAnnouncement(id: number): Promise<Announcement | undefined>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: number, announcement: Partial<Announcement>): Promise<Announcement | undefined>;
  getAllAnnouncements(): Promise<Announcement[]>;
  
  // Assignment operations
  getAssignment(id: number): Promise<Assignment | undefined>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: number, assignment: Partial<Assignment>): Promise<Assignment | undefined>;
  getAllAssignments(): Promise<Assignment[]>;
  getAssignmentsByTeacher(teacherId: number): Promise<Assignment[]>;
  
  // Material operations
  getMaterial(id: number): Promise<Material | undefined>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: number, material: Partial<Material>): Promise<Material | undefined>;
  getAllMaterials(): Promise<Material[]>;
  getMaterialsByTeacher(teacherId: number): Promise<Material[]>;
  
  // Event operations
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<Event>): Promise<Event | undefined>;
  getAllEvents(): Promise<Event[]>;
  
  // Session store
  sessionStore: any; // Store type for the session
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private announcements: Map<number, Announcement>;
  private assignments: Map<number, Assignment>;
  private materials: Map<number, Material>;
  private events: Map<number, Event>;
  sessionStore: any;
  currentId: {
    users: number;
    announcements: number;
    assignments: number;
    materials: number;
    events: number;
  };

  constructor() {
    this.users = new Map();
    this.announcements = new Map();
    this.assignments = new Map();
    this.materials = new Map();
    this.events = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    this.currentId = {
      users: 1,
      announcements: 1,
      assignments: 1,
      materials: 1,
      events: 1,
    };
    
    // Add default admin user
    this.createUser({
      username: "admin",
      password: "password",
      name: "Admin User",
      role: "admin",
    });
    
    // Add default teacher user
    this.createUser({
      username: "teacher",
      password: "password",
      name: "Alex Johnson",
      role: "teacher",
    });
    
    // Add default student user
    this.createUser({
      username: "student",
      password: "password",
      name: "Emma Davis",
      role: "student",
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "student" // Ensure role is never undefined
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    if (!this.users.has(id)) return false;
    
    return this.users.delete(id);
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Announcement operations
  async getAnnouncement(id: number): Promise<Announcement | undefined> {
    return this.announcements.get(id);
  }

  async createAnnouncement(insertAnnouncement: InsertAnnouncement): Promise<Announcement> {
    const id = this.currentId.announcements++;
    const now = new Date();
    const announcement: Announcement = { 
      ...insertAnnouncement, 
      id, 
      createdAt: now,
      important: insertAnnouncement.important ?? null,
      category: insertAnnouncement.category ?? null,
      audience: insertAnnouncement.audience ?? null
    };
    this.announcements.set(id, announcement);
    return announcement;
  }
  
  async updateAnnouncement(id: number, announcementData: Partial<Announcement>): Promise<Announcement | undefined> {
    const announcement = await this.getAnnouncement(id);
    if (!announcement) return undefined;
    
    const updatedAnnouncement = { ...announcement, ...announcementData };
    this.announcements.set(id, updatedAnnouncement);
    return updatedAnnouncement;
  }
  
  async getAllAnnouncements(): Promise<Announcement[]> {
    return Array.from(this.announcements.values());
  }

  // Assignment operations
  async getAssignment(id: number): Promise<Assignment | undefined> {
    return this.assignments.get(id);
  }

  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    const id = this.currentId.assignments++;
    const now = new Date();
    const assignment: Assignment = { 
      ...insertAssignment, 
      id, 
      createdAt: now,
      status: insertAssignment.status ?? null,
      classId: insertAssignment.classId ?? null
    };
    this.assignments.set(id, assignment);
    return assignment;
  }
  
  async updateAssignment(id: number, assignmentData: Partial<Assignment>): Promise<Assignment | undefined> {
    const assignment = await this.getAssignment(id);
    if (!assignment) return undefined;
    
    const updatedAssignment = { ...assignment, ...assignmentData };
    this.assignments.set(id, updatedAssignment);
    return updatedAssignment;
  }
  
  async getAllAssignments(): Promise<Assignment[]> {
    return Array.from(this.assignments.values());
  }
  
  async getAssignmentsByTeacher(teacherId: number): Promise<Assignment[]> {
    return Array.from(this.assignments.values()).filter(
      (assignment) => assignment.teacherId === teacherId
    );
  }

  // Material operations
  async getMaterial(id: number): Promise<Material | undefined> {
    return this.materials.get(id);
  }

  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    const id = this.currentId.materials++;
    const now = new Date();
    const material: Material = { 
      ...insertMaterial, 
      id, 
      uploadedAt: now,
      category: insertMaterial.category ?? null,
      classId: insertMaterial.classId ?? null,
      fileUrl: insertMaterial.fileUrl ?? null
    };
    this.materials.set(id, material);
    return material;
  }
  
  async updateMaterial(id: number, materialData: Partial<Material>): Promise<Material | undefined> {
    const material = await this.getMaterial(id);
    if (!material) return undefined;
    
    const updatedMaterial = { ...material, ...materialData };
    this.materials.set(id, updatedMaterial);
    return updatedMaterial;
  }
  
  async getAllMaterials(): Promise<Material[]> {
    return Array.from(this.materials.values());
  }
  
  async getMaterialsByTeacher(teacherId: number): Promise<Material[]> {
    return Array.from(this.materials.values()).filter(
      (material) => material.teacherId === teacherId
    );
  }

  // Event operations
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.currentId.events++;
    const event: Event = { 
      ...insertEvent, 
      id,
      important: insertEvent.important ?? null,
      category: insertEvent.category ?? null,
      location: insertEvent.location ?? null
    };
    this.events.set(id, event);
    return event;
  }
  
  async updateEvent(id: number, eventData: Partial<Event>): Promise<Event | undefined> {
    const event = await this.getEvent(id);
    if (!event) return undefined;
    
    const updatedEvent = { ...event, ...eventData };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }
  
  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }
}

export class DatabaseStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  private client: ReturnType<typeof postgres>;
  sessionStore: any;
  
  constructor() {
    // Initialize database connection
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    this.client = postgres(connectionString);
    this.db = drizzle(this.client);
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString,
      },
      createTableIfMissing: true,
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(user).returning();
    return result[0];
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await this.db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const result = await this.db.delete(users)
      .where(eq(users.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  async getAllUsers(): Promise<User[]> {
    return this.db.select().from(users);
  }
  
  // Announcement operations
  async getAnnouncement(id: number): Promise<Announcement | undefined> {
    const result = await this.db.select().from(announcements).where(eq(announcements.id, id));
    return result[0];
  }
  
  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const result = await this.db.insert(announcements).values(announcement).returning();
    return result[0];
  }
  
  async updateAnnouncement(id: number, announcementData: Partial<Announcement>): Promise<Announcement | undefined> {
    const result = await this.db.update(announcements)
      .set(announcementData)
      .where(eq(announcements.id, id))
      .returning();
    return result[0];
  }
  
  async getAllAnnouncements(): Promise<Announcement[]> {
    return this.db.select().from(announcements);
  }
  
  // Assignment operations
  async getAssignment(id: number): Promise<Assignment | undefined> {
    const result = await this.db.select().from(assignments).where(eq(assignments.id, id));
    return result[0];
  }
  
  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const result = await this.db.insert(assignments).values(assignment).returning();
    return result[0];
  }
  
  async updateAssignment(id: number, assignmentData: Partial<Assignment>): Promise<Assignment | undefined> {
    const result = await this.db.update(assignments)
      .set(assignmentData)
      .where(eq(assignments.id, id))
      .returning();
    return result[0];
  }
  
  async getAllAssignments(): Promise<Assignment[]> {
    return this.db.select().from(assignments);
  }
  
  async getAssignmentsByTeacher(teacherId: number): Promise<Assignment[]> {
    return this.db.select().from(assignments).where(eq(assignments.teacherId, teacherId));
  }
  
  // Material operations
  async getMaterial(id: number): Promise<Material | undefined> {
    const result = await this.db.select().from(materials).where(eq(materials.id, id));
    return result[0];
  }
  
  async createMaterial(material: InsertMaterial): Promise<Material> {
    const result = await this.db.insert(materials).values(material).returning();
    return result[0];
  }
  
  async updateMaterial(id: number, materialData: Partial<Material>): Promise<Material | undefined> {
    const result = await this.db.update(materials)
      .set(materialData)
      .where(eq(materials.id, id))
      .returning();
    return result[0];
  }
  
  async getAllMaterials(): Promise<Material[]> {
    return this.db.select().from(materials);
  }
  
  async getMaterialsByTeacher(teacherId: number): Promise<Material[]> {
    return this.db.select().from(materials).where(eq(materials.teacherId, teacherId));
  }
  
  // Event operations
  async getEvent(id: number): Promise<Event | undefined> {
    const result = await this.db.select().from(events).where(eq(events.id, id));
    return result[0];
  }
  
  async createEvent(event: InsertEvent): Promise<Event> {
    const result = await this.db.insert(events).values(event).returning();
    return result[0];
  }
  
  async updateEvent(id: number, eventData: Partial<Event>): Promise<Event | undefined> {
    const result = await this.db.update(events)
      .set(eventData)
      .where(eq(events.id, id))
      .returning();
    return result[0];
  }
  
  async getAllEvents(): Promise<Event[]> {
    return this.db.select().from(events);
  }
}

// Always use DatabaseStorage with PostgreSQL
export const storage = new DatabaseStorage();
