/**
 * Centralized file system operations for mock persistence.
 *
 * This module abstracts all `expo-file-system` usages (using the modern API
 * from SDK 54/expo-file-system 19). It provides safe, fire-and-forget fallback
 * methods for CSV mirroring and image copying, ensuring that failures do not
 * throw uncaught exceptions that crash the app.
 */

import { File, Paths } from 'expo-file-system';

export async function writeCsvFile(filename: string, content: string): Promise<void> {
  try {
    const file = new File(Paths.document, filename);
    file.write(content);
  } catch (error) {
    console.warn(`Failed to write to ${filename}:`, error);
  }
}

export async function readCsvFile(filename: string): Promise<string | null> {
  try {
    const file = new File(Paths.document, filename);
    if (file.exists) {
      return await file.text();
    }
    return null;
  } catch (error) {
    console.warn(`Failed to read from ${filename}:`, error);
    return null;
  }
}

export async function writeJsonFile(filename: string, data: any): Promise<void> {
  try {
    const file = new File(Paths.document, filename);
    file.write(JSON.stringify(data, null, 2));
  } catch (error) {
    console.warn(`Failed to write JSON to ${filename}:`, error);
  }
}

export async function readJsonFile(filename: string): Promise<any | null> {
  try {
    const file = new File(Paths.document, filename);
    if (file.exists) {
      const text = await file.text();
      return JSON.parse(text);
    }
    return null;
  } catch (error) {
    console.warn(`Failed to read JSON from ${filename}:`, error);
    return null;
  }
}

export async function deleteCsvFile(filename: string): Promise<void> {
  try {
    const file = new File(Paths.document, filename);
    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.warn(`Failed to delete ${filename}:`, error);
  }
}

export async function copyImageToDocumentStorage(sourceUri: string, filename: string): Promise<string> {
  try {
    const destFile = new File(Paths.document, filename);
    const sourceFile = new File(sourceUri.replace('file://', ''));
    
    // In SDK 54, File has copy methods, or we can just copy
    if (sourceFile.exists) {
      sourceFile.copy(destFile);
      return destFile.uri;
    }
    return sourceUri;
  } catch (error) {
    console.warn('Failed to copy image to document storage:', error);
    return sourceUri;
  }
}
