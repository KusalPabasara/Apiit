import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, '../../data/db.json');

// Default data structure with all new collections
const defaultData = {
  users: [],
  incidents: [],
  emergencies: [],      // Emergency SOS with location tracking
  reliefCamps: [],      // Relief camp management
  rescueMissions: [],   // Rescue mission tracking
  alerts: [],           // Intelligent alert system
  
  // ===== NEW: Extracted Data Collections =====
  extractedSupplies: [],      // Supplies extracted from descriptions
  extractedLocations: [],     // Location categories from descriptions
  vulnerableGroups: [],       // Vulnerable groups identified
  adminReviewQueue: [],       // Items pending admin review
  keywordLearning: [],        // Admin corrections for keyword learning
  supplyAggregates: []        // Aggregated supply needs
};

// Create database instance
const adapter = new JSONFile(file);
const db = new Low(adapter, defaultData);

async function initDB() {
  // Read existing data
  await db.read();
  
  // Initialize with default data if empty
  db.data ||= defaultData;
  
  // Ensure all collections exist
  db.data.emergencies ||= [];
  db.data.reliefCamps ||= [];
  db.data.rescueMissions ||= [];
  db.data.alerts ||= [];
  
  // Ensure new extraction collections exist
  db.data.extractedSupplies ||= [];
  db.data.extractedLocations ||= [];
  db.data.vulnerableGroups ||= [];
  db.data.adminReviewQueue ||= [];
  db.data.keywordLearning ||= [];
  db.data.supplyAggregates ||= [];
  
  // Add default users if none exist
  if (db.data.users.length === 0) {
    const hashedPassword = bcrypt.hashSync('responder123', 10);
    const adminPassword = bcrypt.hashSync('admin123', 10);
    
    db.data.users = [
      { id: 'usr_001', username: 'responder1', password: hashedPassword, full_name: 'Kamal Perera', role: 'responder' },
      { id: 'usr_002', username: 'responder2', password: hashedPassword, full_name: 'Nimal Silva', role: 'responder' },
      { id: 'usr_003', username: 'responder3', password: hashedPassword, full_name: 'Sunil Fernando', role: 'responder' },
      { id: 'usr_admin', username: 'admin', password: adminPassword, full_name: 'HQ Admin', role: 'admin' }
    ];
    
    await db.write();
  }
  
  console.log('✅ Database initialized');
}

export { db, initDB };
