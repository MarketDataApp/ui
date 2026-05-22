/**
 * @typedef {Object} CopyButtonOptions
 * @property {ParentNode} [root=document] - Scope to search for groups
 */
/**
 * Initialize all copy buttons under `root`. Safe to call multiple times —
 * groups already wired are skipped.
 *
 * @param {CopyButtonOptions} [options]
 * @returns {() => void} Cleanup function — detaches listeners and clears pending resets
 */
export function initCopyButton({ root }?: CopyButtonOptions): () => void;
export type CopyButtonOptions = {
    /**
     * - Scope to search for groups
     */
    root?: ParentNode;
};
