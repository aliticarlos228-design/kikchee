/** Référence courte (4 caractères) pour affichage liste. */
export function shortRef(id: string): string {
  return id.replace(/-/g, '').slice(0, 4).toLowerCase();
}
