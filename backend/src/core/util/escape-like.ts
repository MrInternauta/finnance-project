/** Escapes LIKE/ILIKE wildcards (\, %, _) in user input so it is matched literally. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, match => `\\${match}`);
}
