import { db } from "../index.js";
import { chirps } from "../schema.js";
import { asc, desc, eq } from "drizzle-orm";
export async function createChirp(chirp) {
    const [result] = await db
        .insert(chirps)
        .values(chirp)
        .onConflictDoNothing()
        .returning();
    return result;
}
export async function getChirps(sortBy = "asc") {
    if (sortBy === "asc") {
        const result = await db
            .select()
            .from(chirps)
            .orderBy(asc(chirps.createdAt));
        return result;
    }
    else {
        const result = await db
            .select()
            .from(chirps)
            .orderBy(desc(chirps.createdAt));
        return result;
    }
}
export async function getChirpsByAuthor(authorId, sortBy = "asc") {
    if (sortBy === "asc") {
        const result = await db
            .select()
            .from(chirps)
            .where(eq(chirps.userId, authorId))
            .orderBy(asc(chirps.createdAt));
        return result;
    }
    else {
        const result = await db
            .select()
            .from(chirps)
            .where(eq(chirps.userId, authorId))
            .orderBy(desc(chirps.createdAt));
        return result;
    }
}
export async function getChirp(chirpId) {
    const [result] = await db
        .select()
        .from(chirps)
        .where(eq(chirps.id, chirpId));
    return result;
}
export async function deleteChirp(chirpId) {
    const [result] = await db
        .delete(chirps)
        .where(eq(chirps.id, chirpId))
        .returning();
    return result;
}
