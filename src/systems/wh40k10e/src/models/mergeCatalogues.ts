import { type BattleScribeCatalogue, ensureArray } from '@providers-bsdata/types.js';

type CatalogueData = BattleScribeCatalogue['catalogue'];

/**
 * Merges arrays of items with @_id, later items override earlier ones.
 * Used internally to combine shared data from multiple catalogues.
 * @param arrays - Variable number of arrays to merge (later arrays override earlier ones)
 * @returns Merged array with duplicates removed (by @_id)
 */
function mergeById<T extends { '@_id': string }>(...arrays: (T[] | undefined)[]): T[] {
    const merged = new Map<string, T>();

    for (const items of arrays) {
        if (!items) {
            continue;
        }

        for (const item of items) {
            const id = item['@_id'];

            if (merged.has(id)) {
                merged.delete(id);
            }

            merged.set(id, item);
        }
    }

    return Array.from(merged.values());
}

/**
 * Merges multiple BattleScribe catalogues into a single catalogue.
 * Used for combining library files with faction-specific files.
 * Later catalogues override earlier ones when there are duplicate IDs.
 *
 * @param catalogues - Array of catalogues to merge (library first, then faction files)
 * @returns Merged catalogue with combined profiles, selection entries, rules, and categories
 *
 * @example
 * // Aeldari: Library + Craftworlds + Ynnari (3 files)
 * const merged = mergeCatalogues(library, craftworlds, ynnari);
 *
 * @example
 * // Drukhari: Library + Drukhari (2 files)
 * const merged = mergeCatalogues(library, drukhari);
 */
export function mergeCatalogues(...catalogues: BattleScribeCatalogue[]): BattleScribeCatalogue {
    if (catalogues.length === 0) {
        throw new Error('At least one catalogue is required to merge.');
    }

    if (catalogues.length === 1) {
        return catalogues[0];
    }

    const [firstCatalogue, ...rest] = catalogues;
    const mergedCatalogue: CatalogueData = { ...firstCatalogue.catalogue };

    for (const catalogue of rest) {
        Object.assign(mergedCatalogue, catalogue.catalogue);
    }

    const mergedSharedProfiles = mergeById(
        ...catalogues.map((catalogue) => ensureArray(catalogue.catalogue.sharedProfiles?.profile)),
    );

    const mergedSharedSelectionEntries = mergeById(
        ...catalogues.map((catalogue) => ensureArray(catalogue.catalogue.sharedSelectionEntries?.selectionEntry)),
    );

    const mergedSharedSelectionEntryGroups = mergeById(
        ...catalogues.map((catalogue) =>
            ensureArray(catalogue.catalogue.sharedSelectionEntryGroups?.selectionEntryGroup),
        ),
    );

    const mergedSharedRules = mergeById(
        ...catalogues.map((catalogue) => ensureArray(catalogue.catalogue.sharedRules?.rule)),
    );

    const mergedSelectionEntries = mergeById(
        ...catalogues.map((catalogue) => ensureArray(catalogue.catalogue.selectionEntries?.selectionEntry)),
    );

    const mergedCategoryEntries = mergeById(
        ...catalogues.map((catalogue) => ensureArray(catalogue.catalogue.categoryEntries?.categoryEntry)),
    );

    const merged: CatalogueData = {
        ...mergedCatalogue,
        sharedProfiles: mergedSharedProfiles.length > 0 ? { profile: mergedSharedProfiles } : undefined,
        sharedSelectionEntries:
            mergedSharedSelectionEntries.length > 0 ? { selectionEntry: mergedSharedSelectionEntries } : undefined,
        sharedSelectionEntryGroups:
            mergedSharedSelectionEntryGroups.length > 0
                ? { selectionEntryGroup: mergedSharedSelectionEntryGroups }
                : undefined,
        sharedRules: mergedSharedRules.length > 0 ? { rule: mergedSharedRules } : undefined,
        selectionEntries: mergedSelectionEntries.length > 0 ? { selectionEntry: mergedSelectionEntries } : undefined,
        categoryEntries: mergedCategoryEntries.length > 0 ? { categoryEntry: mergedCategoryEntries } : undefined,
    };

    return { catalogue: merged };
}
