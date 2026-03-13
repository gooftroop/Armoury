import { describe, it, expect } from 'vitest';
import { mergeCatalogues } from '@/models/mergeCatalogues.js';
import type {
    BattleScribeCatalogue,
    BattleScribeProfile,
    BattleScribeSelectionEntry,
    BattleScribeRule,
    BattleScribeSelectionEntryGroup,
    BattleScribeCategory,
} from '@armoury/providers-bsdata';

/** Builds a profile entry for catalogue merging tests. */
const buildProfile = (id: string, name: string): BattleScribeProfile => ({
    '@_id': id,
    '@_name': name,
    '@_typeId': 'profile-type',
    '@_typeName': 'Abilities',
    characteristics: {
        characteristic: {
            '@_name': 'Description',
            '@_typeId': 'char-1',
            '#text': `${name} description`,
        },
    },
});

/** Builds a selection entry for catalogue merging tests. */
const buildSelectionEntry = (id: string, name: string): BattleScribeSelectionEntry => ({
    '@_id': id,
    '@_name': name,
    '@_type': 'unit',
});

/** Builds a selection entry group for catalogue merging tests. */
const buildSelectionEntryGroup = (id: string, name: string): BattleScribeSelectionEntryGroup => ({
    '@_id': id,
    '@_name': name,
});

/** Builds a shared rule for catalogue merging tests. */
const buildRule = (id: string, name: string): BattleScribeRule => ({
    '@_id': id,
    '@_name': name,
    description: `${name} description`,
});

/** Builds a category entry for catalogue merging tests. */
const buildCategory = (id: string, name: string): BattleScribeCategory => ({
    '@_id': id,
    '@_name': name,
});

/** Builds a minimal catalogue with customizable shared data. */
const buildCatalogue = (id: string, name: string, overrides: Partial<BattleScribeCatalogue['catalogue']> = {}) => {
    const catalogue: BattleScribeCatalogue = {
        catalogue: {
            '@_id': id,
            '@_name': name,
            '@_revision': '1',
            '@_battleScribeVersion': '2.03',
            '@_gameSystemId': 'gs-1',
            '@_gameSystemRevision': '1',
            ...overrides,
        },
    };

    return catalogue;
};

/** Describes mergeCatalogues behavior for various inputs. */
describe('mergeCatalogues', () => {
    /** Ensures merging zero catalogues throws an error. */
    it('throws when no catalogues are provided', () => {
        expect(() => mergeCatalogues()).toThrow('At least one catalogue is required to merge.');
    });

    /** Ensures a single catalogue is returned as-is. */
    it('returns the same catalogue when only one is provided', () => {
        const first = buildCatalogue('cat-1', 'First');
        const result = mergeCatalogues(first);
        expect(result).toBe(first);
    });

    /** Ensures duplicate shared profiles are overridden by later catalogues. */
    it('overrides shared profiles by id using later catalogues', () => {
        const first = buildCatalogue('cat-1', 'First', {
            sharedProfiles: { profile: [buildProfile('profile-1', 'Original')] },
        });
        const second = buildCatalogue('cat-2', 'Second', {
            sharedProfiles: { profile: [buildProfile('profile-1', 'Override')] },
        });
        const result = mergeCatalogues(first, second);
        const profiles = result.catalogue.sharedProfiles?.profile ?? [];
        const profileArray = Array.isArray(profiles) ? profiles : [profiles];
        expect(profileArray).toHaveLength(1);
        expect(profileArray[0]?.['@_name']).toBe('Override');
    });

    /** Ensures selection entries are merged and overridden by id. */
    it('merges selection entries with last write wins', () => {
        const first = buildCatalogue('cat-1', 'First', {
            selectionEntries: { selectionEntry: [buildSelectionEntry('entry-1', 'First Entry')] },
        });
        const second = buildCatalogue('cat-2', 'Second', {
            selectionEntries: { selectionEntry: [buildSelectionEntry('entry-1', 'Second Entry')] },
        });
        const result = mergeCatalogues(first, second);
        const entries = result.catalogue.selectionEntries?.selectionEntry ?? [];
        const entryArray = Array.isArray(entries) ? entries : [entries];
        expect(entryArray).toHaveLength(1);
        expect(entryArray[0]?.['@_name']).toBe('Second Entry');
    });

    /** Ensures shared rules and category entries are merged together. */
    it('merges shared rules and category entries across catalogues', () => {
        const first = buildCatalogue('cat-1', 'First', {
            sharedRules: { rule: [buildRule('rule-1', 'Rule One')] },
            categoryEntries: { categoryEntry: [buildCategory('cat-1', 'HQ')] },
        });
        const second = buildCatalogue('cat-2', 'Second', {
            sharedRules: { rule: [buildRule('rule-2', 'Rule Two')] },
            categoryEntries: { categoryEntry: [buildCategory('cat-2', 'Troops')] },
        });
        const result = mergeCatalogues(first, second);
        const rules = result.catalogue.sharedRules?.rule ?? [];
        const categories = result.catalogue.categoryEntries?.categoryEntry ?? [];
        const ruleArray = Array.isArray(rules) ? rules : [rules];
        const categoryArray = Array.isArray(categories) ? categories : [categories];
        expect(ruleArray).toHaveLength(2);
        expect(categoryArray).toHaveLength(2);
    });

    /** Ensures shared selection entry groups merge correctly. */
    it('merges shared selection entry groups by id', () => {
        const first = buildCatalogue('cat-1', 'First', {
            sharedSelectionEntryGroups: {
                selectionEntryGroup: [buildSelectionEntryGroup('group-1', 'Group One')],
            },
        });
        const second = buildCatalogue('cat-2', 'Second', {
            sharedSelectionEntryGroups: {
                selectionEntryGroup: [buildSelectionEntryGroup('group-1', 'Group Override')],
            },
        });
        const result = mergeCatalogues(first, second);
        const groups = result.catalogue.sharedSelectionEntryGroups?.selectionEntryGroup ?? [];
        const groupArray = Array.isArray(groups) ? groups : [groups];
        expect(groupArray).toHaveLength(1);
        expect(groupArray[0]?.['@_name']).toBe('Group Override');
    });

    /** Ensures empty merged arrays are omitted from the output. */
    it('omits merged sections when arrays are empty', () => {
        const first = buildCatalogue('cat-1', 'First');
        const second = buildCatalogue('cat-2', 'Second');
        const result = mergeCatalogues(first, second);
        expect(result.catalogue.sharedProfiles).toBeUndefined();
        expect(result.catalogue.selectionEntries).toBeUndefined();
        expect(result.catalogue.sharedRules).toBeUndefined();
    });
});
