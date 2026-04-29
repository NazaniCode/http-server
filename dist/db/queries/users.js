import { db } from "../index.js";
import { users } from "../schema.js";
export async function createUser(user) {
    const [result] = await db
        .insert(users)
        .values(user)
        .onConflictDoNothing()
        .returning();
    return result;
}
export async function getUsers() {
    const allUsers = await db
        .select()
        .from(users);
    return allUsers;
}
export async function resetUsers() {
    await db.delete(users);
}
