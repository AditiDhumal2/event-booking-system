// src/lib/mongoUtils.ts

/**
 * Sanitizes MongoDB data by converting MongoDB documents to plain objects
 * and handling ObjectId conversion to strings
 */
export function sanitizeMongoData(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  // If it's a MongoDB document, convert to plain object
  if (obj && typeof obj.toJSON === 'function') {
    obj = obj.toJSON();
  }
  
  // Handle ObjectId and other MongoDB types
  if (obj && typeof obj === 'object') {
    // Handle _id field
    if (obj._id && typeof obj._id === 'object' && 'toString' in obj._id) {
      obj._id = obj._id.toString();
    }
    
    // Handle other ObjectId fields
    if (obj.userId && typeof obj.userId === 'object' && 'toString' in obj.userId) {
      obj.userId = obj.userId.toString();
    }
    
    if (obj.eventId && typeof obj.eventId === 'object' && 'toString' in obj.eventId) {
      obj.eventId = obj.eventId.toString();
    }
    
    // Handle nested eventId object
    if (obj.eventId && typeof obj.eventId === 'object') {
      if (obj.eventId._id && typeof obj.eventId._id === 'object' && 'toString' in obj.eventId._id) {
        obj.eventId._id = obj.eventId._id.toString();
      }
    }
    
    // Handle nested userId object
    if (obj.userId && typeof obj.userId === 'object') {
      if (obj.userId._id && typeof obj.userId._id === 'object' && 'toString' in obj.userId._id) {
        obj.userId._id = obj.userId._id.toString();
      }
    }
    
    // Handle Date objects
    if (obj.createdAt && obj.createdAt instanceof Date) {
      obj.createdAt = obj.createdAt.toISOString();
    }
    
    if (obj.updatedAt && obj.updatedAt instanceof Date) {
      obj.updatedAt = obj.updatedAt.toISOString();
    }
    
    if (obj.date && obj.date instanceof Date) {
      obj.date = obj.date.toISOString();
    }
    
    // Recursively handle arrays
    if (Array.isArray(obj)) {
      return obj.map(sanitizeMongoData);
    }
    
    // Recursively handle nested objects
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = sanitizeMongoData(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
}

/**
 * Converts a single MongoDB document to a plain object
 */
export function toPlainObject(doc: any): any {
  if (!doc) return doc;
  
  // If it has toObject method, use it
  if (typeof doc.toObject === 'function') {
    return sanitizeMongoData(doc.toObject());
  }
  
  // If it's already a plain object, sanitize it
  return sanitizeMongoData(doc);
}

/**
 * Converts an array of MongoDB documents to plain objects
 */
export function toPlainArray(docs: any[]): any[] {
  if (!Array.isArray(docs)) return docs;
  return docs.map(doc => toPlainObject(doc));
}